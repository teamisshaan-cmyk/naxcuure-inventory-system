'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ItemsPage() {
  const { currentUser, activeRole } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemCode, setSelectedItemCode] = useState<string | null>(null);
  const [itemDetails, setItemDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  
  // Tab control in 360 drawer
  const [activeTab, setActiveTab] = useState<'stock' | 'ledger' | 'procure'>('stock');

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Raw materials');
  const [subcategory, setSubcategory] = useState('');
  const [itemType, setItemType] = useState('CONSUMABLE');
  const [manufacturer, setManufacturer] = useState('');
  const [baseUnit, setBaseUnit] = useState('kg');
  const [standardRate, setStandardRate] = useState('');
  const [minStock, setMinStock] = useState('10');
  const [reorderLevel, setReorderLevel] = useState('20');
  const [reorderQty, setReorderQty] = useState('50');
  const [safetyStock, setSafetyStock] = useState('5');
  const [qualityRequired, setQualityRequired] = useState(true);
  const [batchRequired, setBatchRequired] = useState(true);
  const [duplicateWarning, setDuplicateWarning] = useState<any[]>([]);
  const [error, setError] = useState('');

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchItems();
  }, []);

  // Monitor query params for direct links from global search
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      handleItemClick(code);
    }
  }, [searchParams]);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = async (code: string) => {
    setSelectedItemCode(code);
    setDetailsLoading(true);
    setActiveTab('stock');
    try {
      const res = await fetch(`/api/items?code=${code}`);
      const data = await res.json();
      setItemDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Perform client-side duplication warnings typing item name
  const handleNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (val.trim().length > 2) {
      try {
        const res = await fetch(`/api/items?checkDuplicateName=${encodeURIComponent(val)}`);
        const data = await res.json();
        setDuplicateWarning(data.duplicates || []);
      } catch (err) {
        console.error(err);
      }
    } else {
      setDuplicateWarning([]);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !baseUnit || !standardRate) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          category,
          subcategory,
          itemType,
          manufacturer,
          baseUnit,
          issueUnit: baseUnit,
          purchaseUnit: baseUnit,
          standardRate,
          qualityInspectionRequired: qualityRequired,
          batchTrackingRequired: batchRequired,
          minStock,
          reorderLevel,
          reorderQty,
          safetyStock
        })
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setShowAddDrawer(false);
        // Reset form
        setName('');
        setDescription('');
        setManufacturer('');
        setStandardRate('');
        fetchItems();
      }
    } catch (err) {
      setError('Failed to create new item master record.');
    }
  };

  const isInventoryHead = activeRole === 'INVENTORY_HEAD' || activeRole === 'DIRECTOR';
  const isDH = activeRole === 'DH' || isInventoryHead;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading Item Master...</div>;
  }

  return (
    <div>
      <div className="flex-space mb-4">
        <div>
          <h2>Item Master Registry</h2>
          <p className="text-muted">Pharmaceutical Raw Materials, Spares, Consumables & Assets list</p>
        </div>
        {isDH && (
          <button className="btn btn-primary" onClick={() => setShowAddDrawer(true)}>
            {isInventoryHead ? 'Add New Master Item' : 'Request New Item Addition'}
          </button>
        )}
      </div>

      <div className="table-container">
        <div className="table-header-bar">
          <h3>Registered Item List</h3>
        </div>
        <div className="nax-table-wrapper">
          <table className="nax-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Base Unit</th>
                <th>Standard Rate</th>
                <th>Min Stock</th>
                <th>Reorder Lvl</th>
                <th>Quality Required</th>
                <th>Tracking</th>
              </tr>
            </thead>
            <tbody>
              {items.map((itm) => (
                <tr
                  key={itm.itemCode}
                  onClick={() => handleItemClick(itm.itemCode)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="text-bold" style={{ color: 'var(--primary-blue)' }}>{itm.itemCode}</td>
                  <td className="text-bold">{itm.name}</td>
                  <td>{itm.category}</td>
                  <td>{itm.baseUnit}</td>
                  <td className="text-bold">${itm.standardRate.toFixed(2)}</td>
                  <td>{itm.minStock}</td>
                  <td>{itm.reorderLevel}</td>
                  <td>
                    <span className={`status-badge ${itm.qualityInspectionRequired ? 'under_maintenance' : 'hold'}`}>
                      {itm.qualityInspectionRequired ? 'Yes (Quarantine)' : 'No'}
                    </span>
                  </td>
                  <td>
                    {itm.batchTrackingRequired && <span className="status-badge approved" style={{ margin: '2px', fontSize: '0.6rem' }}>BATCH</span>}
                    {itm.serialTrackingRequired && <span className="status-badge approved" style={{ margin: '2px', fontSize: '0.6rem' }}>SERIAL</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 360 DEGREE ITEM DRAWER VIEW */}
      {selectedItemCode && itemDetails && (
        <div className="drawer-backdrop" onClick={() => setSelectedItemCode(null)}>
          <div className="drawer-content" style={{ width: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className="status-badge under_review">{itemDetails.item.itemCode}</span>
                <h3 style={{ marginTop: '6px' }}>{itemDetails.item.name}</h3>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>Category: {itemDetails.item.category}</p>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ minWidth: '40px' }} onClick={() => setSelectedItemCode(null)}>
                X
              </button>
            </div>

            <div className="drawer-body">
              {/* Drawer Tabs */}
              <div className="nax-tabs">
                <div className={`nax-tab ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>
                  Stock Balances
                </div>
                <div className={`nax-tab ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>
                  Stock Ledger (Immutable Logs)
                </div>
                <div className={`nax-tab ${activeTab === 'procure' ? 'active' : ''}`} onClick={() => setActiveTab('procure')}>
                  Procurement History
                </div>
              </div>

              {detailsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading 360 metadata...</div>
              ) : (
                <div>
                  {/* TAB 1: Stock levels */}
                  {activeTab === 'stock' && (
                    <div>
                      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                        <div className="summary-card" style={{ borderLeftColor: 'var(--primary-blue)' }}>
                          <span className="summary-title">Usable Available Stock</span>
                          <span className="summary-value">
                            {itemDetails.stock.reduce((sum: number, b: any) => sum + b.availableQty, 0)} {itemDetails.item.baseUnit}
                          </span>
                        </div>
                        <div className="summary-card orange" style={{ borderLeftColor: 'var(--primary-orange)' }}>
                          <span className="summary-title">Active Reservations</span>
                          <span className="summary-value">
                            {itemDetails.reservations} {itemDetails.item.baseUnit}
                          </span>
                        </div>
                      </div>

                      <h4 style={{ marginBottom: '10px' }}>Warehouse Locations & Batch Details</h4>
                      <table className="nax-table" style={{ fontSize: '0.8rem' }}>
                        <thead>
                          <tr>
                            <th>Warehouse</th>
                            <th>Location</th>
                            <th>Batch No.</th>
                            <th>Physical Qty</th>
                            <th>Quarantine Qty</th>
                            <th>Usable Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemDetails.stock.map((stk: any, i: number) => (
                            <tr key={i}>
                              <td className="text-bold">{stk.warehouse}</td>
                              <td>{stk.location}</td>
                              <td>{stk.batchNumber}</td>
                              <td className="text-bold">{stk.physicalQty}</td>
                              <td style={{ color: 'var(--status-rejected-text)' }}>{stk.quarantineQty}</td>
                              <td className="text-bold" style={{ color: 'var(--status-approved-text)' }}>{stk.availableQty}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* TAB 2: Immutable Stock Ledger */}
                  {activeTab === 'ledger' && (
                    <div>
                      <h4 style={{ marginBottom: '10px' }}>Immutable Inventory Ledger Trail</h4>
                      <table className="nax-table" style={{ fontSize: '0.75rem' }}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Ref Code</th>
                            <th>Type</th>
                            <th>In (+)</th>
                            <th>Out (-)</th>
                            <th>Running Balance</th>
                            <th>Performed By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemDetails.ledger.map((ld: any) => (
                            <tr key={ld.id}>
                              <td>{new Date(ld.dateTime).toLocaleString()}</td>
                              <td className="text-bold">{ld.referenceCode}</td>
                              <td>
                                <span className={`status-badge ${['ISSUE', 'ADJUST_DEC'].includes(ld.transactionType) ? 'rejected' : 'approved'}`} style={{ fontSize: '0.6rem' }}>
                                  {ld.transactionType}
                                </span>
                              </td>
                              <td style={{ color: 'var(--status-approved-text)', fontWeight: 'bold' }}>{ld.qtyIn > 0 ? `+${ld.qtyIn}` : '-'}</td>
                              <td style={{ color: 'var(--status-rejected-text)', fontWeight: 'bold' }}>{ld.qtyOut > 0 ? `-${ld.qtyOut}` : '-'}</td>
                              <td className="text-bold">{ld.runningBalance}</td>
                              <td>{ld.performedBy}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* TAB 3: Procurement POs */}
                  {activeTab === 'procure' && (
                    <div>
                      <h4 style={{ marginBottom: '10px' }}>Open Purchase Orders (Awaiting Delivery)</h4>
                      {itemDetails.openPOs.length === 0 ? (
                        <div className="p-4 text-center text-muted">No pending purchase order for this item.</div>
                      ) : (
                        <table className="nax-table" style={{ fontSize: '0.8rem' }}>
                          <thead>
                            <tr>
                              <th>PO Code</th>
                              <th>Vendor Name</th>
                              <th>Payment Terms</th>
                              <th>Total Amount</th>
                              <th>Delivery Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {itemDetails.openPOs.map((po: any) => (
                              <tr key={po.id}>
                                <td className="text-bold" style={{ color: 'var(--primary-blue)' }}>{po.poCode}</td>
                                <td>{po.vendorName}</td>
                                <td>{po.paymentTerms}</td>
                                <td className="text-bold">${po.totalAmount.toLocaleString()}</td>
                                <td>{new Date(po.deliveryDate).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE ITEM DRAWER MODAL */}
      {showAddDrawer && (
        <div className="drawer-backdrop" onClick={() => setShowAddDrawer(false)}>
          <div className="drawer-content" style={{ width: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>{isInventoryHead ? 'Create Master Item Record' : 'Submit Item Addition Request'}</h3>
              <button className="btn btn-secondary btn-sm" style={{ minWidth: '40px' }} onClick={() => setShowAddDrawer(false)}>
                X
              </button>
            </div>

            <form onSubmit={handleAddItem} className="drawer-body">
              {error && (
                <div className="nax-warning-box">
                  <div className="nax-warning-title">Submission Error</div>
                  <div>{error}</div>
                </div>
              )}

              {/* DUPLICATE WARNING BOX */}
              {duplicateWarning.length > 0 && (
                <div className="nax-warning-box">
                  <div>
                    <div className="nax-warning-title">⚠️ Duplicate Check Warning</div>
                    <p>Similar item names already exist in the master registry. Please verify:</p>
                    <ul style={{ marginLeft: '16px', marginTop: '6px' }}>
                      {duplicateWarning.map((d, i) => (
                        <li key={i} className="text-bold">
                          {d.itemCode}: {d.name} ({d.category})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="form-group mb-4">
                <label>Item Display Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Sodium Bicarbonate (Pharma Grade)"
                  value={name}
                  onChange={handleNameChange}
                  required
                />
              </div>

              <div className="form-group mb-4">
                <label>Detailed Technical Specifications / Description</label>
                <textarea
                  className="form-control"
                  style={{ height: '60px', resize: 'vertical' }}
                  placeholder="e.g. Assay 99.5%, Loss on drying < 0.25%, Manufacturer specifications..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-grid mb-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="form-group">
                  <label>Item Classification Category</label>
                  <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Raw materials">Raw materials</option>
                    <option value="Printed packing materials">Printed packing materials</option>
                    <option value="Engineering spares">Engineering spares</option>
                    <option value="Lubricants">Lubricants</option>
                    <option value="PPE">PPE</option>
                    <option value="Cleaning materials">Cleaning materials</option>
                    <option value="Consumables">Consumables</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Base Measurement Unit</label>
                  <select className="form-control" value={baseUnit} onChange={(e) => setBaseUnit(e.target.value)}>
                    <option value="kg">kilograms (kg)</option>
                    <option value="pcs">pieces (pcs)</option>
                    <option value="Litres">Litres (L)</option>
                    <option value="m">meters (m)</option>
                    <option value="g">grams (g)</option>
                  </select>
                </div>
              </div>

              <div className="form-grid mb-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Standard Rate ($) *</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="12.50"
                    value={standardRate}
                    onChange={(e) => setStandardRate(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Min Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Reorder Level</label>
                  <input
                    type="number"
                    className="form-control"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid mb-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="form-group">
                  <label>Reorder Qty</label>
                  <input
                    type="number"
                    className="form-control"
                    value={reorderQty}
                    onChange={(e) => setReorderQty(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Safety Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    value={safetyStock}
                    onChange={(e) => setSafetyStock(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 0' }}>
                <label className="flex-row">
                  <input
                    type="checkbox"
                    checked={qualityRequired}
                    onChange={(e) => setQualityRequired(e.target.checked)}
                  />
                  <span>Quality inspection required on Goods Receipt (Quarantine block)</span>
                </label>

                <label className="flex-row">
                  <input
                    type="checkbox"
                    checked={batchRequired}
                    onChange={(e) => setBatchRequired(e.target.checked)}
                  />
                  <span>Enforce batch tracking number requirements</span>
                </label>
              </div>

              <div className="drawer-footer" style={{ margin: '20px -24px -24px -24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddDrawer(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isInventoryHead ? 'Save to Master' : 'Submit Suggestion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
