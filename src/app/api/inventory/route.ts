import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const balances = await prisma.stockBalance.findMany({
      orderBy: { itemCode: 'asc' }
    });
    const ledger = await prisma.stockLedger.findMany({
      orderBy: { dateTime: 'desc' },
      take: 50
    });
    const transfers = await prisma.stockTransfer.findMany({
      orderBy: { dispatchDate: 'desc' }
    });
    const adjustments = await prisma.stockAdjustment.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ balances, ledger, transfers, adjustments });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch inventory data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, employeeCode, userName, activeRole } = body;

    // 1. Stock Adjustment (INCREASE / DECREASE)
    if (action === 'ADJUST_STOCK') {
      const { itemCode, warehouse, location, batchNumber, qtyDifference, reason } = body;
      const diff = parseFloat(qtyDifference);
      
      const countAdj = await prisma.stockAdjustment.count();
      const adjustmentCode = `NAX-SA-${new Date().getFullYear()}-${String(countAdj + 1).padStart(5, '0')}`;

      const adjustment = await prisma.$transaction(async (tx) => {
        // Create Adjustment ticket
        const adj = await tx.stockAdjustment.create({
          data: {
            adjustmentCode,
            warehouse,
            location,
            itemCode,
            batchNumber: batchNumber || 'NA',
            qtyDifference: diff,
            adjustmentType: diff > 0 ? 'INCREASE' : 'DECREASE',
            reason,
            requestedBy: employeeCode,
            approvedBy: employeeCode, // auto-approved for mock purposes
            status: 'APPROVED'
          }
        });

        // Update Stock Balance
        const balance = await tx.stockBalance.findFirst({
          where: { itemCode, warehouse, location, batchNumber }
        });

        if (balance) {
          const newPhys = balance.physicalQty + diff;
          const newAvail = balance.availableQty + diff;
          
          if (newPhys < 0 || newAvail < 0) {
            throw new Error('Stock adjustment cannot result in negative stock balance.');
          }

          await tx.stockBalance.update({
            where: { id: balance.id },
            data: { physicalQty: newPhys, availableQty: newAvail }
          });
        } else {
          if (diff < 0) {
            throw new Error('Cannot perform negative stock adjustment on empty stock.');
          }
          await tx.stockBalance.create({
            data: {
              itemCode,
              warehouse,
              location,
              batchNumber: batchNumber || 'NA',
              serialNumber: 'NA',
              physicalQty: diff,
              availableQty: diff
            }
          });
        }

        // Insert Stock Ledger Entry (IMMUTABLE LOG!)
        const countLedger = await tx.stockLedger.count();
        const ledgerCode = `NAX-SA-${new Date().getFullYear()}-${String(countLedger + 1).padStart(5, '0')}`;

        await tx.stockLedger.create({
          data: {
            transactionCode: ledgerCode,
            itemCode,
            warehouse,
            location,
            batchNumber: batchNumber || 'NA',
            serialNumber: 'NA',
            transactionType: diff > 0 ? 'ADJUST_INC' : 'ADJUST_DEC',
            qtyIn: diff > 0 ? diff : 0.0,
            qtyOut: diff < 0 ? Math.abs(diff) : 0.0,
            runningBalance: balance ? (balance.physicalQty + diff) : diff,
            unitRate: 12.50,
            transactionValue: Math.abs(diff) * 12.50,
            referenceType: 'STOCK_ADJ',
            referenceCode: adjustmentCode,
            performedBy: employeeCode,
            activeRole,
            comment: reason
          }
        });

        return adj;
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: userName,
          userName,
          employeeCode,
          activeRole,
          module: 'INVENTORY',
          action: 'CREATE',
          recordType: 'StockAdjustment',
          recordCode: adjustmentCode,
          newValue: JSON.stringify(adjustment)
        }
      });

      return NextResponse.json({ success: true, adjustment });
    }

    // 2. Warehouse Stock Transfer Dispatch
    if (action === 'TRANSFER_STOCK') {
      const { sourceWarehouse, destWarehouse, itemCode, qty, batchNumber, comments } = body;
      const countTrsf = await prisma.stockTransfer.count();
      const transferCode = `NAX-ST-${new Date().getFullYear()}-${String(countTrsf + 1).padStart(5, '0')}`;

      const trsfQty = parseFloat(qty);

      const transfer = await prisma.$transaction(async (tx) => {
        // Find and deduct from source stock
        const sourceBal = await tx.stockBalance.findFirst({
          where: { itemCode, warehouse: sourceWarehouse, batchNumber }
        });

        if (!sourceBal || sourceBal.availableQty < trsfQty) {
          throw new Error('Insufficient stock in source warehouse to transfer.');
        }

        // Deduct source stock
        await tx.stockBalance.update({
          where: { id: sourceBal.id },
          data: {
            physicalQty: sourceBal.physicalQty - trsfQty,
            availableQty: sourceBal.availableQty - trsfQty
          }
        });

        // Write dispatch stock ledger
        const countLedger = await tx.stockLedger.count();
        const ledgerCode = `NAX-ST-${new Date().getFullYear()}-${String(countLedger + 1).padStart(5, '0')}`;
        await tx.stockLedger.create({
          data: {
            transactionCode: ledgerCode,
            itemCode,
            warehouse: sourceWarehouse,
            location: sourceBal.location,
            batchNumber: batchNumber || 'NA',
            serialNumber: 'NA',
            transactionType: 'TRANSFER_OUT',
            qtyIn: 0.0,
            qtyOut: trsfQty,
            runningBalance: sourceBal.physicalQty - trsfQty,
            unitRate: 12.50,
            transactionValue: trsfQty * 12.50,
            referenceType: 'TRANSFER',
            referenceCode: transferCode,
            performedBy: employeeCode,
            activeRole,
            comment: `Dispatched transfer to ${destWarehouse}`
          }
        });

        // Create Transfer log
        return await tx.stockTransfer.create({
          data: {
            transferCode,
            sourceWarehouse,
            destWarehouse,
            itemCode,
            qty: trsfQty,
            batchNumber: batchNumber || 'NA',
            serialNumber: 'NA',
            dispatchedBy: employeeCode,
            status: 'IN_TRANSIT',
            comments
          }
        });
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: userName,
          userName,
          employeeCode,
          activeRole,
          module: 'INVENTORY',
          action: 'CREATE',
          recordType: 'StockTransfer',
          recordCode: transferCode,
          newValue: JSON.stringify(transfer)
        }
      });

      return NextResponse.json({ success: true, transfer });
    }

    // 3. Warehouse Stock Transfer Receive
    if (action === 'RECEIVE_TRANSFER') {
      const { transferCode, receiptComments } = body;

      const transfer = await prisma.$transaction(async (tx) => {
        const trsf = await tx.stockTransfer.findUnique({ where: { transferCode } });
        if (!trsf || trsf.status !== 'IN_TRANSIT') {
          throw new Error('Transfer log not found or not in-transit.');
        }

        // Add stock to destination warehouse
        const destBal = await tx.stockBalance.findFirst({
          where: {
            itemCode: trsf.itemCode,
            warehouse: trsf.destWarehouse,
            batchNumber: trsf.batchNumber
          }
        });

        if (destBal) {
          await tx.stockBalance.update({
            where: { id: destBal.id },
            data: {
              physicalQty: destBal.physicalQty + trsf.qty,
              availableQty: destBal.availableQty + trsf.qty
            }
          });
        } else {
          await tx.stockBalance.create({
            data: {
              itemCode: trsf.itemCode,
              warehouse: trsf.destWarehouse,
              location: 'GEN-LOC',
              batchNumber: trsf.batchNumber,
              serialNumber: 'NA',
              physicalQty: trsf.qty,
              availableQty: trsf.qty
            }
          });
        }

        // Write receipt stock ledger
        const countLedger = await tx.stockLedger.count();
        const ledgerCode = `NAX-ST-${new Date().getFullYear()}-${String(countLedger + 1).padStart(5, '0')}`;
        await tx.stockLedger.create({
          data: {
            transactionCode: ledgerCode,
            itemCode: trsf.itemCode,
            warehouse: trsf.destWarehouse,
            location: 'GEN-LOC',
            batchNumber: trsf.batchNumber,
            serialNumber: 'NA',
            transactionType: 'TRANSFER_IN',
            qtyIn: trsf.qty,
            qtyOut: 0.0,
            runningBalance: destBal ? (destBal.physicalQty + trsf.qty) : trsf.qty,
            unitRate: 12.50,
            transactionValue: trsf.qty * 12.50,
            referenceType: 'TRANSFER',
            referenceCode: transferCode,
            performedBy: employeeCode,
            activeRole,
            comment: `Received transfer. Note: ${receiptComments || ''}`
          }
        });

        // Close Transfer log
        return await tx.stockTransfer.update({
          where: { transferCode },
          data: {
            status: 'COMPLETED',
            receiptDate: new Date(),
            receivedBy: employeeCode,
            comments: trsf.comments + ` | Receipt note: ${receiptComments || ''}`
          }
        });
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: userName,
          userName,
          employeeCode,
          activeRole,
          module: 'INVENTORY',
          action: 'UPDATE',
          recordType: 'StockTransfer',
          recordCode: transferCode,
          newValue: JSON.stringify(transfer)
        }
      });

      return NextResponse.json({ success: true, transfer });
    }

    return NextResponse.json({ error: 'Invalid inventory action' }, { status: 400 });
  } catch (err: any) {
    console.error('Inventory API error:', err);
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
