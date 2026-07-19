import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || '';
  const code = searchParams.get('code') || '';

  try {
    const comments = await prisma.comment.findMany({
      where: { recordType: type, recordCode: code },
      orderBy: { timestamp: 'asc' }
    });
    return NextResponse.json({ comments });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recordType, recordCode, userName, employeeCode, role, content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        recordType,
        recordCode,
        userName,
        employeeCode,
        role,
        content
      }
    });

    return NextResponse.json({ success: true, comment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit comment' }, { status: 500 });
  }
}
