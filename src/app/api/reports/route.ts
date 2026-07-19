import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'inventory_valuation';

    let headers: string[] = [];
    let rows: string[][] = [];

    if (type === 'inventory_valuation') {
      headers = ['Item Code', 'Item Name', 'Category', 'Qty Available', 'Std. Rate', 'Asset Value'];
      const itemsList = await prisma.item.findMany();
      const stockBalances = await prisma.stockBalance.findMany();
      
      let totalValue = 0;
      
      itemsList.forEach(itm => {
        const bal = stockBalances
          .filter(sb => sb.itemCode === itm.itemCode)
          .reduce((sum, b) => sum + b.availableQty, 0);
          
        if (bal > 0) {
          const stdRate = 12.5; // Simulated standard rate for demo
          const val = bal * stdRate;
          totalValue += val;
          rows.push([
            itm.itemCode,
            itm.name,
            itm.category,
            `${bal.toFixed(2)} ${itm.baseUnit}`,
            `$${stdRate.toFixed(2)}`,
            `$${val.toFixed(2)}`
          ]);
        }
      });
      
      if (totalValue > 0) {
        rows.push(['', '', '', '', 'TOTAL ASSET VALUE', `$${totalValue.toFixed(2)}`]);
      }
      
    } else if (type === 'discrepancy_ledger') {
      headers = ['Adjustment Code', 'Item Code', 'Location', 'Qty Difference', 'Performed By', 'Reason'];
      const discrepancies = await prisma.stockLedger.findMany({
        where: { transactionType: 'ADJUSTMENT' },
        orderBy: { dateTime: 'desc' }
      });
      
      discrepancies.forEach(d => {
        rows.push([
          d.transactionCode,
          d.itemCode,
          d.location,
          `${d.qtyIn - d.qtyOut}`,
          d.performedBy,
          d.comment || 'Stock correction'
        ]);
      });
      
    } else if (type === 'department_consumption') {
      headers = ['Dept Code', 'Consumption (YTD)'];
      const issues = await prisma.stockLedger.findMany({
        where: { transactionType: 'ISSUE' }
      });
      
      const deptMap: { [key: string]: number } = {};
      issues.forEach((issue) => {
        const val = issue.transactionValue || 0;
        const dept = issue.referenceCode || 'Unknown';
        deptMap[dept] = (deptMap[dept] || 0) + val;
      });
      
      Object.keys(deptMap).forEach(dept => {
        rows.push([
          dept,
          `$${deptMap[dept].toFixed(2)}`
        ]);
      });
      
    } else if (type === 'vendor_compliance') {
      headers = ['Vendor Code', 'Vendor Name', 'Status', 'Score'];
      const vendors = await prisma.vendor.findMany();
      
      vendors.forEach(v => {
        rows.push([
          v.vendorCode,
          v.tradeName,
          v.qualityStatus,
          v.qualityStatus === 'APPROVED' ? '98.5%' : 'N/A' // Simulated score logic
        ]);
      });
      
    } else if (type === 'downtime_analysis') {
      headers = ['Machine Code', 'Machine Name', 'Criticality', 'Time Reported', 'Status'];
      const breakdowns = await prisma.breakdown.findMany({
        orderBy: { reportedAt: 'desc' }
      });
      
      breakdowns.forEach(b => {
        rows.push([
          b.breakdownCode,
          b.machineName,
          b.priority,
          new Date(b.reportedAt).toLocaleString(),
          b.status
        ]);
      });
    }

    return NextResponse.json({ headers, rows });
  } catch (err) {
    console.error('Reports API Error:', err);
    return NextResponse.json({ error: 'Failed to fetch report data' }, { status: 500 });
  }
}
