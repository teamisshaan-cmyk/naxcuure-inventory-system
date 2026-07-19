import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const checkDuplicateName = searchParams.get('checkDuplicateName');

  try {
    if (checkDuplicateName) {
      // Find similar names to warn of duplicate items
      const duplicates = await prisma.item.findMany({
        where: {
          name: { contains: checkDuplicateName }
        }
      });
      return NextResponse.json({ duplicates });
    }

    if (code) {
      const item = await prisma.item.findUnique({
        where: { itemCode: code }
      });

      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      // Fetch related stock balances
      const stock = await prisma.stockBalance.findMany({
        where: { itemCode: code }
      });

      // Fetch related stock ledger
      const ledger = await prisma.stockLedger.findMany({
        where: { itemCode: code },
        orderBy: { dateTime: 'desc' },
        take: 20
      });

      // Fetch open purchase orders for this item
      const poItems = await prisma.purchaseOrderItem.findMany({
        where: { itemCode: code },
        take: 10
      });
      
      const poCodes = poItems.map(p => p.poCode);
      const openPOs = await prisma.purchaseOrder.findMany({
        where: {
          poCode: { in: poCodes },
          status: { in: ['APPROVED', 'SENT_TO_VENDOR', 'ACKNOWLEDGED', 'PARTIALLY_DELIVERED'] }
        }
      });

      // Fetch active reservations
      const reservations = stock.reduce((sum, b) => sum + b.reservedQty, 0);

      return NextResponse.json({
        item,
        stock,
        ledger,
        openPOs,
        reservations
      });
    }

    const items = await prisma.item.findMany({
      orderBy: { itemCode: 'asc' }
    });
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      category,
      subcategory,
      itemType,
      brand,
      manufacturer,
      modelNumber,
      partNumber,
      techSpec,
      machineCompatibility,
      baseUnit,
      issueUnit,
      purchaseUnit,
      standardRate,
      qualityInspectionRequired,
      batchTrackingRequired,
      expiryTrackingRequired,
      serialTrackingRequired,
      minStock,
      maxStock,
      reorderLevel,
      reorderQty
    } = body;

    // Duplicate detection check
    const existing = await prisma.item.findFirst({
      where: { name: { equals: name } }
    });

    if (existing) {
      return NextResponse.json({ error: 'An item with this exact name already exists in the Item Master.' }, { status: 400 });
    }

    // Sequence generator for Item Code
    const count = await prisma.item.count();
    const itemCode = `NAX-ITM-${String(count + 1).padStart(5, '0')}`;

    const newItem = await prisma.item.create({
      data: {
        itemCode,
        name,
        description,
        category,
        subcategory,
        itemType: itemType || 'CONSUMABLE',
        brand: brand || null,
        manufacturer: manufacturer || null,
        modelNumber: modelNumber || null,
        partNumber: partNumber || null,
        techSpec: techSpec || null,
        machineCompatibility: machineCompatibility || null,
        baseUnit,
        issueUnit,
        purchaseUnit,
        standardRate: parseFloat(standardRate) || 0.0,
        qualityInspectionRequired: !!qualityInspectionRequired,
        batchTrackingRequired: !!batchTrackingRequired,
        expiryTrackingRequired: !!expiryTrackingRequired,
        serialTrackingRequired: !!serialTrackingRequired,
        minStock: parseFloat(minStock) || 0.0,
        maxStock: parseFloat(maxStock) || 0.0,
        reorderLevel: parseFloat(reorderLevel) || 0.0,
        reorderQty: parseFloat(reorderQty) || 0.0,
        isActive: true
      }
    });

    // Create initial stock balance entry as zero
    await prisma.stockBalance.create({
      data: {
        itemCode: newItem.itemCode,
        warehouse: 'MAIN',
        location: 'GEN',
        batchNumber: 'NA',
        serialNumber: 'NA',
        physicalQty: 0.0,
        availableQty: 0.0
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: 'admin@naxcuure.com',
        userName: 'Administrator',
        employeeCode: 'SYS',
        activeRole: 'INVENTORY_HEAD',
        module: 'ITEMS',
        action: 'CREATE',
        recordType: 'Item',
        recordCode: newItem.itemCode,
        newValue: JSON.stringify(newItem)
      }
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (err: any) {
    console.error('Create Item Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create item' }, { status: 500 });
  }
}
