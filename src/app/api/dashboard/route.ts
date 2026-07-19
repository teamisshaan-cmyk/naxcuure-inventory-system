import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // 1. Core Summary Metrics
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: 'ACTIVE' } });
    const totalDepts = await prisma.department.count();
    const totalItems = await prisma.item.count();
    
    // Inventory Calculations
    const stockBalances = await prisma.stockBalance.findMany();
    const totalInvValue = stockBalances.reduce((sum, item) => sum + (item.physicalQty * 12.5), 0); // Simulated standard rate factor

    // Stock thresholds
    const itemsList = await prisma.item.findMany();
    let outOfStock = 0;
    let lowStock = 0;
    const lowStockItems: any[] = [];
    
    itemsList.forEach((itm) => {
      const balance = stockBalances
        .filter((sb) => sb.itemCode === itm.itemCode)
        .reduce((sum, b) => sum + b.availableQty, 0);
      
      if (balance === 0) {
        outOfStock++;
        lowStockItems.push({ code: itm.itemCode, name: itm.name, balance, reorderLevel: itm.reorderLevel });
      } else if (balance <= itm.reorderLevel) {
        lowStock++;
        lowStockItems.push({ code: itm.itemCode, name: itm.name, balance, reorderLevel: itm.reorderLevel });
      }
    });

    // Request metrics
    const pendingMR_DH = await prisma.materialRequest.count({ where: { status: 'PENDING_DH' } });
    const pendingMR_IV = await prisma.materialRequest.count({ where: { status: 'PENDING_IV' } });
    
    const pendingRequestsList = await prisma.materialRequest.findMany({
      where: { status: { in: ['PENDING_DH', 'PENDING_IV'] } },
      orderBy: { requestDate: 'desc' },
      take: 5
    });
    
    // Purchase metrics
    const openPR = await prisma.purchaseRequisition.count({ where: { status: 'PENDING_PURCHASE' } });
    const openPO = await prisma.purchaseOrder.count({
      where: {
        status: { in: ['UNDER_APPROVAL', 'APPROVED', 'SENT_TO_VENDOR', 'ACKNOWLEDGED', 'PARTIALLY_DELIVERED'] }
      }
    });
    
    const recentPOs = await prisma.purchaseOrder.findMany({
      where: { status: { notIn: ['CLOSED', 'CANCELLED'] } },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Maintenance metrics
    const openBreakdowns = await prisma.breakdown.count({
      where: { status: { in: ['REPORTED', 'APPROVED', 'ASSIGNED', 'IN_REPAIR', 'TRIAL_RUN'] } }
    });
    const criticalBreakdowns = await prisma.breakdown.count({
      where: {
        status: { in: ['REPORTED', 'APPROVED', 'ASSIGNED', 'IN_REPAIR', 'TRIAL_RUN'] },
        priority: 'CRITICAL'
      }
    });

    // Calculate maintenance costs (spares + labor)
    const workOrders = await prisma.workOrder.findMany();
    const totalMaintenanceCost = workOrders.reduce((sum, wo) => sum + wo.spareCost + wo.vendorCost, 0);

    // Department consumption charts aggregation
    const issues = await prisma.stockLedger.findMany({
      where: { transactionType: 'ISSUE' }
    });
    
    const deptMap: { [key: string]: number } = {};
    
    issues.forEach((issue) => {
      const val = issue.transactionValue || 0;
      const dept = issue.referenceCode || 'Unknown';
      deptMap[dept] = (deptMap[dept] || 0) + val;
    });

    const deptConsumption = Object.keys(deptMap).map((name) => ({
      name,
      value: Math.round(deptMap[name])
    })).sort((a, b) => b.value - a.value);

    // Machine Downtime Breakdown
    const activeDowntimes = await prisma.breakdown.findMany({
      where: { status: { notIn: ['RESOLVED', 'REJECTED'] } },
      orderBy: { reportedAt: 'desc' },
      take: 5
    });

    // Recent Users for HR
    const recentUsers = await prisma.user.findMany({
      orderBy: { employeeCode: 'asc' },
      take: 5
    });

    return NextResponse.json({
      summary: {
        totalUsers,
        activeUsers,
        totalDepts,
        totalItems,
        totalInvValue: Math.round(totalInvValue),
        outOfStock,
        lowStock,
        pendingMR_DH,
        pendingMR_IV,
        openPR,
        openPO,
        openBreakdowns,
        criticalBreakdowns,
        totalMaintenanceCost: Math.round(totalMaintenanceCost)
      },
      charts: {
        deptConsumption,
        activeDowntimes: activeDowntimes.map(d => ({
          code: d.breakdownCode,
          machine: d.machineName,
          priority: d.priority,
          reportedAt: d.reportedAt,
          status: d.status
        }))
      },
      lists: {
        recentUsers: recentUsers.map(u => ({
          code: u.employeeCode,
          name: u.fullName,
          designation: u.designation,
          status: u.status
        })),
        pendingRequests: pendingRequestsList.map(r => ({
          code: r.requestCode,
          purpose: r.purpose,
          status: r.status,
          date: r.requestDate
        })),
        lowStockItems: lowStockItems.slice(0, 5),
        recentPOs: recentPOs.map(po => ({
          code: po.poCode,
          vendor: po.vendorCode,
          value: po.totalAmount,
          status: po.status
        }))
      }
    });
  } catch (err) {
    console.error('Dashboard API Error:', err);
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
}
