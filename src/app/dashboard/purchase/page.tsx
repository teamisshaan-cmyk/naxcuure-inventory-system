'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function PurchasePage() {
  const { currentUser, activeRole } = useApp();
  const [data, setData] = useState<any>({ prs: [], rfqs: [], quotations: [], pos: [], vendors: [] });
  const [loading, setLoading] = useState(true);

  // RFQ form
  const [showRfqDrawer, setShowRfqDrawer] = useState(false);
  const [selectedPr, setSelectedPr] = useState<any>(null);
  const [rfqDueDate, setRfqDueDate] = useState('');

  // Quotation form
  const [showQuoteDrawer, setShowQuoteDrawer] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [quoteVendorCode, setQuoteVendorCode] = useState('');
  const [quoteRate, setQuoteRate] = useState('');
  const [quoteDiscount, setQuoteDiscount] = useState('0');
  const [quoteFreight, setQuoteFreight] = useState('0');
  const [quoteTax, setQuoteTax] = useState('18');
  const [quoteLeadTime, setQuoteLeadTime] = useState('7');
  const [quotePayment, setQuotePayment] = useState('Net 30 Days');
  const [quoteWarranty, setQuoteWarranty] = useState('1 Year');

  // Quotation comparison
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonRfqCode, setComparisonRfqCode] = useState('');
  const [justification, setJustification] = useState('');

  // PO form
  const [showPoDrawer, setShowPoDrawer] = useState(false);
  const [poVendorCode, setPoVendorCode] = useState('');
  const [poBilling, setPoBilling] = useState('Naxcuure Plant 1, Warehouse Unit A, Gujarat');
  const [poDelivery, setPoDelivery] = useState('Central Warehouse, Plant 1');
  const [poPayment, setPoPayment] = useState('Net 30 Days');
  const [poDate, setPoDate] = useState('');
  const [poItems, setPoItems] = useState<any[]>([{ itemCode: '', itemName: '', qty: 1, rate: 0 }]);

  useEffect(() => {
    fetchPurchaseData();
  }, []);

  const fetchPurchaseData = async () => {
    try {
      const res = await fetch('/api/purchase');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPr || !rfqDueDate) return;

    try {
      await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_RFQ',
          prCode: selectedPr.prCode,
          itemCode: selectedPr.itemCode,
          qty: selectedPr.requiredQty,
          dueDate: rfqDueDate
        })
      });
      setShowRfqDrawer(false);
      fetchPurchaseData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfq || !quoteVendorCode || !quoteRate) return;

    try {
      await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_QUOTATION',
          rfqCode: selectedRfq.rfqCode,
          vendorCode: quoteVendorCode,
          rate: quoteRate,
          discount: quoteDiscount,
          freight: quoteFreight,
          taxRate: quoteTax,
          deliveryTimeDays: quoteLeadTime,
          paymentTerms: quotePayment,
          warranty: quoteWarranty,
          isCompliant: true,
          notes: 'Standard quote upload.'
        })
      });
      setShowQuoteDrawer(false);
      fetchPurchaseData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectVendor = async (quotationCode: string, rfqCode: string) => {
    if (!justification.trim()) {
      alert('Please enter selection justification notes.');
      return;
    }

    try {
      await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SELECT_VENDOR',
          quotationCode,
          rfqCode,
          selectionJustification: justification
        })
      });
      setShowComparison(false);
      setJustification('');
      fetchPurchaseData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poVendorCode || poItems.some(i => !i.itemCode || i.qty <= 0)) return;

    try {
      await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_PO',
          vendorCode: poVendorCode,
          billingAddress: poBilling,
          deliveryAddress: poDelivery,
          paymentTerms: poPayment,
          deliveryDate: poDate,
          items: poItems,
          employeeCode: currentUser?.employeeCode,
          userName: currentUser?.fullName,
          activeRole
        })
      });
      setShowPoDrawer(false);
      fetchPurchaseData();
    } catch (err) {
      console.error(err);
    }
  };

  const activeQuotes = data.quotations.filter((q: any) => q.rfqCode === comparisonRfqCode);
  const lowestLandedCost = activeQuotes.length > 0
    ? Math.min(...activeQuotes.map((q: any) => q.landedCost))
    : 0;

  const isPurchaser = ['PURCHASE_MANAGER', 'PURCHASE_EXEC'].includes(activeRole) || activeRole === 'DIRECTOR';

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading Procurement data...</div>;
  }

  return (
    <div>
      <div className="flex-space mb-4">
        <div>
          <h2>Procurement & Purchase Control Center</h2>
          <p className="text-muted">Compare quotations, manage purchase requisitions, and issue vendor orders.</p>
        </div>
        {isPurchaser && (
          <div className="flex-row">
            <button className="btn btn-primary" onClick={() => setShowPoDrawer(true)}>
              Issue Purchase Order (PO)
            </button>
          </div>
        )}
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Requisitions */}
        <div className="table-container">
          <div className="table-header-bar">
            <h3>Incoming Purchase Requisitions (PR)</h3>
          </div>
          <div className="nax-table-wrapper" style={{ maxHeight: '250px' }}>
            <table className="nax-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>PR Code</th>
                  <th>Item Requested</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.prs.map((pr: any) => (
                  <tr key={pr.prCode}>
                    <td className="text-bold">{pr.prCode}</td>
                    <td>{pr.itemName}</td>
                    <td className="text-bold">{pr.requiredQty}</td>
                    <td>
                      <span className={`status-badge ${pr.status.toLowerCase()}`}>
                        {pr.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {isPurchaser && pr.status === 'PENDING_PURCHASE' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setSelectedPr(pr);
                            setShowRfqDrawer(true);
                          }}
                        >
                          Issue RFQ
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active RFQs */}
        <div className="table-container">
          <div className="table-header-bar">
            <h3>Active Request for Quotation (RFQ)</h3>
          </div>
          <div className="nax-table-wrapper" style={{ maxHeight: '250px' }}>
            <table className="nax-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>RFQ Code</th>
                  <th>PR Link</th>
                  <th>Target Date</th>
                  <th>Status</th>
                  <th>Control Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.rfqs.map((rfq: any) => (
                  <tr key={rfq.rfqCode}>
                    <td className="text-bold">{rfq.rfqCode}</td>
                    <td>{rfq.prCode}</td>
                    <td>{new Date(rfq.dueDate).toLocaleDateString()}</td>
                    <td><span className="status-badge running">{rfq.status}</span></td>
                    <td>
                      <div className="flex-row">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setSelectedRfq(rfq);
                            setShowQuoteDrawer(true);
                          }}
                        >
                          Log Quote
                        </button>
                        <button
                          className="btn btn-blue btn-sm"
                          onClick={() => {
                            setComparisonRfqCode(rfq.rfqCode);
                            setShowComparison(true);
                          }}
                        >
                          Compare Quotes
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PO LIST TABLE */}
      <div className="table-container mt-4">
        <div className="table-header-bar">
          <h3>Purchase Order History</h3>
        </div>
        <div className="nax-table-wrapper">
          <table className="nax-table">
            <thead>
              <tr>
                <th>PO Code</th>
                <th>Supplier Vendor</th>
                <th>Payment Terms</th>
                <th>Target Delivery</th>
                <th>Total Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.pos.map((po: any) => (
                <tr key={po.poCode}>
                  <td className="text-bold" style={{ color: 'var(--primary-blue)' }}>{po.poCode}</td>
                  <td className="text-bold">{po.vendorName}</td>
                  <td>{po.paymentTerms}</td>
                  <td>{new Date(po.deliveryDate).toLocaleDateString()}</td>
                  <td className="text-bold">${po.totalAmount.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${po.status.toLowerCase()}`}>
                      {po.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* VENDOR MASTER */}
      <div className="table-container mt-4">
        <div className="table-header-bar">
          <h3>Approved Vendor Master Directory</h3>
        </div>
        <div className="nax-table-wrapper">
          <table className="nax-table">
            <thead>
              <tr>
                <th>Vendor Code</th>
                <th>Legal Vendor Name</th>
                <th>Contact Phone</th>
                <th>Category Scope</th>
                <th>Lead Time</th>
                <th>Performance Rating</th>
                <th>Quality Status</th>
              </tr>
            </thead>
            <tbody>
              {data.vendors.map((v: any) => (
                <tr key={v.vendorCode}>
                  <td className="text-bold">{v.vendorCode}</td>
                  <td className="text-bold">{v.legalName}</td>
                  <td>{v.phone}</td>
                  <td>{v.productCategories}</td>
                  <td>{v.leadTimeDays} Days</td>
                  <td className="text-bold" style={{ color: v.performanceScore >= 90 ? 'var(--status-approved-text)' : 'var(--status-pending-text)' }}>
                    {v.performanceScore}%
                  </td>
                  <td>
                    <span className="status-badge approved">{v.qualityStatus}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RFQ DRAWER */}
      {showRfqDrawer && selectedPr && (
        <div className="drawer-backdrop" onClick={() => setShowRfqDrawer(false)}>
          <form onSubmit={handleCreateRfq} className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Issue Request for Quotation (RFQ)</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowRfqDrawer(false)}>X</button>
            </div>
            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><strong>PR Ref Code:</strong> {selectedPr.prCode}</div>
              <div><strong>Item Code:</strong> {selectedPr.itemCode}</div>
              <div><strong>Requested Qty:</strong> {selectedPr.requiredQty} units</div>
              
              <div className="form-group">
                <label>Quotation Submission Due Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={rfqDueDate}
                  onChange={(e) => setRfqDueDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowRfqDrawer(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Dispatch RFQ</button>
            </div>
          </form>
        </div>
      )}

      {/* LOG QUOTATION RATE DRAWER */}
      {showQuoteDrawer && selectedRfq && (
        <div className="drawer-backdrop" onClick={() => setShowQuoteDrawer(false)}>
          <form onSubmit={handleSaveQuotation} className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Log Vendor Quotation</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowQuoteDrawer(false)}>X</button>
            </div>
            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><strong>RFQ Link:</strong> {selectedRfq.rfqCode}</div>

              <div className="form-group">
                <label>Select Vendor Supplier *</label>
                <select className="form-control" value={quoteVendorCode} onChange={(e) => setQuoteVendorCode(e.target.value)} required>
                  <option value="">-- Choose Vendor --</option>
                  {data.vendors.map((v: any) => (
                    <option key={v.vendorCode} value={v.vendorCode}>{v.legalName} ({v.vendorCode})</option>
                  ))}
                </select>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Quoted Rate ($/unit) *</label>
                  <input type="number" className="form-control" value={quoteRate} onChange={(e) => setQuoteRate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Trade Discount (%)</label>
                  <input type="number" className="form-control" value={quoteDiscount} onChange={(e) => setQuoteDiscount(e.target.value)} />
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Freight / Delivery Shipping Charges ($)</label>
                  <input type="number" className="form-control" value={quoteFreight} onChange={(e) => setQuoteFreight(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>GST / Tax Rate (%)</label>
                  <input type="number" className="form-control" value={quoteTax} onChange={(e) => setQuoteTax(e.target.value)} />
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Delivery Lead Time (Days) *</label>
                  <input type="number" className="form-control" value={quoteLeadTime} onChange={(e) => setQuoteLeadTime(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Payment Terms</label>
                  <input type="text" className="form-control" value={quotePayment} onChange={(e) => setQuotePayment(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowQuoteDrawer(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Quote</button>
            </div>
          </form>
        </div>
      )}

      {/* SIDE-BY-SIDE QUOTATION COMPARISON MODAL */}
      {showComparison && (
        <div className="drawer-backdrop" onClick={() => setShowComparison(false)}>
          <div className="drawer-content" style={{ width: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Side-by-Side Quotation Comparison</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowComparison(false)}>X</button>
            </div>
            <div className="drawer-body">
              <h4 style={{ marginBottom: '12px' }}>Comparison Sheet for RFQ: {comparisonRfqCode}</h4>
              
              {activeQuotes.length === 0 ? (
                <div className="p-4 text-center text-muted">No quotations logged for this RFQ yet.</div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', marginBottom: '24px' }}>
                    {activeQuotes.map((q: any) => {
                      const isLowest = q.landedCost === lowestLandedCost;
                      return (
                        <div
                          key={q.quotationCode}
                          style={{
                            border: isLowest ? '2.5px solid var(--primary-orange)' : '1px solid var(--border-grey)',
                            borderRadius: 'var(--border-radius)',
                            padding: '16px',
                            minWidth: '220px',
                            backgroundColor: isLowest ? 'var(--light-orange)' : 'white',
                            flexGrow: 1
                          }}
                        >
                          {isLowest && (
                            <span className="status-badge pending" style={{ fontSize: '0.6rem', marginBottom: '8px' }}>
                              LOWEST LANDED COST
                            </span>
                          )}
                          <h4 style={{ color: 'var(--deep-blue)' }}>{q.vendorName}</h4>
                          <hr style={{ margin: '8px 0', borderColor: 'var(--border-grey)' }} />
                          <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div>Rate: <strong>${q.rate.toFixed(2)}</strong></div>
                            <div>Discount: <strong>{q.discount}%</strong></div>
                            <div>Freight: <strong>${q.freight}</strong></div>
                            <div>Tax Rate: <strong>{q.taxRate}%</strong></div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--primary-blue)', marginTop: '4px' }}>
                              Landed Cost: <strong>${q.landedCost.toFixed(2)}</strong>
                            </div>
                            <hr style={{ margin: '4px 0', borderColor: 'var(--border-grey)' }} />
                            <div>Lead Time: <strong>{q.deliveryTimeDays} Days</strong></div>
                            <div>Payment: <strong>{q.paymentTerms}</strong></div>
                            <div>Warranty: <strong>{q.warranty || 'N/A'}</strong></div>
                          </div>
                          
                          {isPurchaser && (
                            <button
                              className="btn btn-primary btn-sm mt-4"
                              style={{ width: '100%' }}
                              onClick={() => handleSelectVendor(q.quotationCode, q.rfqCode)}
                            >
                              Select Supplier
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="form-group">
                    <label>Vendor Selection Justification Note *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Selected lowest landed cost complying with lead times..."
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PO BUILDER DRAWER */}
      {showPoDrawer && (
        <div className="drawer-backdrop" onClick={() => setShowPoDrawer(false)}>
          <form onSubmit={handleCreatePo} className="drawer-content" style={{ width: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Create Purchase Order (PO)</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPoDrawer(false)}>X</button>
            </div>
            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>Select Vendor Supplier *</label>
                <select className="form-control" value={poVendorCode} onChange={(e) => setPoVendorCode(e.target.value)} required>
                  <option value="">-- Choose Vendor --</option>
                  {data.vendors.map((v: any) => (
                    <option key={v.vendorCode} value={v.vendorCode}>{v.legalName} ({v.vendorCode})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Billing Office Address</label>
                <input type="text" className="form-control" value={poBilling} onChange={(e) => setPoBilling(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Delivery Warehouse Address</label>
                <input type="text" className="form-control" value={poDelivery} onChange={(e) => setPoDelivery(e.target.value)} />
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Payment Terms</label>
                  <input type="text" className="form-control" value={poPayment} onChange={(e) => setPoPayment(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Target Delivery Date *</label>
                  <input type="date" className="form-control" value={poDate} onChange={(e) => setPoDate(e.target.value)} required />
                </div>
              </div>

              {/* PO ITEMS LIST */}
              <div style={{ border: '1px solid var(--border-grey)', padding: '12px', borderRadius: 'var(--border-radius)' }}>
                <h4 style={{ marginBottom: '8px' }}>Purchase Items</h4>
                {poItems.map((itm, i) => (
                  <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    <select
                      className="form-control"
                      style={{ flexGrow: 2 }}
                      value={itm.itemCode}
                      onChange={(e) => {
                        const matched = data.prs.find((pr: any) => pr.itemCode === e.target.value) || { itemName: e.target.value };
                        const updated = [...poItems];
                        updated[i] = { ...updated[i], itemCode: e.target.value, itemName: matched.itemName };
                        setPoItems(updated);
                      }}
                      required
                    >
                      <option value="">-- Select Item --</option>
                      <option value="NAX-ITM-00001">NAX-ITM-00001: Paracetamol API</option>
                      <option value="NAX-ITM-00002">NAX-ITM-00002: Duplex Printed Box</option>
                      <option value="NAX-ITM-00003">NAX-ITM-00003: Ball Bearing 6204</option>
                    </select>
                    <input
                      type="number"
                      className="form-control"
                      style={{ width: '70px' }}
                      placeholder="Qty"
                      value={itm.qty}
                      onChange={(e) => {
                        const updated = [...poItems];
                        updated[i].qty = parseFloat(e.target.value) || 0;
                        setPoItems(updated);
                      }}
                      required
                    />
                    <input
                      type="number"
                      className="form-control"
                      style={{ width: '80px' }}
                      placeholder="Rate"
                      value={itm.rate}
                      onChange={(e) => {
                        const updated = [...poItems];
                        updated[i].rate = parseFloat(e.target.value) || 0;
                        setPoItems(updated);
                      }}
                      required
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm mt-2"
                  onClick={() => setPoItems([...poItems, { itemCode: '', itemName: '', qty: 1, rate: 0 }])}
                >
                  + Add Item
                </button>
              </div>
            </div>
            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowPoDrawer(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Generate Purchase Order</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
