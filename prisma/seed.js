// Database Seeder for Naxcuure Inventory System
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.auditLog.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.preventiveMaintenanceSchedule.deleteMany({});
  await prisma.sparePartUsage.deleteMany({});
  await prisma.workOrder.deleteMany({});
  await prisma.breakdown.deleteMany({});
  await prisma.machineStatusHistory.deleteMany({});
  await prisma.machine.deleteMany({});
  await prisma.qualityInspection.deleteMany({});
  await prisma.goodsReceiptItem.deleteMany({});
  await prisma.goodsReceipt.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.rFQ.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.purchaseRequisition.deleteMany({});
  await prisma.materialRequestItem.deleteMany({});
  await prisma.materialRequest.deleteMany({});
  await prisma.stockLedger.deleteMany({});
  await prisma.stockBalance.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  console.log('Seeding Departments...');
  const departments = [
    { code: 'NAX-DEP-PROD', name: 'Production', plant: 'Plant 1', costCentre: 'CC-PROD-01', monthlyBudget: 150000.0, annualBudget: 1800000.0 },
    { code: 'NAX-DEP-PACK', name: 'Packing', plant: 'Plant 1', costCentre: 'CC-PACK-01', monthlyBudget: 50000.0, annualBudget: 600000.0 },
    { code: 'NAX-DEP-QA', name: 'Quality Assurance', plant: 'Plant 1', costCentre: 'CC-QA-01', monthlyBudget: 30000.0, annualBudget: 360000.0 },
    { code: 'NAX-DEP-QC', name: 'Quality Control', plant: 'Plant 1', costCentre: 'CC-QC-01', monthlyBudget: 40000.0, annualBudget: 480000.0 },
    { code: 'NAX-DEP-WH', name: 'Warehouse & Inventory', plant: 'Plant 1', costCentre: 'CC-WH-01', monthlyBudget: 25000.0, annualBudget: 300000.0 },
    { code: 'NAX-DEP-ENG', name: 'Engineering & Maintenance', plant: 'Plant 1', costCentre: 'CC-ENG-01', monthlyBudget: 80000.0, annualBudget: 960000.0 },
    { code: 'NAX-DEP-PUR', name: 'Purchase', plant: 'Plant 1', costCentre: 'CC-PUR-01', monthlyBudget: 20000.0, annualBudget: 240000.0 },
    { code: 'NAX-DEP-FIN', name: 'Finance', plant: 'Plant 1', costCentre: 'CC-FIN-01', monthlyBudget: 15000.0, annualBudget: 180000.0 },
    { code: 'NAX-DEP-HR', name: 'Human Resources', plant: 'Plant 1', costCentre: 'CC-HR-01', monthlyBudget: 15000.0, annualBudget: 180000.0 }
  ];

  for (const dept of departments) {
    await prisma.department.create({ data: dept });
  }

  console.log('Seeding Users (Employees)...');
  const baseDate = new Date('2024-01-15T09:00:00Z');
  
  const users = [
    {
      employeeCode: 'NAX-EMP-00001',
      userCode: 'NAX-USR-00001',
      fullName: 'Sarah Jenkins',
      email: 'sarah.jenkins@naxcuure.com',
      mobileNumber: '+919876543210',
      plant: 'Plant 1',
      departmentCode: 'NAX-DEP-HR',
      designation: 'HR Executive',
      reportingManager: null,
      status: 'ACTIVE',
      roles: 'HR',
      joiningDate: baseDate,
      approvalLimit: 0.0,
      remarks: 'Primary HR Administrator'
    },
    {
      employeeCode: 'NAX-EMP-00002',
      userCode: 'NAX-USR-00002',
      fullName: 'Dr. Arthur Nax',
      email: 'arthur.nax@naxcuure.com',
      mobileNumber: '+919876543211',
      plant: 'Plant 1',
      departmentCode: 'NAX-DEP-PROD',
      designation: 'Managing Director',
      reportingManager: null,
      status: 'ACTIVE',
      roles: 'DIRECTOR,USER,DH',
      joiningDate: baseDate,
      approvalLimit: 10000000.0,
      remarks: 'Company Director with ultimate system access'
    },
    {
      employeeCode: 'NAX-EMP-00003',
      userCode: 'NAX-USR-00003',
      fullName: 'Robert Miller',
      email: 'robert.miller@naxcuure.com',
      mobileNumber: '+919876543212',
      plant: 'Plant 1',
      departmentCode: 'NAX-DEP-PROD',
      designation: 'Production Department Head',
      reportingManager: 'NAX-EMP-00002',
      status: 'ACTIVE',
      roles: 'DH,USER',
      joiningDate: baseDate,
      approvalLimit: 50000.0,
      remarks: 'Production Head'
    },
    {
      employeeCode: 'NAX-EMP-00004',
      userCode: 'NAX-USR-00004',
      fullName: 'David Vance',
      email: 'david.vance@naxcuure.com',
      mobileNumber: '+919876543213',
      plant: 'Plant 1',
      departmentCode: 'NAX-DEP-ENG',
      designation: 'Engineering & Maintenance Head',
      reportingManager: 'NAX-EMP-00002',
      status: 'ACTIVE',
      roles: 'DH,MAINTENANCE_HEAD,USER',
      joiningDate: baseDate,
      approvalLimit: 100000.0,
      remarks: 'Engineering Head & Maintenance lead'
    },
    {
      employeeCode: 'NAX-EMP-00005',
      userCode: 'NAX-USR-00005',
      fullName: 'Nikhil Kumar',
      email: 'nikhil.kumar@naxcuure.com',
      mobileNumber: '+919876543214',
      plant: 'Plant 1',
      departmentCode: 'NAX-DEP-WH',
      designation: 'Inventory & Warehouse Head',
      reportingManager: 'NAX-EMP-00002',
      status: 'ACTIVE',
      roles: 'INVENTORY_HEAD,USER',
      joiningDate: baseDate,
      approvalLimit: 75000.0,
      remarks: 'Warehouse manager'
    },
    {
      employeeCode: 'NAX-EMP-00006',
      userCode: 'NAX-USR-00006',
      fullName: 'Pradeep Sharma',
      email: 'pradeep.sharma@naxcuure.com',
      mobileNumber: '+919876543215',
      plant: 'Plant 1',
      departmentCode: 'NAX-DEP-PUR',
      designation: 'Purchase Manager',
      reportingManager: 'NAX-EMP-00002',
      status: 'ACTIVE',
      roles: 'PURCHASE_MANAGER,USER',
      joiningDate: baseDate,
      approvalLimit: 250000.0,
      remarks: 'Lead Procurement Manager'
    },
    {
      employeeCode: 'NAX-EMP-00007',
      userCode: 'NAX-USR-00007',
      fullName: 'Elena Rostova',
      email: 'elena.rostova@naxcuure.com',
      mobileNumber: '+919876543216',
      plant: 'Plant 1',
      departmentCode: 'NAX-DEP-QA',
      designation: 'Quality Assurance Manager',
      reportingManager: 'NAX-EMP-00002',
      status: 'ACTIVE',
      roles: 'QA_QC,USER',
      joiningDate: baseDate,
      approvalLimit: 30000.0,
      remarks: 'QA Manager & Release Specialist'
    },
    {
      employeeCode: 'NAX-EMP-00008',
      userCode: 'NAX-USR-00008',
      fullName: 'John Doe',
      email: 'john.doe@naxcuure.com',
      mobileNumber: '+919876543217',
      plant: 'Plant 1',
      departmentCode: 'NAX-DEP-ENG',
      designation: 'Maintenance Technician',
      reportingManager: 'NAX-EMP-00004',
      status: 'ACTIVE',
      roles: 'MAINTENANCE_TECH,USER',
      joiningDate: baseDate,
      approvalLimit: 0.0,
      remarks: 'Senior Mechanical Technician'
    },
    {
      employeeCode: 'NAX-EMP-00009',
      userCode: 'NAX-USR-00009',
      fullName: 'Amit Patel',
      email: 'amit.patel@naxcuure.com',
      mobileNumber: '+919876543218',
      plant: 'Plant 1',
      departmentCode: 'NAX-DEP-PROD',
      designation: 'Production Operator',
      reportingManager: 'NAX-EMP-00003',
      status: 'ACTIVE',
      roles: 'USER',
      joiningDate: baseDate,
      approvalLimit: 0.0,
      remarks: 'Tablet Compression Operator'
    }
  ];

  for (const user of users) {
    await prisma.user.create({ data: user });
  }

  // Update Department Heads inside Departments table
  await prisma.department.update({ where: { code: 'NAX-DEP-HR' }, data: { headId: 'NAX-EMP-00001' } });
  await prisma.department.update({ where: { code: 'NAX-DEP-PROD' }, data: { headId: 'NAX-EMP-00003' } });
  await prisma.department.update({ where: { code: 'NAX-DEP-ENG' }, data: { headId: 'NAX-EMP-00004' } });
  await prisma.department.update({ where: { code: 'NAX-DEP-WH' }, data: { headId: 'NAX-EMP-00005' } });
  await prisma.department.update({ where: { code: 'NAX-DEP-PUR' }, data: { headId: 'NAX-EMP-00006' } });
  await prisma.department.update({ where: { code: 'NAX-DEP-QA' }, data: { headId: 'NAX-EMP-00007' } });

  console.log('Seeding Items (Item Master)...');
  const items = [
    {
      itemCode: 'NAX-ITM-00001',
      name: 'Paracetamol Active Ingredient (API)',
      description: 'High purity Paracetamol API for tablet compression, USP Grade',
      category: 'Raw materials',
      subcategory: 'API',
      itemType: 'RAW_MATERIAL',
      brand: 'PharmaAPI',
      manufacturer: 'GlobalChem Corp',
      techSpec: 'Assay 99.8%, White crystalline powder, Loss on drying < 0.5%',
      baseUnit: 'kg',
      issueUnit: 'kg',
      purchaseUnit: 'kg',
      packSize: '25 kg Drum',
      conversionFactor: 1.0,
      hsnCode: '29242990',
      taxRate: 18.0,
      minStock: 200.0,
      maxStock: 5000.0,
      reorderLevel: 500.0,
      reorderQty: 1000.0,
      safetyStock: 100.0,
      expectedLeadTime: 10,
      standardRate: 12.50,
      lastPurchaseRate: 12.80,
      avgPurchaseRate: 12.65,
      preferredVendorId: 'NAX-VEN-00001',
      storageCondition: 'Store below 25 deg C in dry place',
      shelfLifeDays: 1095, // 3 years
      batchTrackingRequired: true,
      expiryTrackingRequired: true,
      serialTrackingRequired: false,
      qualityInspectionRequired: true,
      classificationABC: 'A',
      classificationVED: 'V',
      classificationFNS: 'F',
      restrictedDepartments: 'NAX-DEP-PROD,NAX-DEP-QA,NAX-DEP-WH',
      isActive: true
    },
    {
      itemCode: 'NAX-ITM-00002',
      name: 'Printed Carton Box - Naxcuure 500mg',
      description: 'Outer duplex board carton boxes with official brand printing',
      category: 'Printed packing materials',
      subcategory: 'Cartons',
      itemType: 'PACKING_MATERIAL',
      brand: 'PackPrint',
      manufacturer: 'PackCraft Paper Mills',
      techSpec: 'Duplex board 350 GSM, size 120x60x40mm, UV varnish coat',
      baseUnit: 'pcs',
      issueUnit: 'pcs',
      purchaseUnit: 'pcs',
      packSize: '1000 pcs bundle',
      conversionFactor: 1.0,
      hsnCode: '48191010',
      taxRate: 12.0,
      minStock: 5000.0,
      maxStock: 100000.0,
      reorderLevel: 10000.0,
      reorderQty: 25000.0,
      safetyStock: 2000.0,
      expectedLeadTime: 5,
      standardRate: 0.15,
      lastPurchaseRate: 0.16,
      avgPurchaseRate: 0.155,
      preferredVendorId: 'NAX-VEN-00002',
      storageCondition: 'Keep away from moisture',
      shelfLifeDays: 730,
      batchTrackingRequired: true,
      expiryTrackingRequired: false,
      serialTrackingRequired: false,
      qualityInspectionRequired: true,
      classificationABC: 'B',
      classificationVED: 'E',
      classificationFNS: 'F',
      restrictedDepartments: 'NAX-DEP-PROD,NAX-DEP-PACK,NAX-DEP-WH',
      isActive: true
    },
    {
      itemCode: 'NAX-ITM-00003',
      name: 'Ball Bearing 6204-2RS',
      description: 'Double rubber sealed deep groove ball bearing for tablet press rotation',
      category: 'Engineering spares',
      subcategory: 'Bearings',
      itemType: 'SPARE',
      brand: 'SKF',
      manufacturer: 'SKF Bearings',
      techSpec: 'Inner 20mm, Outer 47mm, Width 14mm, Carbon steel, synthetic grease pre-filled',
      baseUnit: 'pcs',
      issueUnit: 'pcs',
      purchaseUnit: 'pcs',
      packSize: 'Individual Box',
      conversionFactor: 1.0,
      hsnCode: '84821011',
      taxRate: 18.0,
      minStock: 5.0,
      maxStock: 50.0,
      reorderLevel: 10.0,
      reorderQty: 20.0,
      safetyStock: 2.0,
      expectedLeadTime: 3,
      standardRate: 7.50,
      lastPurchaseRate: 8.00,
      avgPurchaseRate: 7.80,
      preferredVendorId: 'NAX-VEN-00003',
      storageCondition: 'Anti-rust oiled wrapping',
      shelfLifeDays: null,
      batchTrackingRequired: false,
      expiryTrackingRequired: false,
      serialTrackingRequired: true,
      qualityInspectionRequired: false,
      classificationABC: 'C',
      classificationVED: 'V',
      classificationFNS: 'N',
      restrictedDepartments: 'NAX-DEP-ENG,NAX-DEP-WH',
      isActive: true
    },
    {
      itemCode: 'NAX-ITM-00004',
      name: 'Synthetic Lubricating Oil ISO VG 100',
      description: 'Food-grade gear oil for packaging & tableting machinery gearboxes',
      category: 'Lubricants',
      subcategory: 'Oils',
      itemType: 'CONSUMABLE',
      brand: 'Mobil',
      manufacturer: 'ExxonMobil',
      techSpec: 'Viscosity 100 cSt at 40 deg C, Food-grade USDA H-1 approved',
      baseUnit: 'Litres',
      issueUnit: 'Litres',
      purchaseUnit: 'Canister 5L',
      packSize: '5L Canister',
      conversionFactor: 5.0,
      hsnCode: '27101981',
      taxRate: 18.0,
      minStock: 20.0,
      maxStock: 200.0,
      reorderLevel: 40.0,
      reorderQty: 100.0,
      safetyStock: 10.0,
      expectedLeadTime: 4,
      standardRate: 15.00, // per litre
      lastPurchaseRate: 16.00,
      avgPurchaseRate: 15.50,
      preferredVendorId: 'NAX-VEN-00003',
      storageCondition: 'Well-ventilated flammables safety cabinet',
      shelfLifeDays: 1825,
      batchTrackingRequired: true,
      expiryTrackingRequired: true,
      serialTrackingRequired: false,
      qualityInspectionRequired: false,
      classificationABC: 'C',
      classificationVED: 'E',
      classificationFNS: 'S',
      restrictedDepartments: 'NAX-DEP-ENG,NAX-DEP-WH',
      isActive: true
    },
    {
      itemCode: 'NAX-ITM-00005',
      name: 'Polycarbonate Face Shield',
      description: 'Anti-fog protective face shield for chemical handling and QA laboratory testing',
      category: 'PPE',
      subcategory: 'Face Protectors',
      itemType: 'CONSUMABLE',
      brand: '3M',
      manufacturer: '3M Safety Solutions',
      techSpec: 'Polycarbonate visors, ANSI Z87.1 high-impact certified',
      baseUnit: 'pcs',
      issueUnit: 'pcs',
      purchaseUnit: 'pcs',
      packSize: 'Box of 10',
      conversionFactor: 1.0,
      hsnCode: '90200000',
      taxRate: 18.0,
      minStock: 10.0,
      maxStock: 100.0,
      reorderLevel: 25.0,
      reorderQty: 50.0,
      safetyStock: 5.0,
      expectedLeadTime: 2,
      standardRate: 4.50,
      lastPurchaseRate: 4.25,
      avgPurchaseRate: 4.35,
      preferredVendorId: 'NAX-VEN-00003',
      storageCondition: 'Dust-free cabinet',
      shelfLifeDays: null,
      batchTrackingRequired: false,
      expiryTrackingRequired: false,
      serialTrackingRequired: false,
      qualityInspectionRequired: false,
      classificationABC: 'C',
      classificationVED: 'D',
      classificationFNS: 'N',
      restrictedDepartments: null, // open to all
      isActive: true
    }
  ];

  for (const item of items) {
    await prisma.item.create({ data: item });
  }

  console.log('Seeding Stock Balances and Ledger entries...');
  const initialStock = [
    { itemCode: 'NAX-ITM-00001', batchNumber: 'BAT-PAR-2601', qty: 2500.0, rate: 12.50, warehouse: 'MAIN', location: 'RAW-LOC-1', status: 'AVAILABLE' },
    { itemCode: 'NAX-ITM-00001', batchNumber: 'BAT-PAR-2602', qty: 450.0, rate: 12.80, warehouse: 'MAIN', location: 'QUARANTINE_AREA', status: 'QUARANTINE' },
    { itemCode: 'NAX-ITM-00002', batchNumber: 'BAT-CRT-0219', qty: 45000.0, rate: 0.15, warehouse: 'MAIN', location: 'PKG-LOC-1', status: 'AVAILABLE' },
    { itemCode: 'NAX-ITM-00003', batchNumber: 'NA', qty: 15.0, rate: 7.50, warehouse: 'MAIN', location: 'SPARES-LOC-2', status: 'AVAILABLE' },
    { itemCode: 'NAX-ITM-00004', batchNumber: 'BAT-OIL-991A', qty: 65.0, rate: 15.00, warehouse: 'MAIN', location: 'CC-CHEM-LOC', status: 'AVAILABLE' },
    { itemCode: 'NAX-ITM-00005', batchNumber: 'NA', qty: 32.0, rate: 4.50, warehouse: 'MAIN', location: 'GEN-LOC', status: 'AVAILABLE' }
  ];

  for (const stock of initialStock) {
    const isAvail = stock.status === 'AVAILABLE';
    const isQuar = stock.status === 'QUARANTINE';

    // 1. Stock Balance
    await prisma.stockBalance.create({
      data: {
        itemCode: stock.itemCode,
        warehouse: stock.warehouse,
        location: stock.location,
        batchNumber: stock.batchNumber,
        serialNumber: 'NA',
        physicalQty: stock.qty,
        availableQty: isAvail ? stock.qty : 0.0,
        quarantineQty: isQuar ? stock.qty : 0.0,
        reservedQty: 0.0,
        blockedQty: 0.0,
        damagedQty: 0.0,
        expiredQty: 0.0
      }
    });

    // 2. Ledger Transaction
    await prisma.stockLedger.create({
      data: {
        transactionCode: 'NAX-OPN-2026-00001',
        itemCode: stock.itemCode,
        warehouse: stock.warehouse,
        location: stock.location,
        batchNumber: stock.batchNumber,
        serialNumber: 'NA',
        transactionType: 'OPENING_STOCK',
        qtyIn: stock.qty,
        qtyOut: 0.0,
        runningBalance: stock.qty,
        unitRate: stock.rate,
        transactionValue: stock.qty * stock.rate,
        referenceType: 'SYS',
        referenceCode: 'OPENING',
        performedBy: 'NAX-EMP-00002', // Director
        activeRole: 'DIRECTOR',
        comment: 'Initial system migration opening balance'
      }
    });
  }

  console.log('Seeding Vendors...');
  const vendors = [
    {
      vendorCode: 'NAX-VEN-00001',
      legalName: 'PharmaChem Industries Private Limited',
      tradeName: 'PharmaChem',
      address: 'Plot 42, Chemical Zone, GIDC, Ankleshwar, Gujarat, India',
      contactPerson: 'Mr. Rajesh Patel',
      phone: '+919900887766',
      email: 'sales@pharmachem.com',
      taxNumber: '24AAAAP1234F1Z9',
      bankDetails: 'HDFC Bank - A/C 50200012345678 - HDFC0000123',
      productCategories: 'Raw materials, API, Laboratory chemicals',
      approvedCategories: 'Raw materials, API',
      paymentTerms: 'Net 30 Days',
      leadTimeDays: 10,
      qualityStatus: 'APPROVED',
      isActive: true,
      performanceScore: 94.2
    },
    {
      vendorCode: 'NAX-VEN-00002',
      legalName: 'PackCraft Paper Mills Limited',
      tradeName: 'PackCraft',
      address: '109, Industrial Area Phase II, Okhla, New Delhi, India',
      contactPerson: 'Ms. Anita Deshmukh',
      phone: '+919988776655',
      email: 'orders@packcraft.co.in',
      taxNumber: '07AAACP5566G1Z2',
      bankDetails: 'ICICI Bank - A/C 000401556677 - ICIC0000004',
      productCategories: 'Printed packing materials, Packaging boxes',
      approvedCategories: 'Printed packing materials',
      paymentTerms: 'Net 45 Days',
      leadTimeDays: 7,
      qualityStatus: 'APPROVED',
      isActive: true,
      performanceScore: 89.0
    },
    {
      vendorCode: 'NAX-VEN-00003',
      legalName: 'TechnoParts Engineering Spares Limited',
      tradeName: 'TechnoParts',
      address: 'B-45, Phase 1, Industrial Estate, Peenya, Bangalore, India',
      contactPerson: 'Mr. George Kurian',
      phone: '+919845012345',
      email: 'support@technoparts.com',
      taxNumber: '29AAACT9900H1Z5',
      bankDetails: 'SBI - A/C 30044556677 - SBIN0004455',
      productCategories: 'Engineering spares, Machine parts, Tools, Lubricants',
      approvedCategories: 'Engineering spares, Lubricants, PPE',
      paymentTerms: 'Net 15 Days',
      leadTimeDays: 3,
      qualityStatus: 'APPROVED',
      isActive: true,
      performanceScore: 97.5
    }
  ];

  for (const vendor of vendors) {
    await prisma.vendor.create({ data: vendor });
  }

  console.log('Seeding Machine Master...');
  const machines = [
    {
      machineCode: 'NAX-MCH-00001',
      name: 'Rotary Tablet Press - Sejong PM4000',
      category: 'Production',
      manufacturer: 'Sejong Pharmatech',
      model: 'PM-4000D',
      serialNumber: 'SJ-PM-2022-881',
      plant: 'Plant 1',
      departmentCode: 'NAX-DEP-PROD',
      area: 'Compression Room 1',
      locationDetail: 'First Floor, Building B',
      installationDate: new Date('2022-04-12T00:00:00Z'),
      warrantyExpiry: new Date('2023-04-12T00:00:00Z'),
      amcVendor: 'TechnoParts',
      amcExpiry: new Date('2027-04-12T00:00:00Z'),
      capacity: '400,000 tablets/hour',
      criticality: 'HIGH',
      responsibleDept: 'NAX-DEP-ENG',
      ownerId: 'NAX-EMP-00003', // Robert Miller
      pmFrequency: 'MONTHLY',
      lastPMDate: new Date('2026-06-10T00:00:00Z'),
      nextPMDate: new Date('2026-07-10T00:00:00Z'),
      calibrationDue: new Date('2026-09-15T00:00:00Z'),
      sopPath: '/documents/sop_sejong_compression.pdf',
      manualPath: '/documents/manual_pm4000.pdf',
      status: 'RUNNING'
    },
    {
      machineCode: 'NAX-MCH-00002',
      name: 'High-Speed Blister Packing Machine - Elmach 3000',
      category: 'Packing',
      manufacturer: 'Elmach Packages',
      model: 'EP-3000 HS',
      serialNumber: 'ELM-EP-3000-112',
      plant: 'Plant 1',
      departmentCode: 'NAX-DEP-PACK',
      area: 'Secondary Packing Bay 2',
      locationDetail: 'Ground Floor, Building A',
      installationDate: new Date('2023-08-20T00:00:00Z'),
      warrantyExpiry: new Date('2024-08-20T00:00:00Z'),
      amcVendor: 'Elmach Direct',
      amcExpiry: new Date('2026-08-20T00:00:00Z'),
      capacity: '240 blisters/min',
      criticality: 'MEDIUM',
      responsibleDept: 'NAX-DEP-ENG',
      ownerId: 'NAX-EMP-00004', // David Vance
      pmFrequency: 'MONTHLY',
      lastPMDate: new Date('2026-06-15T00:00:00Z'),
      nextPMDate: new Date('2026-07-15T00:00:00Z'),
      status: 'RUNNING'
    },
    {
      machineCode: 'NAX-MCH-00003',
      name: 'Rotary Sterilizer Autoclave - Fedegari FOF5',
      category: 'Utility',
      manufacturer: 'Fedegari Group',
      model: 'FOF5-SteamSter',
      serialNumber: 'FD-FOF-2021-002',
      plant: 'Plant 1',
      departmentCode: 'NAX-DEP-PROD',
      area: 'Sterilization Corridor',
      locationDetail: 'First Floor, Sterile Block C',
      installationDate: new Date('2021-11-05T00:00:00Z'),
      warrantyExpiry: new Date('2022-11-05T00:00:00Z'),
      amcVendor: 'Fedegari India',
      amcExpiry: new Date('2026-11-05T00:00:00Z'),
      capacity: '1200 Litres load',
      criticality: 'CRITICAL',
      responsibleDept: 'NAX-DEP-ENG',
      ownerId: 'NAX-EMP-00003', // Robert Miller
      pmFrequency: 'QUARTERLY',
      lastPMDate: new Date('2026-04-12T00:00:00Z'),
      nextPMDate: new Date('2026-07-12T00:00:00Z'),
      calibrationDue: new Date('2026-07-02T00:00:00Z'),
      status: 'BREAKDOWN' // Starts as breakdown for demonstration
    }
  ];

  for (const mch of machines) {
    await prisma.machine.create({ data: mch });
    // Write opening status history
    await prisma.machineStatusHistory.create({
      data: {
        machineCode: mch.machineCode,
        status: mch.status,
        reason: 'Initial system load',
        performedBy: 'NAX-EMP-00004' // David Vance (Engineering Head)
      }
    });
  }

  console.log('Seeding Breakdown and Work Order History...');
  // 1. A closed work order to show records and statistics
  const bd1Code = 'NAX-BD-2026-00001';
  const wo1Code = 'NAX-WO-2026-00001';
  
  await prisma.breakdown.create({
    data: {
      breakdownCode: bd1Code,
      reportedAt: new Date('2026-06-25T08:30:00Z'),
      machineCode: 'NAX-MCH-00001',
      machineName: 'Rotary Tablet Press - Sejong PM4000',
      departmentCode: 'NAX-DEP-PROD',
      problemCategory: 'MECHANICAL',
      problemDescription: 'Loud knocking sound from the drive turret, turret shaft friction suspected',
      productionBatch: 'BAT-TAB-6652',
      priority: 'HIGH',
      safetyImpact: false,
      qualityImpact: true,
      productionImpact: true,
      estimatedLoss: 4.5,
      reportedBy: 'NAX-EMP-00009', // Amit Patel
      operator: 'Amit Patel',
      immediateAction: 'Stopped machine immediately to prevent mechanical seizure',
      stoppedAt: new Date('2026-06-25T08:30:00Z'),
      status: 'RESOLVED'
    }
  });

  await prisma.workOrder.create({
    data: {
      workOrderCode: wo1Code,
      breakdownCode: bd1Code,
      machineCode: 'NAX-MCH-00001',
      assignedTechnician: 'NAX-EMP-00008', // John Doe
      plannedStart: new Date('2026-06-25T09:00:00Z'),
      targetCompletion: new Date('2026-06-25T14:00:00Z'),
      actualStart: new Date('2026-06-25T09:15:00Z'),
      actualCompletion: new Date('2026-06-25T13:00:00Z'),
      diagnosis: 'Main drive roller bearing worn out and seized, causing turret shaft misalignment',
      workPerformed: 'Dismantled main drive turret assembly, removed damaged bearing, cleaned seat, pressed new 6204-2RS bearing, refilled gear oil, adjusted play and reassembled.',
      rootCause: 'Normal operational fatigue combined with minor lubricant breakdown',
      correctiveAction: 'Replaced ball bearing and replenished ISO VG 100 lubricating oil',
      preventiveAction: 'Advised operators to verify turret lubrication checkglass daily before starting shift',
      laborHours: 3.75,
      vendorCost: 0.0,
      spareCost: 7.50, // cost of 1x Bearing 6204
      totalCost: 7.50,
      status: 'CLOSED',
      trialRunResult: 'SUCCESS',
      verificationComment: 'Trial run completed. Turret operating smoothly, noise level within limits. Verified by DH.'
    }
  });

  // Log spare part consumption for closed work order
  await prisma.sparePartUsage.create({
    data: {
      workOrderCode: wo1Code,
      itemCode: 'NAX-ITM-00003', // Ball bearing
      itemName: 'Ball Bearing 6204-2RS',
      qty: 1.0,
      unitRate: 7.50,
      totalValue: 7.50,
      requestedBy: 'NAX-EMP-00008',
      issuedBy: 'NAX-EMP-00005',
      issuedAt: new Date('2026-06-25T10:00:00Z')
    }
  });

  // 2. An active breakdown to demonstrate workflows in the UI
  const bd2Code = 'NAX-BD-2026-00002';
  const wo2Code = 'NAX-WO-2026-00002';

  await prisma.breakdown.create({
    data: {
      breakdownCode: bd2Code,
      reportedAt: new Date('2026-06-30T10:15:00Z'), // Reported today
      machineCode: 'NAX-MCH-00003',
      machineName: 'Rotary Sterilizer Autoclave - Fedegari FOF5',
      departmentCode: 'NAX-DEP-PROD',
      problemCategory: 'ELECTRICAL',
      problemDescription: 'Steam chamber pressure door lock solenoid coil burnt, door locking validation failing, cycle cannot start.',
      productionBatch: 'BAT-STER-8891',
      priority: 'CRITICAL',
      safetyImpact: true,
      qualityImpact: true,
      productionImpact: true,
      estimatedLoss: 12.0,
      reportedBy: 'NAX-EMP-00003', // Robert Miller
      operator: 'Suresh Kumar',
      immediateAction: 'Aborted cycle safely, vented pressure, quarantined batch for QA evaluation',
      stoppedAt: new Date('2026-06-30T10:15:00Z'),
      status: 'ASSIGNED'
    }
  });

  await prisma.workOrder.create({
    data: {
      workOrderCode: wo2Code,
      breakdownCode: bd2Code,
      machineCode: 'NAX-MCH-00003',
      assignedTechnician: 'NAX-EMP-00008', // John Doe
      plannedStart: new Date('2026-06-30T11:00:00Z'),
      targetCompletion: new Date('2026-06-30T18:00:00Z'),
      actualStart: new Date('2026-06-30T11:30:00Z'),
      diagnosis: 'Burnt door solenoid coil due to voltage spike. Replacement spare solenoid coil (OEM Fedegari Part FD-SL-90) is NOT available in stock.',
      status: 'AWAITING_SPARE',
      spareCost: 0.0,
      totalCost: 0.0
    }
  });

  console.log('Seeding Preventive Maintenance Schedules...');
  await prisma.preventiveMaintenanceSchedule.create({
    data: {
      scheduleCode: 'NAX-PM-2026-00001',
      machineCode: 'NAX-MCH-00001',
      machineName: 'Rotary Tablet Press - Sejong PM4000',
      recurrence: 'MONTHLY',
      checklist: 'Inspect drive belts tension; Clean & grease main turret bearings; Check gear box oil level & top up; Test emergency stop switches; Verify dust collector filters.',
      nextRun: new Date('2026-07-10T09:00:00Z'),
      assignedTechnician: 'NAX-EMP-00008',
      status: 'ACTIVE'
    }
  });

  await prisma.preventiveMaintenanceSchedule.create({
    data: {
      scheduleCode: 'NAX-PM-2026-00002',
      machineCode: 'NAX-MCH-00003',
      machineName: 'Rotary Sterilizer Autoclave - Fedegari FOF5',
      recurrence: 'QUARTERLY',
      checklist: 'Validate temperature sensors; Check chamber vacuum leak test; Inspect door silicone gasket seal; Verify steam regulator pressure valves; Calibrate chamber chart recorder.',
      lastRun: new Date('2026-04-12T00:00:00Z'),
      nextRun: new Date('2026-07-12T09:00:00Z'),
      assignedTechnician: 'NAX-EMP-00008',
      status: 'ACTIVE'
    }
  });

  console.log('Seeding Initial Comments...');
  await prisma.comment.create({
    data: {
      recordType: 'BREAKDOWN',
      recordCode: bd2Code,
      userName: 'David Vance',
      employeeCode: 'NAX-EMP-00004',
      role: 'MAINTENANCE_HEAD',
      content: 'I have assigned John Doe to inspect this immediately. Critical safety interlock involved.'
    }
  });

  await prisma.comment.create({
    data: {
      recordType: 'BREAKDOWN',
      recordCode: bd2Code,
      userName: 'John Doe',
      employeeCode: 'NAX-EMP-00008',
      role: 'MAINTENANCE_TECH',
      content: 'Inspection complete. Solenoid is completely dead. We do not have Fedegari replacement solenoids in the warehouse spares location. Need to request emergency purchase.'
    }
  });

  await prisma.comment.create({
    data: {
      recordType: 'ITEM',
      recordCode: 'NAX-ITM-00001',
      userName: 'Elena Rostova',
      employeeCode: 'NAX-EMP-00007',
      role: 'QA_QC',
      content: 'Batch BAT-PAR-2602 is in quarantine. Waiting for laboratory assay report on bulk density and impurity limits. Do not issue.'
    }
  });

  console.log('Seeding Notifications...');
  await prisma.notification.create({
    data: {
      employeeCode: 'NAX-EMP-00004', // Maintenance Head
      title: 'Critical Breakdown Reported',
      message: 'David, a critical breakdown on Sterilizer Autoclave (NAX-MCH-00003) has been reported by Robert Miller.',
      isRead: false
    }
  });

  await prisma.notification.create({
    data: {
      employeeCode: 'NAX-EMP-00006', // Purchase Manager
      title: 'Soleneiod Spare Stock Alert',
      message: 'Technician John Doe flagged that door solenoid coil FD-SL-90 is unavailable for sterile autoclave repairs. Expecting purchase requisition.',
      isRead: false
    }
  });

  console.log('Seeding Audit Log...');
  await prisma.auditLog.create({
    data: {
      userId: 'sarah.jenkins@naxcuure.com',
      userName: 'Sarah Jenkins',
      employeeCode: 'NAX-EMP-00001',
      activeRole: 'HR',
      module: 'USERS',
      action: 'CREATE',
      recordType: 'User',
      recordCode: 'NAX-USR-00009',
      newValue: 'Created employee Amit Patel as Production Operator',
      comment: 'Standard hiring onboarding'
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: 'arthur.nax@naxcuure.com',
      userName: 'Dr. Arthur Nax',
      employeeCode: 'NAX-EMP-00002',
      activeRole: 'DIRECTOR',
      module: 'ITEMS',
      action: 'CREATE',
      recordType: 'Item',
      recordCode: 'NAX-ITM-00001',
      newValue: 'Created Paracetamol Active Ingredient API item record',
      comment: 'Item Master initialization'
    }
  });

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
