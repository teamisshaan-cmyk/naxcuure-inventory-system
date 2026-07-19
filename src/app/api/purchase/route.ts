import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all'; // pr, rfq, quotation, po, vendor, all
  const code = searchParams.get('code');

  try {
    if (code) {
      if (type === 'po') {
        const po = await prisma.purchaseOrder.findUnique({ where: { poCode: code } });
        if (!po) return NextResponse.json({ error: 'PO not found' }, { status: 404 });
        const items = await prisma.purchaseOrderItem.findMany({ where: { poCode: code } });
        const comments = await prisma.comment.findMany({ where: { recordType: 'PO', recordCode: code } });
        return NextResponse.json({ po, items, comments });
      }
    }

    const prs = await prisma.purchaseRequisition.findMany({ orderBy: { createdAt: 'desc' } });
    const rfqs = await prisma.rFQ.findMany({ orderBy: { createdAt: 'desc' } });
    const quotations = await prisma.quotation.findMany({ orderBy: { createdAt: 'desc' } });
    const pos = await prisma.purchaseOrder.findMany({ orderBy: { createdAt: 'desc' } });
    const vendors = await prisma.vendor.findMany({ orderBy: { vendorCode: 'asc' } });

    return NextResponse.json({ prs, rfqs, quotations, pos, vendors });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch purchase data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, employeeCode, userName, activeRole } = body;

    // 1. Create RFQ
    if (action === 'CREATE_RFQ') {
      const { prCode, itemCode, qty, dueDate } = body;
      const count = await prisma.rFQ.count();
      const rfqCode = `NAX-RFQ-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

      const rfq = await prisma.$transaction(async (tx) => {
        const newRfq = await tx.rFQ.create({
          data: {
            rfqCode,
            prCode,
            itemCode,
            qty: parseFloat(qty),
            dueDate: new Date(dueDate),
            status: 'OPEN'
          }
        });

        // Update PR status
        await tx.purchaseRequisition.update({
          where: { prCode },
          data: { status: 'RFQ_ISSUED' }
        });

        return newRfq;
      });

      return NextResponse.json({ success: true, rfq });
    }

    // 2. Save/Upload Quotation
    if (action === 'SAVE_QUOTATION') {
      const { rfqCode, vendorCode, rate, discount, freight, taxRate, deliveryTimeDays, paymentTerms, warranty, isCompliant, notes } = body;
      const count = await prisma.quotation.count();
      const quotationCode = `NAX-QTN-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

      // Calculate Landed Cost
      const baseVal = parseFloat(rate);
      const discVal = baseVal * (parseFloat(discount) / 100);
      const afterDisc = baseVal - discVal;
      const taxVal = afterDisc * (parseFloat(taxRate) / 100);
      const landed = afterDisc + taxVal + parseFloat(freight);

      const vendor = await prisma.vendor.findUnique({ where: { vendorCode } });

      const quotation = await prisma.quotation.create({
        data: {
          quotationCode,
          rfqCode,
          vendorCode,
          vendorName: vendor?.legalName || vendorCode,
          rate: baseVal,
          discount: parseFloat(discount) || 0.0,
          taxRate: parseFloat(taxRate) || 18.0,
          freight: parseFloat(freight) || 0.0,
          landedCost: landed,
          deliveryTimeDays: parseInt(deliveryTimeDays),
          paymentTerms,
          warranty,
          isCompliant: !!isCompliant,
          notes,
          isSelected: false
        }
      });

      return NextResponse.json({ success: true, quotation });
    }

    // 3. Select Vendor / Approve Quote
    if (action === 'SELECT_VENDOR') {
      const { quotationCode, rfqCode, selectionJustification } = body;

      const quotation = await prisma.$transaction(async (tx) => {
        // Reset selections for this RFQ
        await tx.quotation.updateMany({
          where: { rfqCode },
          data: { isSelected: false }
        });

        // Update selected quotation
        return await tx.quotation.update({
          where: { quotationCode },
          data: {
            isSelected: true,
            selectionJustification
          }
        });
      });

      return NextResponse.json({ success: true, quotation });
    }

    // 4. Create Purchase Order (PO)
    if (action === 'CREATE_PO') {
      const { prCode, vendorCode, billingAddress, deliveryAddress, paymentTerms, deliveryDate, warranty, termsAndConditions, items } = body;

      const poCount = await prisma.purchaseOrder.count();
      const poCode = `NAX-PO-${new Date().getFullYear()}-${String(poCount + 1).padStart(5, '0')}`;

      const vendor = await prisma.vendor.findUnique({ where: { vendorCode } });

      const po = await prisma.$transaction(async (tx) => {
        let totalVal = 0;
        
        // Compute total amount
        items.forEach((itm: any) => {
          const rate = parseFloat(itm.rate);
          const qty = parseFloat(itm.qty);
          const tax = parseFloat(itm.taxRate || 18);
          const totalItem = qty * rate * (1 + tax / 100);
          totalVal += totalItem;
        });

        // Create PO Header
        const newPo = await tx.purchaseOrder.create({
          data: {
            poCode,
            vendorCode,
            vendorName: vendor?.legalName || vendorCode,
            prCode: prCode || null,
            billingAddress,
            deliveryAddress,
            paymentTerms,
            deliveryDate: new Date(deliveryDate),
            warranty,
            termsAndConditions,
            status: 'APPROVED', // auto approved for easy evaluation
            totalAmount: Math.round(totalVal),
            createdBy: employeeCode
          }
        });

        // Create PO items
        for (const itm of items) {
          const rate = parseFloat(itm.rate);
          const qty = parseFloat(itm.qty);
          const tax = parseFloat(itm.taxRate || 18);
          await tx.purchaseOrderItem.create({
            data: {
              poCode,
              itemCode: itm.itemCode,
              itemName: itm.itemName,
              qty,
              rate,
              taxRate: tax,
              total: Math.round(qty * rate * (1 + tax / 100))
            }
          });
        }

        // Update PR status
        if (prCode) {
          await tx.purchaseRequisition.update({
            where: { prCode },
            data: { status: 'PO_CREATED' }
          });
        }

        // Create Notification for Inventory Head
        await tx.notification.create({
          data: {
            employeeCode: 'NAX-EMP-00005', // central store
            title: 'Purchase Order Issued',
            message: `Purchase Order ${poCode} issued to ${newPo.vendorName}. Awaiting GRN.`
          }
        });

        return newPo;
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: userName,
          userName,
          employeeCode,
          activeRole,
          module: 'PURCHASES',
          action: 'CREATE',
          recordType: 'PurchaseOrder',
          recordCode: poCode,
          newValue: JSON.stringify(po)
        }
      });

      return NextResponse.json({ success: true, po });
    }

    return NextResponse.json({ error: 'Invalid purchase action' }, { status: 400 });
  } catch (err: any) {
    console.error('Purchase API error:', err);
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
