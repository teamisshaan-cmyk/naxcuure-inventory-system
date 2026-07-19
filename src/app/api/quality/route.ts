import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const grns = await prisma.goodsReceipt.findMany({ orderBy: { receivedDate: 'desc' } });
    const inspections = await prisma.qualityInspection.findMany({ orderBy: { inspectedDate: 'desc' } });
    return NextResponse.json({ grns, inspections });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch quality data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, employeeCode, userName, activeRole } = body;

    // 1. Create Goods Receipt Note (GRN)
    if (action === 'CREATE_GRN') {
      const {
        poCode,
        vendorCode,
        invoiceNumber,
        invoiceDate,
        deliveryChallan,
        vehicleNumber,
        gateEntryNumber,
        items // Array: { itemCode, itemName, receivedQty, batchNumber, manufacturingDate, expiryDate, storageLocation }
      } = body;

      const grnCount = await prisma.goodsReceipt.count();
      const grnCode = `NAX-GRN-${new Date().getFullYear()}-${String(grnCount + 1).padStart(5, '0')}`;

      const grn = await prisma.$transaction(async (tx) => {
        // Create GRN Header
        const newGrn = await tx.goodsReceipt.create({
          data: {
            grnCode,
            poCode,
            vendorCode,
            invoiceNumber,
            invoiceDate: new Date(invoiceDate),
            deliveryChallan: deliveryChallan || null,
            vehicleNumber: vehicleNumber || null,
            gateEntryNumber,
            receivedBy: employeeCode,
            status: 'QUARANTINED'
          }
        });

        // Create GRN Items & quarantine them in StockBalance
        for (const itm of items) {
          const qty = parseFloat(itm.receivedQty);
          
          await tx.goodsReceiptItem.create({
            data: {
              grnCode,
              itemCode: itm.itemCode,
              itemName: itm.itemName,
              orderedQty: qty, // simplifying
              receivedQty: qty,
              batchNumber: itm.batchNumber || 'NA',
              manufacturingDate: itm.manufacturingDate ? new Date(itm.manufacturingDate) : null,
              expiryDate: itm.expiryDate ? new Date(itm.expiryDate) : null,
              storageLocation: itm.storageLocation || 'QUARANTINE_AREA'
            }
          });

          // Insert / update StockBalance in QUARANTINE state
          const existingBal = await tx.stockBalance.findFirst({
            where: {
              itemCode: itm.itemCode,
              warehouse: 'MAIN',
              location: 'QUARANTINE_AREA',
              batchNumber: itm.batchNumber || 'NA'
            }
          });

          if (existingBal) {
            await tx.stockBalance.update({
              where: { id: existingBal.id },
              data: {
                physicalQty: existingBal.physicalQty + qty,
                quarantineQty: existingBal.quarantineQty + qty
              }
            });
          } else {
            await tx.stockBalance.create({
              data: {
                itemCode: itm.itemCode,
                warehouse: 'MAIN',
                location: 'QUARANTINE_AREA',
                batchNumber: itm.batchNumber || 'NA',
                serialNumber: 'NA',
                physicalQty: qty,
                quarantineQty: qty,
                availableQty: 0.0 // quarantine items are NOT available
              }
            });
          }

          // Create Quality Inspection Ticket
          const qaCount = await tx.qualityInspection.count();
          const inspectionCode = `NAX-QA-${new Date().getFullYear()}-${String(qaCount + 1).padStart(5, '0')}`;

          await tx.qualityInspection.create({
            data: {
              inspectionCode,
              grnCode,
              itemCode: itm.itemCode,
              itemName: itm.itemName,
              batchNumber: itm.batchNumber || 'NA',
              receivedQty: qty,
              result: 'PENDING',
              inspectedBy: 'NAX-EMP-00007' // Elena Rostova (QA Head)
            }
          });

          // Update PO item received quantity
          const poItem = await tx.purchaseOrderItem.findUnique({
            where: { poCode_itemCode: { poCode, itemCode: itm.itemCode } }
          });
          if (poItem) {
            await tx.purchaseOrderItem.update({
              where: { poCode_itemCode: { poCode, itemCode: itm.itemCode } },
              data: { receivedQty: poItem.receivedQty + qty }
            });
          }
        }

        // Update PO Header status
        await tx.purchaseOrder.update({
          where: { poCode },
          data: { status: 'PARTIALLY_DELIVERED' }
        });

        // Notify QA Manager
        await tx.notification.create({
          data: {
            employeeCode: 'NAX-EMP-00007', // Elena Rostova
            title: 'New Quarantine Stock Received',
            message: `GRN ${grnCode} contains items requiring chemical/quality inspection.`
          }
        });

        return newGrn;
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: userName,
          userName,
          employeeCode,
          activeRole,
          module: 'QA',
          action: 'CREATE',
          recordType: 'GoodsReceipt',
          recordCode: grnCode,
          newValue: JSON.stringify(grn)
        }
      });

      return NextResponse.json({ success: true, grn });
    }

    // 2. Perform Quality Inspection Action
    if (action === 'PERFORM_INSPECTION') {
      const { inspectionCode, result, acceptedQty, rejectedQty, observation, testSpec } = body;

      const updatedInspection = await prisma.$transaction(async (tx) => {
        const qa = await tx.qualityInspection.findUnique({ where: { inspectionCode } });
        if (!qa) throw new Error('Inspection record not found');

        const accepted = parseFloat(acceptedQty);
        const rejected = parseFloat(rejectedQty);

        // Update inspection ticket
        const updatedQa = await tx.qualityInspection.update({
          where: { inspectionCode },
          data: {
            result,
            acceptedQty: accepted,
            rejectedQty: rejected,
            observation,
            testSpec,
            releaseDate: new Date(),
            inspectedBy: employeeCode
          }
        });

        // Update Stock Balance: Remove from Quarantine Location, Move accepted to Available Location
        const quarantineBal = await tx.stockBalance.findFirst({
          where: {
            itemCode: qa.itemCode,
            warehouse: 'MAIN',
            location: 'QUARANTINE_AREA',
            batchNumber: qa.batchNumber
          }
        });

        if (quarantineBal) {
          // Deduct quarantine
          const remPhys = quarantineBal.physicalQty - qa.receivedQty;
          const remQuar = quarantineBal.quarantineQty - qa.receivedQty;

          if (remPhys <= 0) {
            await tx.stockBalance.delete({ where: { id: quarantineBal.id } });
          } else {
            await tx.stockBalance.update({
              where: { id: quarantineBal.id },
              data: { physicalQty: remPhys, quarantineQty: remQuar }
            });
          }
        }

        // Add Accepted quantity to Usable Stock (MAIN/GEN)
        if (accepted > 0) {
          const availBal = await tx.stockBalance.findFirst({
            where: {
              itemCode: qa.itemCode,
              warehouse: 'MAIN',
              location: 'GEN-LOC',
              batchNumber: qa.batchNumber
            }
          });

          if (availBal) {
            await tx.stockBalance.update({
              where: { id: availBal.id },
              data: {
                physicalQty: availBal.physicalQty + accepted,
                availableQty: availBal.availableQty + accepted
              }
            });
          } else {
            await tx.stockBalance.create({
              data: {
                itemCode: qa.itemCode,
                warehouse: 'MAIN',
                location: 'GEN-LOC',
                batchNumber: qa.batchNumber,
                serialNumber: 'NA',
                physicalQty: accepted,
                availableQty: accepted
              }
            });
          }

          // Write Stock Ledger (IMMUTABLE LOG!)
          const countLedger = await tx.stockLedger.count();
          const ledgerCode = `NAX-GRN-${new Date().getFullYear()}-${String(countLedger + 1).padStart(5, '0')}`;

          await tx.stockLedger.create({
            data: {
              transactionCode: ledgerCode,
              itemCode: qa.itemCode,
              warehouse: 'MAIN',
              location: 'GEN-LOC',
              batchNumber: qa.batchNumber,
              serialNumber: 'NA',
              transactionType: 'PURCHASE_RECEIPT',
              qtyIn: accepted,
              qtyOut: 0.0,
              runningBalance: accepted, // simplified running balance
              unitRate: 12.50,
              transactionValue: accepted * 12.50,
              referenceType: 'GRN',
              referenceCode: qa.grnCode,
              performedBy: employeeCode,
              activeRole,
              comment: 'QA Approved stock released to central inventory stores.'
            }
          });
        }

        // Add Rejected quantity to Damaged Stock
        if (rejected > 0) {
          const damageBal = await tx.stockBalance.findFirst({
            where: {
              itemCode: qa.itemCode,
              warehouse: 'MAIN',
              location: 'REJECT-AREA',
              batchNumber: qa.batchNumber
            }
          });

          if (damageBal) {
            await tx.stockBalance.update({
              where: { id: damageBal.id },
              data: {
                physicalQty: damageBal.physicalQty + rejected,
                damagedQty: damageBal.damagedQty + rejected
              }
            });
          } else {
            await tx.stockBalance.create({
              data: {
                itemCode: qa.itemCode,
                warehouse: 'MAIN',
                location: 'REJECT-AREA',
                batchNumber: qa.batchNumber,
                serialNumber: 'NA',
                physicalQty: rejected,
                damagedQty: rejected
              }
            });
          }

          // Ledger Entry for scrap / damage
          const countLedger = await tx.stockLedger.count();
          const ledgerCode = `NAX-GRN-${new Date().getFullYear()}-${String(countLedger + 1).padStart(5, '0')}`;

          await tx.stockLedger.create({
            data: {
              transactionCode: ledgerCode,
              itemCode: qa.itemCode,
              warehouse: 'MAIN',
              location: 'REJECT-AREA',
              batchNumber: qa.batchNumber,
              serialNumber: 'NA',
              transactionType: 'DAMAGE',
              qtyIn: rejected,
              qtyOut: 0.0,
              runningBalance: rejected,
              unitRate: 12.50,
              transactionValue: rejected * 12.50,
              referenceType: 'GRN',
              referenceCode: qa.grnCode,
              performedBy: employeeCode,
              activeRole,
              comment: 'QA Rejected stock stored in restricted damage yard.'
            }
          });
        }

        // Update GRN status
        await tx.goodsReceipt.update({
          where: { grnCode: qa.grnCode },
          data: { status: 'INSPECTED' }
        });

        // Notify Inventory Head & Requester
        await tx.notification.create({
          data: {
            employeeCode: 'NAX-EMP-00005', // central store
            title: 'QA release completed',
            message: `QA inspection completed for GRN ${qa.grnCode}. Released accepted: ${accepted} units.`
          }
        });

        return updatedQa;
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: userName,
          userName,
          employeeCode,
          activeRole,
          module: 'QA',
          action: 'APPROVE',
          recordType: 'QualityInspection',
          recordCode: inspectionCode,
          newValue: JSON.stringify(updatedInspection)
        }
      });

      return NextResponse.json({ success: true, inspection: updatedInspection });
    }

    return NextResponse.json({ error: 'Invalid QA action' }, { status: 400 });
  } catch (err: any) {
    console.error('QA API Error:', err);
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
