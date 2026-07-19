import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    return NextResponse.json({ logs });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch audit log trail' }, { status: 500 });
  }
}
