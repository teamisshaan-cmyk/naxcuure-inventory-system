import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const machines = await prisma.machine.findMany({ orderBy: { machineCode: 'asc' } });
    const breakdowns = await prisma.breakdown.findMany({ orderBy: { reportedAt: 'desc' } });
    const workOrders = await prisma.workOrder.findMany({ orderBy: { createdAt: 'desc' } });
    const pmSchedules = await prisma.preventiveMaintenanceSchedule.findMany({ orderBy: { nextRun: 'asc' } });

    return NextResponse.json({ machines, breakdowns, workOrders, pmSchedules });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch maintenance data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, employeeCode, userName, activeRole } = body;

    // 1. Report Breakdown
    if (action === 'REPORT_BREAKDOWN') {
      const {
        machineCode,
        problemCategory,
        problemDescription,
        productionBatch,
        priority,
        safetyImpact,
        qualityImpact,
        productionImpact,
        estimatedLoss,
        operator,
        immediateAction
      } = body;

      const bdCount = await prisma.breakdown.count();
      const breakdownCode = `NAX-BD-${new Date().getFullYear()}-${String(bdCount + 1).padStart(5, '0')}`;

      const result = await prisma.$transaction(async (tx) => {
        const machine = await tx.machine.findUnique({ where: { machineCode } });
        if (!machine) throw new Error('Machine not found');

        // Create breakdown record
        const bd = await tx.breakdown.create({
          data: {
            breakdownCode,
            machineCode,
            machineName: machine.name,
            departmentCode: machine.departmentCode,
            problemCategory,
            problemDescription,
            productionBatch: productionBatch || null,
            priority: priority || 'NORMAL',
            safetyImpact: !!safetyImpact,
            qualityImpact: !!qualityImpact,
            productionImpact: !!productionImpact,
            estimatedLoss: parseFloat(estimatedLoss) || 0.0,
            reportedBy: employeeCode,
            operator: operator || null,
            immediateAction: immediateAction || null,
            status: 'REPORTED'
          }
        });

        // Update Machine Status to BREAKDOWN
        await tx.machine.update({
          where: { machineCode },
          data: { status: 'BREAKDOWN' }
        });

        // Insert Status History
        await tx.machineStatusHistory.create({
          data: {
            machineCode,
            status: 'BREAKDOWN',
            reason: `Breakdown reported: ${breakdownCode}`,
            performedBy: employeeCode
          }
        });

        // Create Work Order placeholder auto-assigned or draft
        const woCount = await tx.workOrder.count();
        const workOrderCode = `NAX-WO-${new Date().getFullYear()}-${String(woCount + 1).padStart(5, '0')}`;
        await tx.workOrder.create({
          data: {
            workOrderCode,
            breakdownCode,
            machineCode,
            status: 'ASSIGNED',
            plannedStart: new Date(),
            targetCompletion: new Date(Date.now() + 86400000) // 24 hours target
          }
        });

        // Notify Maintenance Head
        await tx.notification.create({
          data: {
            employeeCode: 'NAX-EMP-00004', // David Vance
            title: `Breakdown Alert: ${machine.name}`,
            message: `A breakdown has been reported by operator. Priority: ${priority}.`
          }
        });

        return bd;
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: userName,
          userName,
          employeeCode,
          activeRole,
          module: 'MAINTENANCE',
          action: 'CREATE',
          recordType: 'Breakdown',
          recordCode: breakdownCode,
          newValue: JSON.stringify(result)
        }
      });

      return NextResponse.json({ success: true, breakdown: result });
    }

    // 2. Complete Work Order Repair
    if (action === 'COMPLETE_REPAIR') {
      const {
        workOrderCode,
        assignedTechnician,
        diagnosis,
        workPerformed,
        rootCause,
        correctiveAction,
        preventiveAction,
        laborHours,
        vendorCost
      } = body;

      const wo = await prisma.workOrder.findUnique({ where: { workOrderCode } });
      if (!wo) return NextResponse.json({ error: 'Work Order not found' }, { status: 404 });

      const updatedWo = await prisma.$transaction(async (tx) => {
        // Update Work Order Details
        const updated = await tx.workOrder.update({
          where: { workOrderCode },
          data: {
            assignedTechnician: assignedTechnician || employeeCode,
            diagnosis,
            workPerformed,
            rootCause,
            correctiveAction,
            preventiveAction,
            laborHours: parseFloat(laborHours) || 0.0,
            vendorCost: parseFloat(vendorCost) || 0.0,
            status: 'TRIAL_RUN',
            actualCompletion: new Date(),
            actualStart: wo.actualStart || new Date()
          }
        });

        // Update breakdown status
        if (wo.breakdownCode) {
          await tx.breakdown.update({
            where: { breakdownCode: wo.breakdownCode },
            data: { status: 'TRIAL_RUN' }
          });
        }

        // Update Machine Status to TRIAL
        await tx.machine.update({
          where: { machineCode: wo.machineCode },
          data: { status: 'UNDER_VALIDATION' }
        });

        // Notify Department Head
        const machine = await tx.machine.findUnique({ where: { machineCode: wo.machineCode } });
        await tx.notification.create({
          data: {
            employeeCode: machine?.ownerId || 'NAX-EMP-00003', // default to Production Head
            title: `Repair Trial Run Pending`,
            message: `Work Order ${workOrderCode} repair completed. Awaiting trial run verification.`
          }
        });

        return updated;
      });

      return NextResponse.json({ success: true, workOrder: updatedWo });
    }

    // 3. Verify Trial & Close Work Order
    if (action === 'VERIFY_TRIAL') {
      const { workOrderCode, trialRunResult, verificationComment } = body;

      const wo = await prisma.workOrder.findUnique({ where: { workOrderCode } });
      if (!wo) return NextResponse.json({ error: 'Work Order not found' }, { status: 404 });

      const result = await prisma.$transaction(async (tx) => {
        const isSuccess = trialRunResult === 'SUCCESS';

        const updated = await tx.workOrder.update({
          where: { workOrderCode },
          data: {
            trialRunResult,
            verificationComment,
            status: isSuccess ? 'CLOSED' : 'REOPENED',
            totalCost: wo.spareCost + wo.vendorCost
          }
        });

        // Update machine status
        await tx.machine.update({
          where: { machineCode: wo.machineCode },
          data: {
            status: isSuccess ? 'RUNNING' : 'BREAKDOWN',
            lastPMDate: isSuccess ? new Date() : undefined
          }
        });

        // Log Status History
        await tx.machineStatusHistory.create({
          data: {
            machineCode: wo.machineCode,
            status: isSuccess ? 'RUNNING' : 'BREAKDOWN',
            reason: isSuccess ? `Verification success: Work Order ${workOrderCode} closed` : `Trial run failed: re-opening repair`,
            performedBy: employeeCode
          }
        });

        // Update breakdown status
        if (wo.breakdownCode) {
          await tx.breakdown.update({
            where: { breakdownCode: wo.breakdownCode },
            data: { status: isSuccess ? 'RESOLVED' : 'ASSIGNED' }
          });
        }

        // Notify Maintenance Tech
        await tx.notification.create({
          data: {
            employeeCode: wo.assignedTechnician || 'NAX-EMP-00008',
            title: isSuccess ? 'Work Order Verified & Closed' : 'Work Order Re-opened (Trial failed)',
            message: `Work Order ${workOrderCode} trial results: ${trialRunResult}. Note: ${verificationComment}`
          }
        });

        return updated;
      });

      return NextResponse.json({ success: true, workOrder: result });
    }

    // 4. Run Preventive Maintenance (PM) Checklist
    if (action === 'RUN_PM') {
      const { scheduleCode } = body;

      const schedule = await prisma.preventiveMaintenanceSchedule.findUnique({ where: { scheduleCode } });
      if (!schedule) return NextResponse.json({ error: 'PM Schedule not found' }, { status: 404 });

      const updatedSchedule = await prisma.$transaction(async (tx) => {
        // Calculate next PM run date (Add 30 days for Monthly recurrence)
        const nextPM = new Date();
        nextPM.setDate(nextPM.getDate() + 30);

        const updated = await tx.preventiveMaintenanceSchedule.update({
          where: { scheduleCode },
          data: {
            lastRun: new Date(),
            nextRun: nextPM,
            status: 'ACTIVE'
          }
        });

        // Log PM completion on machine
        await tx.machine.update({
          where: { machineCode: schedule.machineCode },
          data: {
            lastPMDate: new Date(),
            nextPMDate: nextPM,
            status: 'RUNNING'
          }
        });

        // Create notification
        await tx.notification.create({
          data: {
            employeeCode: 'NAX-EMP-00004', // David Vance
            title: `PM Completed: ${schedule.machineName}`,
            message: `Preventive Maintenance completed successfully. Next PM scheduled: ${nextPM.toLocaleDateString()}.`
          }
        });

        // Write Audit log
        await tx.auditLog.create({
          data: {
            userId: userName,
            userName,
            employeeCode,
            activeRole,
            module: 'MAINTENANCE',
            action: 'UPDATE',
            recordType: 'PreventiveMaintenanceSchedule',
            recordCode: scheduleCode,
            newValue: `PM completed for machine ${schedule.machineCode}`
          }
        });

        return updated;
      });

      return NextResponse.json({ success: true, schedule: updatedSchedule });
    }

    return NextResponse.json({ error: 'Invalid maintenance action' }, { status: 400 });
  } catch (err: any) {
    console.error('Maintenance API error:', err);
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
