'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function QualityPage() {
  const { currentUser, activeRole } = useApp();
  const [grns, setGrns] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [posList, setPosList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // GRN form drawer
  const [showGrnDrawer, setShowGrnDrawer] = useState(false);
  const [selectedPoCode, setSelectedPoCode] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [deliveryChallan, setDeliveryChallan] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [gateEntryNumber, setGateEntryNumber] = useState('');
  const [grnItems, setGrnItems] = useState<any[]>([
    { itemCode: '', itemName: '', receivedQty: 1, batchNumber: '', manufacturingDate: '', expiryDate: '', storageLocation: 'QUARANTINE_AREA' }
  ]);
  const [grnError, setGrnError] = useState('');

  // QA Inspection form drawer
  const [selectedQa, setSelectedQa] = useState<any>(null);
  const [testResult, setTestResult] = useState('APPROVED');
  const [acceptedQty, setAcceptedQty] = useState('');
  const [rejectedQty, setRejectedQty] = useState('0');
  const [testSpec, setTestSpec] = useState('USP Assay limit 98.0% - 101.0%');
  const [observation, setObservation] = useState('');
  const [coaAttached, setCoaAttached] = useState(true);
  const [qaError, setQaError] = useState('');

  useEffect(() => {
    fetchQualityData();
  }, []);

  const fetchQualityData = async () => {
    try {
      const res = await fetch('/api/quality');
      const data = await res.json();
      setGrns(data.grns || []);
      setInspections(data.inspections || []);

      // Fetch active POs for reference in GRN
      const poRes = await fetch('/api/purchase');
      const poData = await poRes.json();
      setPosList(poData.pos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePoSelect = async (poCode: string) => {
    setSelectedPoCode(poCode);
    const matchedPo = posList.find((p) => p.poCode === poCode);
    if (matchedPo) {
      try {
        const res = await fetch(`/api/purchase?type=po&code=${poCode}`);
        const data = await res.json();
        const items = data.items || [];
        setGrnItems(items.map((itm: any) => ({
          itemCode: itm.itemCode,
          itemName: itm.itemName,
          receivedQty: itm.qty - itm.receivedQty > 0 ? itm.qty - itm.receivedQty : 0,
          batchNumber: '',
          manufacturingDate: '',
          expiryDate: '',
          storageLocation: 'QUARANTINE_AREA'
        })));
      } catch (err) {
        console.error('Failed to fetch PO items', err);
      }
    }
  };

  const handleCreateGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrnError('');

    if (!selectedPoCode || !invoiceNumber || !gateEntryNumber) {
      setGrnError('Please fill in PO reference, Invoice #, and Gate Entry #.');
      return;
    }

    const matchedPo = posList.find(p => p.poCode === selectedPoCode);

    try {
      const res = await fetch('/api/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_GRN',
          poCode: selectedPoCode,
          vendorCode: matchedPo?.vendorCode || 'NAX-VEN-00001',
          invoiceNumber,
          invoiceDate: invoiceDate || new Date().toISOString(),
          deliveryChallan,
          vehicleNumber,
          gateEntryNumber,
          items: grnItems,
          employeeCode: currentUser?.employeeCode,
          userName: currentUser?.fullName,
          activeRole
        })
      });

      const data = await res.json();
      if (data.error) {
        setGrnError(data.error);
      } else {
        setShowGrnDrawer(false);
        // Reset form
        setSelectedPoCode('');
        setInvoiceNumber('');
        setGateEntryNumber('');
        fetchQualityData();
      }
    } catch (err) {
      setGrnError('Failed to create Goods Receipt entry.');
    }
  };

  const handleQaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQaError('');

    if (!acceptedQty) {
      setQaError('Please define accepted quantity.');
      return;
    }

    try {
      const res = await fetch('/api/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PERFORM_INSPECTION',
          inspectionCode: selectedQa.inspectionCode,
          result: testResult,
          acceptedQty,
          rejectedQty,
          observation,
          testSpec,
          employeeCode: currentUser?.employeeCode,
          userName: currentUser?.fullName,
          activeRole
        })
      });

      const data = await res.json();
      if (data.error) {
        setQaError(data.error);
      } else {
        setSelectedQa(null);
        fetchQualityData();
      }
    } catch (err) {
      setQaError('Failed to log quality release decision.');
    }
  };

  const isStore = ['INVENTORY_HEAD', 'INVENTORY_EXEC'].includes(activeRole) || activeRole === 'DIRECTOR';
  const isQA = activeRole === 'QA_QC' || activeRole === 'DIRECTOR';

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading Goods Receipt & QA...</div>;
  }

  return (
    <div>
      <div className="flex-space mb-4">
        <div>
          <h2>Goods Receipt & Quality Inspection</h2>
          <p className="text-muted">Receive incoming PO deliveries, verify certificates (COA), and release items from quarantine.</p>
        </div>
        {isStore && (
          <button className="btn btn-primary" onClick={() => setShowGrnDrawer(true)}>
            Record Goods Receipt (GRN)
          </button>
        )}
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* GRN list */}
        <div className="table-container">
          <div className="table-header-bar">
            <h3>Goods Receipt Notes (GRN)</h3>
          </div>
          <div className="nax-table-wrapper" style={{ maxHeight: '420px' }}>
            <table className="nax-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>GRN Code</th>
                  <th>PO Code</th>
                  <th>Vendor</th>
                  <th>Invoice Number</th>
                  <th>Received Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {grns.map((grn) => (
                  <tr key={grn.grnCode}>
                    <td className="text-bold">{grn.grnCode}</td>
                    <td>{grn.poCode}</td>
                    <td>{grn.vendorCode}</td>
                    <td>{grn.invoiceNumber}</td>
                    <td>{new Date(grn.receivedDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${grn.status.toLowerCase()}`}>
                        {grn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quality Inspection tickets */}
        <div className="table-container">
          <div className="table-header-bar">
            <h3>Quality Assurance Inspections</h3>
          </div>
          <div className="nax-table-wrapper" style={{ maxHeight: '420px' }}>
            <table className="nax-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Inspection Code</th>
                  <th>Item Code</th>
                  <th>Batch Number</th>
                  <th>Qty</th>
                  <th>Result Status</th>
                  <th>Control Action</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((qa) => (
                  <tr key={qa.inspectionCode}>
                    <td className="text-bold">{qa.inspectionCode}</td>
                    <td>{qa.itemCode}</td>
                    <td>{qa.batchNumber}</td>
                    <td className="text-bold">{qa.receivedQty}</td>
                    <td>
                      <span className={`status-badge ${qa.result.toLowerCase()}`}>
                        {qa.result}
                      </span>
                    </td>
                    <td>
                      {isQA && qa.result === 'PENDING' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setSelectedQa(qa);
                            setAcceptedQty(qa.receivedQty.toString());
                          }}
                        >
                          Test & Release
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* GRN FORM DRAWER */}
      {showGrnDrawer && (
        <div className="drawer-backdrop" onClick={() => setShowGrnDrawer(false)}>
          <form onSubmit={handleCreateGrn} className="drawer-content" style={{ width: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Create Goods Receipt Note (GRN)</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowGrnDrawer(false)}>X</button>
            </div>
            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {grnError && (
                <div className="nax-warning-box">
                  <div className="nax-warning-title">Submission Error</div>
                  <div>{grnError}</div>
                </div>
              )}

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Select Purchase Order Reference *</label>
                  <select className="form-control" value={selectedPoCode} onChange={(e) => handlePoSelect(e.target.value)} required>
                    <option value="">-- Choose PO --</option>
                    {posList.map((po) => (
                      <option key={po.poCode} value={po.poCode}>{po.poCode} (to {po.vendorName})</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Gate Entry Registry Number *</label>
                  <input type="text" className="form-control" placeholder="e.g. NAX-GATE-6612" value={gateEntryNumber} onChange={(e) => setGateEntryNumber(e.target.value)} required />
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Vendor Invoice Number *</label>
                  <input type="text" className="form-control" placeholder="e.g. INV-90082" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required />
                </div>
                
                <div className="form-group">
                  <label>Invoice Billing Date *</label>
                  <input type="date" className="form-control" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Delivery Challan / Waybill</label>
                  <input type="text" className="form-control" placeholder="e.g. DC-99801" value={deliveryChallan} onChange={(e) => setDeliveryChallan(e.target.value)} />
                </div>
                
                <div className="form-group">
                  <label>Delivery Vehicle Number</label>
                  <input type="text" className="form-control" placeholder="e.g. GJ-01-XY-5432" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
                </div>
              </div>

              {/* GRN ITEMS LIST (Auto populated from PO selection) */}
              <div style={{ border: '1px solid var(--border-grey)', padding: '12px', borderRadius: 'var(--border-radius)' }}>
                <h4 style={{ marginBottom: '10px' }}>Quarantined Items & Batch Registration</h4>
                
                {grnItems.map((itm, i) => (
                  <div key={i} style={{ borderBottom: '1px solid var(--border-grey)', paddingBottom: '10px', marginBottom: '10px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--deep-blue)', marginBottom: '8px' }}>
                      {itm.itemCode}: {itm.itemName}
                    </div>
                    
                    <div className="form-grid" style={{ gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '0.7rem' }}>Batch Number *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. BAT-2601"
                          value={itm.batchNumber}
                          onChange={(e) => {
                            const updated = [...grnItems];
                            updated[i].batchNumber = e.target.value;
                            setGrnItems(updated);
                          }}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label style={{ fontSize: '0.7rem' }}>Received Qty *</label>
                        <input
                          type="number"
                          className="form-control"
                          value={itm.receivedQty}
                          onChange={(e) => {
                            const updated = [...grnItems];
                            updated[i].receivedQty = parseFloat(e.target.value) || 0;
                            setGrnItems(updated);
                          }}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: '0.7rem' }}>Storage location</label>
                        <input type="text" className="form-control" value={itm.storageLocation} disabled />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowGrnDrawer(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Receive & Quarantine Stock</button>
            </div>
          </form>
        </div>
      )}

      {/* QA TEST DRAWER */}
      {selectedQa && (
        <div className="drawer-backdrop" onClick={() => setSelectedQa(null)}>
          <form onSubmit={handleQaSubmit} className="drawer-content" style={{ width: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Perform Laboratory Inspection & Release</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedQa(null)}>X</button>
            </div>
            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {qaError && (
                <div className="nax-warning-box">
                  <div className="nax-warning-title">Inspection Logging Error</div>
                  <div>{qaError}</div>
                </div>
              )}

              <div style={{ backgroundColor: 'var(--light-blue)', padding: '12px', borderRadius: 'var(--border-radius)', fontSize: '0.85rem' }}>
                <div><strong>Item Code:</strong> {selectedQa.itemCode} | {selectedQa.itemName}</div>
                <div><strong>Received Batch:</strong> {selectedQa.batchNumber}</div>
                <div><strong>Total Received Qty:</strong> {selectedQa.receivedQty} units</div>
                <div><strong>Linked GRN Code:</strong> {selectedQa.grnCode}</div>
              </div>

              <div className="form-group">
                <label>Quality Test Result Decision *</label>
                <select className="form-control" value={testResult} onChange={(e) => setTestResult(e.target.value)}>
                  <option value="APPROVED">APPROVED (Release to Available Store)</option>
                  <option value="REJECTED">REJECTED (Move to Scrap Yard)</option>
                  <option value="QUARANTINE">HOLD IN QUARANTINE</option>
                </select>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Accepted Release Qty *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={acceptedQty}
                    onChange={(e) => {
                      const acc = parseFloat(e.target.value) || 0;
                      setAcceptedQty(e.target.value);
                      setRejectedQty((selectedQa.receivedQty - acc).toString());
                    }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Rejected Damage Qty</label>
                  <input type="number" className="form-control" value={rejectedQty} disabled />
                </div>
              </div>

              <div className="form-group">
                <label>Laboratory Testing Specifications</label>
                <input type="text" className="form-control" value={testSpec} onChange={(e) => setTestSpec(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Observation Findings & Remarks</label>
                <textarea
                  className="form-control"
                  style={{ height: '60px', resize: 'vertical' }}
                  placeholder="e.g. Chemical assay is 99.8%, passing standard criteria. Certificate of Analysis verified."
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                />
              </div>

              <label className="flex-row mt-2">
                <input type="checkbox" checked={coaAttached} onChange={(e) => setCoaAttached(e.target.checked)} />
                <span>Certificate of Analysis (COA) PDF Verified & Attached</span>
              </label>
            </div>
            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedQa(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Publish QA Decision</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
