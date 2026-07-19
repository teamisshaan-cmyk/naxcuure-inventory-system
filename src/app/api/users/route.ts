import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { employeeCode: 'asc' }
    });
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      mobileNumber,
      plant,
      departmentCode,
      designation,
      roles,
      approvalLimit,
      reportingManager
    } = body;

    // Sequence generator for Employee Code
    const count = await prisma.user.count();
    const sequenceNum = String(count + 1).padStart(5, '0');
    const employeeCode = `NAX-EMP-${sequenceNum}`;
    const userCode = `NAX-USR-${sequenceNum}`;

    const newUser = await prisma.user.create({
      data: {
        employeeCode,
        userCode,
        fullName,
        email,
        mobileNumber,
        plant,
        departmentCode,
        designation,
        reportingManager: reportingManager || null,
        roles: roles || 'USER',
        approvalLimit: parseFloat(approvalLimit) || 0.0,
        joiningDate: new Date(),
        status: 'ACTIVE'
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: 'admin@naxcuure.com',
        userName: 'Administrator',
        employeeCode: 'SYS',
        activeRole: 'HR',
        module: 'USERS',
        action: 'CREATE',
        recordType: 'User',
        recordCode: newUser.employeeCode,
        newValue: JSON.stringify(newUser)
      }
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (err: any) {
    console.error('Create User Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { employeeCode, status, roles, approvalLimit, departmentCode, designation } = body;

    const oldUser = await prisma.user.findUnique({
      where: { employeeCode }
    });

    const updatedUser = await prisma.user.update({
      where: { employeeCode },
      data: {
        status: status || undefined,
        roles: roles || undefined,
        approvalLimit: approvalLimit !== undefined ? parseFloat(approvalLimit) : undefined,
        departmentCode: departmentCode || undefined,
        designation: designation || undefined
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: 'admin@naxcuure.com',
        userName: 'Administrator',
        employeeCode: 'SYS',
        activeRole: 'HR',
        module: 'USERS',
        action: 'UPDATE',
        recordType: 'User',
        recordCode: employeeCode,
        oldValue: JSON.stringify(oldUser),
        newValue: JSON.stringify(updatedUser)
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update user' }, { status: 500 });
  }
}
