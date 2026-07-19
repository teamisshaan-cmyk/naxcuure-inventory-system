import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results: any[] = [];

    // Search Items
    const items = await prisma.item.findMany({
      where: {
        OR: [
          { itemCode: { contains: q } },
          { name: { contains: q } },
          { category: { contains: q } }
        ]
      },
      take: 5
    });
    items.forEach((item) => {
      results.push({
        type: 'item',
        code: item.itemCode,
        name: item.name
      });
    });

    // Search Machines
    const machines = await prisma.machine.findMany({
      where: {
        OR: [
          { machineCode: { contains: q } },
          { name: { contains: q } }
        ]
      },
      take: 5
    });
    machines.forEach((mch) => {
      results.push({
        type: 'machine',
        code: mch.machineCode,
        name: mch.name
      });
    });

    // Search Employees/Users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { employeeCode: { contains: q } },
          { fullName: { contains: q } },
          { designation: { contains: q } }
        ]
      },
      take: 5
    });
    users.forEach((usr) => {
      results.push({
        type: 'employee',
        code: usr.employeeCode,
        name: usr.fullName
      });
    });

    // Search Material Requests
    const requests = await prisma.materialRequest.findMany({
      where: {
        OR: [
          { requestCode: { contains: q } },
          { requesterName: { contains: q } }
        ]
      },
      take: 5
    });
    requests.forEach((req) => {
      results.push({
        type: 'request',
        code: req.requestCode,
        name: `Material Request (${req.status})`
      });
    });

    // Search Purchase Orders
    const pos = await prisma.purchaseOrder.findMany({
      where: {
        OR: [
          { poCode: { contains: q } },
          { vendorName: { contains: q } }
        ]
      },
      take: 5
    });
    pos.forEach((po) => {
      results.push({
        type: 'po',
        code: po.poCode,
        name: `Purchase Order to ${po.vendorName}`
      });
    });

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Search API error:', err);
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
  }
}
