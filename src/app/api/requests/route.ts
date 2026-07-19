import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  try {
    if (code) {
      const mr = await prisma.materialRequest.findUnique({
        where: { requestCode: code }
      });
      if (!mr) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      }
      const items = await prisma.materialRequestItem.findMany({
        where: { requestCode: code }
      });
      const comments = await prisma.comment.findMany({
        where: { recordType: 'MR', recordCode: code },
        orderBy: { timestamp: 'asc' }
      });
      return NextResponse.json({ request: mr, items, comments });
    }

    const requests = await prisma.materialRequest.findMany({
      orderBy: { requestDate: 'desc' }
    });
    return NextResponse.json({ requests });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      plant,
      departmentCode,
      requesterId,
      requesterName,
      priority,
      requiredByDate,
      purpose,
      productionBatch,
      project,
      machineCode,
      workOrderReference,
      remarks,
      items // Array of items: { itemCode, itemName, requiredQty, estimatedRate, urgentJustification }
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in request list' }, { status: 400 });
    }

    // Sequence generator for Request Code: NAX-MR-2026-XXXXX
    const year = new Date().getFullYear();
    const count = await prisma.materialRequest.count();
    const requestCode = `NAX-MR-${year}-${String(count + 1).padStart(5, '0')}`;

    const newRequest = await prisma.$transaction(async (tx) => {
      // Create request header
      const mr = await tx.materialRequest.create({
        data: {
          requestCode,
          plant,
          departmentCode,
          requesterId,
          requesterName,
          priority: priority || 'NORMAL',
          requiredByDate: new Date(requiredByDate),
          purpose,
          productionBatch: productionBatch || null,
          project: project || null,
          machineCode: machineCode || null,
          workOrderReference: workOrderReference || null,
          status: 'PENDING_DH',
          remarks
        }
      });

      // Create request items
      for (const itm of items) {
        await tx.materialRequestItem.create({
          data: {
            requestCode,
            itemCode: itm.itemCode,
            itemName: itm.itemName,
            requiredQty: parseFloat(itm.requiredQty),
            estimatedRate: parseFloat(itm.estimatedRate) || 0.0,
            estimatedValue: (parseFloat(itm.requiredQty) * (parseFloat(itm.estimatedRate) || 0.0)),
            urgentJustification: itm.urgentJustification || null,
            status: 'PENDING'
          }
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: requesterId,
          userName: requesterName,
          employeeCode: requesterId,
          activeRole: 'USER',
          module: 'REQUESTS',
          action: 'CREATE',
          recordType: 'MaterialRequest',
          recordCode: requestCode,
          newValue: JSON.stringify(mr)
        }
      });

      // Add comments if remarks present
      if (remarks) {
        await tx.comment.create({
          data: {
            recordType: 'MR',
            recordCode: requestCode,
            userName: requesterName,
            employeeCode: requesterId,
            role: 'USER',
            content: remarks
          }
        });
      }

      // Create notification for Department Head
      // In a real environment, we lookup DH. For seed, Robert Miller is Production Head
      await tx.notification.create({
        data: {
          employeeCode: 'NAX-EMP-00003', // Robert Miller
          title: 'New Material Request pending approval',
          message: `${requesterName} raised request ${requestCode} for ${items.length} items.`
        }
      });

      return mr;
    });

    return NextResponse.json({ success: true, request: newRequest });
  } catch (err: any) {
    console.error('Request Creation Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit request' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { requestCode, action, comment, itemsUpdate, employeeCode, userName, activeRole } = body;
    // action: 'DH_APPROVE', 'DH_REJECT', 'IV_ISSUE', 'IV_REJECT', 'SEND_TO_PURCHASE'

    const oldRequest = await prisma.materialRequest.findUnique({
      where: { requestCode }
    });

    if (!oldRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      // 1. Department Head Approval Action
      if (action === 'DH_APPROVE') {
        // Update request items status and estimated values if edited
        if (itemsUpdate && itemsUpdate.length > 0) {
          for (const up of itemsUpdate) {
            await tx.materialRequestItem.update({
              where: { requestCode_itemCode: { requestCode, itemCode: up.itemCode } },
              data: {
                requiredQty: parseFloat(up.requiredQty),
                estimatedValue: parseFloat(up.requiredQty) * (up.estimatedRate || 0.0),
                status: 'APPROVED'
              }
            });
          }
        }

        const mr = await tx.materialRequest.update({
          where: { requestCode },
          data: { status: 'PENDING_IV' }
        });

        // Notify Inventory Head
        await tx.notification.create({
          data: {
            employeeCode: 'NAX-EMP-00005', // Nikhil Kumar (Inventory Head)
            title: 'Material Request ready for verification',
            message: `Department Head approved request ${requestCode}. Stock issue pending.`
          }
        });

        // Log comment
        await tx.comment.create({
          data: {
            recordType: 'MR',
            recordCode: requestCode,
            userName,
            employeeCode,
            role: activeRole,
            content: comment || 'Department Head approved this material request.'
          }
        });

        return mr;
      }

      // 2. Department Head Rejection Action
      if (action === 'DH_REJECT') {
        const mr = await tx.materialRequest.update({
          where: { requestCode },
          data: { status: 'REJECTED' }
        });

        // Notify Requester
        await tx.notification.create({
          data: {
            employeeCode: mr.requesterId,
            title: 'Material Request Rejected',
            message: `Your request ${requestCode} was rejected by ${userName}. Reason: ${comment}`
          }
        });

        await tx.comment.create({
          data: {
            recordType: 'MR',
            recordCode: requestCode,
            userName,
            employeeCode,
            role: activeRole,
            content: comment || 'Material request rejected.'
          }
        });

        return mr;
      }

      // 3. Central Inventory Issue Action (CRITICAL DATABASE TRANSACTION!)
      if (action === 'IV_ISSUE') {
        const reqItems = await tx.materialRequestItem.findMany({
          where: { requestCode }
        });

        for (const item of reqItems) {
          // Lock/find the active stock balance record
          const balance = await tx.stockBalance.findFirst({
            where: {
              itemCode: item.itemCode,
              warehouse: 'MAIN',
              location: { not: 'QUARANTINE_AREA' }, // do not issue quarantine stock
              availableQty: { gte: item.requiredQty }
            }
          });

          if (!balance) {
            throw new Error(`Insufficient available stock for item ${item.itemName} (${item.itemCode}) to issue full request.`);
          }

          // Recalculate available stock
          const newPhysical = balance.physicalQty - item.requiredQty;
          const newAvailable = balance.availableQty - item.requiredQty;

          // Update stock balance
          await tx.stockBalance.update({
            where: { id: balance.id },
            data: {
              physicalQty: newPhysical,
              availableQty: newAvailable
            }
          });

          // Insert stock ledger entry (IMMUTABLE RECORD!)
          const countLedger = await tx.stockLedger.count();
          const ledgerCode = `NAX-MI-${new Date().getFullYear()}-${String(countLedger + 1).padStart(5, '0')}`;

          await tx.stockLedger.create({
            data: {
              transactionCode: ledgerCode,
              itemCode: item.itemCode,
              warehouse: balance.warehouse,
              location: balance.location,
              batchNumber: balance.batchNumber,
              serialNumber: balance.serialNumber,
              transactionType: 'ISSUE',
              qtyIn: 0.0,
              qtyOut: item.requiredQty,
              runningBalance: newPhysical,
              unitRate: 12.50, // simulated standard item value
              transactionValue: item.requiredQty * 12.50,
              referenceType: 'MR',
              referenceCode: requestCode,
              performedBy: employeeCode,
              activeRole,
              comment: comment || 'Stock issued against material request'
            }
          });

          // Update item level issuedQty
          await tx.materialRequestItem.update({
            where: { requestCode_itemCode: { requestCode, itemCode: item.itemCode } },
            data: {
              issuedQty: item.requiredQty,
              status: 'ISSUED'
            }
          });
        }

        const mr = await tx.materialRequest.update({
          where: { requestCode },
          data: { status: 'ISSUED' }
        });

        // Notify Requester
        await tx.notification.create({
          data: {
            employeeCode: mr.requesterId,
            title: 'Material Issued',
            message: `Material from request ${requestCode} has been successfully issued by центральный склад.`
          }
        });

        // If this issue is linked to a machine breakdown or work order, update spare part consumption
        if (mr.workOrderReference) {
          for (const item of reqItems) {
            await tx.sparePartUsage.create({
              data: {
                workOrderCode: mr.workOrderReference,
                itemCode: item.itemCode,
                itemName: item.itemName,
                qty: item.requiredQty,
                unitRate: 12.50,
                totalValue: item.requiredQty * 12.50,
                requestedBy: mr.requesterId,
                issuedBy: employeeCode
              }
            });

            // Aggregate cost on work order
            const wo = await tx.workOrder.findUnique({ where: { workOrderCode: mr.workOrderReference } });
            if (wo) {
              const spareCost = wo.spareCost + (item.requiredQty * 12.50);
              await tx.workOrder.update({
                where: { workOrderCode: mr.workOrderReference },
                data: {
                  spareCost,
                  totalCost: spareCost + wo.vendorCost
                }
              });
            }
          }
        }

        await tx.comment.create({
          data: {
            recordType: 'MR',
            recordCode: requestCode,
            userName,
            employeeCode,
            role: activeRole,
            content: comment || 'Stock issue completed.'
          }
        });

        return mr;
      }

      // 4. Send unavailable quantity to Purchase Requisition (Procurement route)
      if (action === 'SEND_TO_PURCHASE') {
        const reqItems = await tx.materialRequestItem.findMany({
          where: { requestCode }
        });

        for (const item of reqItems) {
          const prCount = await tx.purchaseRequisition.count();
          const prCode = `NAX-PR-${new Date().getFullYear()}-${String(prCount + 1).padStart(5, '0')}`;

          await tx.purchaseRequisition.create({
            data: {
              prCode,
              requestCode,
              departmentCode: oldRequest.departmentCode,
              itemCode: item.itemCode,
              itemName: item.itemName,
              requiredQty: item.requiredQty,
              requiredByDate: oldRequest.requiredByDate,
              priority: oldRequest.priority,
              lastPurchaseRate: 12.50,
              estimatedValue: item.requiredQty * 12.50,
              status: 'PENDING_PURCHASE'
            }
          });

          await tx.materialRequestItem.update({
            where: { requestCode_itemCode: { requestCode, itemCode: item.itemCode } },
            data: { status: 'PURCHASE_REQUIRED' }
          });
        }

        const mr = await tx.materialRequest.update({
          where: { requestCode },
          data: { status: 'PARTIALLY_DELIVERED' } // simulated transitional state
        });

        // Notify Purchase Manager
        await tx.notification.create({
          data: {
            employeeCode: 'NAX-EMP-00006', // Pradeep Sharma
            title: 'New Purchase Requisitions Raised',
            message: `Material Request ${requestCode} items routed to Procurement due to stockout.`
          }
        });

        await tx.comment.create({
          data: {
            recordType: 'MR',
            recordCode: requestCode,
            userName,
            employeeCode,
            role: activeRole,
            content: comment || 'Stock unavailable. Requisitions forwarded to Purchase Department.'
          }
        });

        return mr;
      }

      return oldRequest;
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: userName,
        userName,
        employeeCode,
        activeRole,
        module: 'REQUESTS',
        action: 'UPDATE',
        recordType: 'MaterialRequest',
        recordCode: requestCode,
        oldValue: JSON.stringify(oldRequest),
        newValue: JSON.stringify(updatedRequest)
      }
    });

    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (err: any) {
    console.error('Update Request Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update request' }, { status: 500 });
  }
}
