'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function InventoryPage() {
  const { currentUser, activeRole } = useApp();
  const [balances, setBalances] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stock Adjustment form
  const [showAdjDrawer, setShowAdjDrawer] = useState(false);
  const [adjItemCode, setAdjItemCode] = useState('');
  const [adjWarehouse, setAdjWarehouse] = useState('MAIN');
  const [adjLocation, setAdjLocation] = useState('GEN-LOC');
  const [adjBatch, setAdjBatch] = useState('BAT-PAR-2601');
  const [adjQty, setAdjQty] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [adjError, setAdjError] = useState('');

  // Stock Transfer form
  const [showTrsfDrawer, setShowTrsfDrawer] = useState(false);
  const [trsfItemCode, setTrsfItemCode] = useState('');
  const [trsfSource, setTrsfSource] = useState('MAIN');
  const [trsfDest, setTrsfDest] = useState('STORE-B');
  const [trsfBatch, setTrsfBatch] = useState('BAT-PAR-2601');
  const [trsfQty, setTrsfQty] = useState('');
  const [trsfComments, setTrsfComments] = useState('');
  const [trsfError, setTrsfError] = useState('');

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setBalances(data.balances || []);
      setLedger(data.ledger || []);
      setTransfers(data.transfers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjError('');

    if (!adjItemCode || !adjQty || !adjReason) {
      setAdjError('Please fill in Item Code, Quantity difference, and justification reason.');
      return;
    }

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADJUST_STOCK',
          itemCode: adjItemCode,
          warehouse: adjWarehouse,
          location: adjLocation,
          batchNumber: adjBatch,
          qtyDifference: adjQty,
          reason: adjReason,
          employeeCode: currentUser?.employeeCode,
          userName: currentUser?.fullName,
          activeRole
        })
      });

      const data = await res.json();
      if (data.error) {
        setAdjError(data.error);
      } else {
        setShowAdjDrawer(false);
        setAdjItemCode('');
        setAdjQty('');
        setAdjReason('');
        fetchInventoryData();
      }
    } catch (err) {
      setAdjError('Failed to record stock adjustment.');
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrsfError('');

    if (!trsfItemCode || !trsfQty) {
      setTrsfError('Please fill in Item Code and transfer quantity.');
      return;
    }

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TRANSFER_STOCK',
          sourceWarehouse: trsfSource,
          destWarehouse: trsfDest,
          itemCode: trsfItemCode,
          qty: trsfQty,
          batchNumber: trsfBatch,
          comments: trsfComments,
          employeeCode: currentUser?.employeeCode,
          userName: currentUser?.fullName,
          activeRole
        })
      });

      const data = await res.json();
      if (data.error) {
        setTrsfError(data.error);
      } else {
        setShowTrsfDrawer(false);
        setTrsfItemCode('');
        setTrsfQty('');
        setTrsfComments('');
        fetchInventoryData();
      }
    } catch (err) {
      setTrsfError('Failed to record stock transfer dispatch.');
    }
  };

  const handleReceiveTransfer = async (transferCode: string) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECEIVE_TRANSFER',
          transferCode,
          receiptComments: 'Received physically and verified.',
          employeeCode: currentUser?.employeeCode,
          userName: currentUser?.fullName,
          activeRole
        })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        fetchInventoryData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isStore = ['INVENTORY_HEAD', 'INVENTORY_EXEC'].includes(activeRole) || activeRole === 'DIRECTOR';

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading Central Stores...</div>;
  }

  return (
    <div>
      <div className="flex-space mb-4">
        <div>
          <h2>Central Stores & Warehouse Ledger</h2>
          <p className="text-muted">Monitor physical balances, verify stock counts, and dispatch transfers between storage units.</p>
        </div>
        {isStore && (
          <div className="flex-row">
            <button className="btn btn-secondary" onClick={() => setShowAdjDrawer(true)}>
              Physical Count Adjustment
            </button>
            <button className="btn btn-primary" onClick={() => setShowTrsfDrawer(true)}>
              Warehouse Stock Transfer
            </button>
          </div>
        )}
      </div>

      {/* Stock Balances Summary */}
      <div className="table-container">
        <div className="table-header-bar">
          <h3>Central Stock Balances</h3>
        </div>
        <div className="nax-table-wrapper">
          <table className="nax-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Warehouse</th>
                <th>Storage Location</th>
                <th>Batch Number</th>
                <th>Physical Balance</th>
                <th>Active Reservations</th>
                <th>QA Quarantine Qty</th>
                <th>Damaged/Scrap Qty</th>
                <th>Available Usable Stock</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((b) => (
                <tr key={b.id}>
                  <td className="text-bold" style={{ color: 'var(--primary-blue)' }}>{b.itemCode}</td>
                  <td>{b.warehouse}</td>
                  <td>{b.location}</td>
                  <td>{b.batchNumber}</td>
                  <td className="text-bold">{b.physicalQty}</td>
                  <td>{b.reservedQty}</td>
                  <td style={{ color: 'var(--status-rejected-text)' }}>{b.quarantineQty}</td>
                  <td style={{ color: 'var(--status-rejected-text)' }}>{b.damagedQty}</td>
                  <td className="text-bold" style={{ color: 'var(--status-approved-text)' }}>
                    {b.availableQty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Ledger */}
        <div className="table-container">
          <div className="table-header-bar">
            <h3>Immutable Stock Ledger Timeline</h3>
          </div>
          <div className="nax-table-wrapper" style={{ maxHeight: '300px' }}>
            <table className="nax-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Item Code</th>
                  <th>Transaction</th>
                  <th>Qty In (+)</th>
                  <th>Qty Out (-)</th>
                  <th>Running Bal</th>
                  <th>Role Used</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((l) => (
                  <tr key={l.id}>
                    <td>{new Date(l.dateTime).toLocaleString()}</td>
                    <td className="text-bold">{l.itemCode}</td>
                    <td><span className="status-badge running" style={{ fontSize: '0.65rem' }}>{l.transactionType}</span></td>
                    <td style={{ color: 'var(--status-approved-text)', fontWeight: 'bold' }}>{l.qtyIn > 0 ? `+${l.qtyIn}` : '-'}</td>
                    <td style={{ color: 'var(--status-rejected-text)', fontWeight: 'bold' }}>{l.qtyOut > 0 ? `-${l.qtyOut}` : '-'}</td>
                    <td className="text-bold">{l.runningBalance}</td>
                    <td>{l.activeRole}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transfers in-transit */}
        <div className="table-container">
          <div className="table-header-bar">
            <h3>Active Warehouse Transfers</h3>
          </div>
          <div className="nax-table-wrapper" style={{ maxHeight: '300px' }}>
            <table className="nax-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Transfer Code</th>
                  <th>Source</th>
                  <th>Dest</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>State</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.transferCode}>
                    <td className="text-bold">{t.transferCode}</td>
                    <td>{t.sourceWarehouse}</td>
                    <td>{t.destWarehouse}</td>
                    <td>{t.itemCode}</td>
                    <td className="text-bold">{t.qty}</td>
                    <td>
                      <span className={`status-badge ${t.status === 'COMPLETED' ? 'approved' : 'pending'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      {isStore && t.status === 'IN_TRANSIT' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleReceiveTransfer(t.transferCode)}
                        >
                          Confirm Receipt
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

      {/* ADJUSTMENT DRAWER */}
      {showAdjDrawer && (
        <div className="drawer-backdrop" onClick={() => setShowAdjDrawer(false)}>
          <form onSubmit={handleCreateAdjustment} className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Record Stock Count Difference</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAdjDrawer(false)}>X</button>
            </div>
            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {adjError && (
                <div className="nax-warning-box">
                  <div className="nax-warning-title">Adjustment Error</div>
                  <div>{adjError}</div>
                </div>
              )}

              <div className="form-group">
                <label>Select Item Code *</label>
                <select className="form-control" value={adjItemCode} onChange={(e) => setAdjItemCode(e.target.value)} required>
                  <option value="">-- Choose Item --</option>
                  <option value="NAX-ITM-00001">NAX-ITM-00001: Paracetamol API</option>
                  <option value="NAX-ITM-00002">NAX-ITM-00002: Duplex Carton Box</option>
                  <option value="NAX-ITM-00003">NAX-ITM-00003: Ball Bearing 6204</option>
                  <option value="NAX-ITM-00004">NAX-ITM-00004: Gear Lube Oil</option>
                </select>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Warehouse</label>
                  <input type="text" className="form-control" value={adjWarehouse} onChange={(e) => setAdjWarehouse(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Storage Location</label>
                  <input type="text" className="form-control" value={adjLocation} onChange={(e) => setAdjLocation(e.target.value)} />
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Batch Number</label>
                  <input type="text" className="form-control" value={adjBatch} onChange={(e) => setAdjBatch(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Quantity Difference (+ or -) *</label>
                  <input type="number" className="form-control" placeholder="e.g. -5 or 12" value={adjQty} onChange={(e) => setAdjQty(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label>Justification Reason for Stock Discrepancy *</label>
                <input type="text" className="form-control" placeholder="e.g. Evaporation loss, counting recount difference..." value={adjReason} onChange={(e) => setAdjReason(e.target.value)} required />
              </div>
            </div>
            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAdjDrawer(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Book Stock Adjustments</button>
            </div>
          </form>
        </div>
      )}

      {/* TRANSFER DRAWER */}
      {showTrsfDrawer && (
        <div className="drawer-backdrop" onClick={() => setShowTrsfDrawer(false)}>
          <form onSubmit={handleCreateTransfer} className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Dispatch Warehouse Stock Transfer</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowTrsfDrawer(false)}>X</button>
            </div>
            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {trsfError && (
                <div className="nax-warning-box">
                  <div className="nax-warning-title">Transfer Error</div>
                  <div>{trsfError}</div>
                </div>
              )}

              <div className="form-group">
                <label>Select Item Code *</label>
                <select className="form-control" value={trsfItemCode} onChange={(e) => setTrsfItemCode(e.target.value)} required>
                  <option value="">-- Choose Item --</option>
                  <option value="NAX-ITM-00001">NAX-ITM-00001: Paracetamol API</option>
                  <option value="NAX-ITM-00002">NAX-ITM-00002: Duplex Carton Box</option>
                  <option value="NAX-ITM-00003">NAX-ITM-00003: Ball Bearing 6204</option>
                </select>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Source Warehouse</label>
                  <input type="text" className="form-control" value={trsfSource} onChange={(e) => setTrsfSource(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Destination Warehouse</label>
                  <input type="text" className="form-control" value={trsfDest} onChange={(e) => setTrsfDest(e.target.value)} />
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Batch Number</label>
                  <input type="text" className="form-control" value={trsfBatch} onChange={(e) => setTrsfBatch(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Transfer Quantity *</label>
                  <input type="number" className="form-control" value={trsfQty} onChange={(e) => setTrsfQty(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label>Transfer Comments / Waybill</label>
                <input type="text" className="form-control" placeholder="e.g. Sending spares to Packing Area for blister packing machine PM" value={trsfComments} onChange={(e) => setTrsfComments(e.target.value)} />
              </div>
            </div>
            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowTrsfDrawer(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Dispatch Stock Transfer</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
