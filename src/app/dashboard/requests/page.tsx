'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RequestsPage() {
  const { currentUser, activeRole } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [requests, setRequests] = useState<any[]>([]);
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  
  // Discussion / Comment drawer states
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentsList, setCommentsList] = useState<any[]>([]);

  // Create Request form states
  const [priority, setPriority] = useState('NORMAL');
  const [requiredByDate, setRequiredByDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [machineCode, setMachineCode] = useState('');
  const [workOrderRef, setWorkOrderRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [requestItems, setRequestItems] = useState<any[]>([
    { itemCode: '', requiredQty: 1, estimatedRate: 0, urgentJustification: '' }
  ]);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    fetchRequests();
    fetchItemsList();
  }, []);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      handleRequestClick(code);
    }
  }, [searchParams]);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemsList = async () => {
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      setItemsList(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestClick = async (code: string) => {
    setSelectedCode(code);
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/requests?code=${code}`);
      const data = await res.json();
      setRequestDetails(data);
      setCommentsList(data.comments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleItemSelect = (index: number, code: string) => {
    const matched = itemsList.find((i) => i.itemCode === code);
    const updated = [...requestItems];
    updated[index] = {
      ...updated[index],
      itemCode: code,
      itemName: matched?.name || '',
      estimatedRate: matched?.standardRate || 0
    };
    setRequestItems(updated);
    runQuantityWarnings(updated);
  };

  const handleQtyChange = (index: number, qtyStr: string) => {
    const updated = [...requestItems];
    const qty = parseFloat(qtyStr) || 0;
    updated[index].requiredQty = qty;
    setRequestItems(updated);
    runQuantityWarnings(updated);
  };

  // Warning trigger if quantity exceeds standard historical consumption levels
  const runQuantityWarnings = (items: any[]) => {
    const activeWarnings: string[] = [];
    items.forEach((itm) => {
      if (itm.itemCode) {
        // Warning: standard historical limit is 50 units for demo purposes
        if (itm.requiredQty > 50) {
          activeWarnings.push(`⚠️ WARNING: Requested quantity for ${itm.itemName || itm.itemCode} (${itm.requiredQty}) exceeds average 30-day historical consumption.`);
        }
      }
    });
    setWarnings(activeWarnings);
  };

  const addFormItemRow = () => {
    setRequestItems([...requestItems, { itemCode: '', requiredQty: 1, estimatedRate: 0, urgentJustification: '' }]);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const invalid = requestItems.some(i => !i.itemCode || i.requiredQty <= 0);
    if (invalid) {
      setError('Please select items and verify quantities.');
      return;
    }

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plant: currentUser?.plant || 'Plant 1',
          departmentCode: currentUser?.departmentCode || 'NAX-DEP-PROD',
          requesterId: currentUser?.employeeCode,
          requesterName: currentUser?.fullName,
          priority,
          requiredByDate,
          purpose,
          machineCode,
          workOrderReference: workOrderRef,
          remarks,
          items: requestItems
        })
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setShowAddDrawer(false);
        // Reset form
        setPriority('NORMAL');
        setPurpose('');
        setMachineCode('');
        setWorkOrderRef('');
        setRemarks('');
        setRequestItems([{ itemCode: '', requiredQty: 1, estimatedRate: 0, urgentJustification: '' }]);
        fetchRequests();
      }
    } catch (err) {
      setError('Failed to submit material request.');
    }
  };

  const handleDHApproval = async (statusAction: 'DH_APPROVE' | 'DH_REJECT') => {
    if (!requestDetails) return;
    try {
      const res = await fetch('/api/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestCode: requestDetails.request.requestCode,
          action: statusAction,
          employeeCode: currentUser?.employeeCode,
          userName: currentUser?.fullName,
          activeRole,
          comment: `Approval decision logged by DH ${currentUser?.fullName}.`
        })
      });

      const data = await res.json();
      if (data.success) {
        handleRequestClick(requestDetails.request.requestCode);
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleIVIssue = async (statusAction: 'IV_ISSUE' | 'SEND_TO_PURCHASE') => {
    if (!requestDetails) return;
    try {
      const res = await fetch('/api/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestCode: requestDetails.request.requestCode,
          action: statusAction,
          employeeCode: currentUser?.employeeCode,
          userName: currentUser?.fullName,
          activeRole,
          comment: statusAction === 'IV_ISSUE' ? 'Stock issue completed from Central Stores.' : 'Sent to procurement.'
        })
      });

      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        handleRequestClick(requestDetails.request.requestCode);
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedCode) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordType: 'MR',
          recordCode: selectedCode,
          userName: currentUser?.fullName,
          employeeCode: currentUser?.employeeCode,
          role: activeRole,
          content: newComment
        })
      });

      const data = await res.json();
      if (data.success) {
        setCommentsList([...commentsList, data.comment]);
        setNewComment('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Permissions checkers
  const isDH = activeRole === 'DH' || activeRole === 'DIRECTOR';
  const isInventory = ['INVENTORY_HEAD', 'INVENTORY_EXEC'].includes(activeRole) || activeRole === 'DIRECTOR';

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading Requests...</div>;
  }

  return (
    <div>
      <div className="flex-space mb-4">
        <div>
          <h2>Material Request Center</h2>
          <p className="text-muted">Raise requests, track status timeline, and manage approvals.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddDrawer(true)}>
          Raise New Request
        </button>
      </div>

      <div className="table-container">
        <div className="table-header-bar">
          <h3>Requests Timeline Queue</h3>
        </div>
        <div className="nax-table-wrapper">
          <table className="nax-table">
            <thead>
              <tr>
                <th>Request Code</th>
                <th>Request Date</th>
                <th>Department</th>
                <th>Requester</th>
                <th>Priority</th>
                <th>Required By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.requestCode}>
                  <td className="text-bold" style={{ color: 'var(--primary-blue)' }}>{req.requestCode}</td>
                  <td>{new Date(req.requestDate).toLocaleString()}</td>
                  <td>{req.departmentCode.replace('NAX-DEP-', '')}</td>
                  <td>{req.requesterName}</td>
                  <td>
                    <span className={`status-badge ${req.priority === 'CRITICAL' || req.priority === 'URGENT' ? 'critical' : 'under_review'}`}>
                      {req.priority}
                    </span>
                  </td>
                  <td>{new Date(req.requiredByDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${req.status.toLowerCase()}`}>
                      {req.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleRequestClick(req.requestCode)}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL DRAWER */}
      {selectedCode && requestDetails && (
        <div className="drawer-backdrop" onClick={() => setSelectedCode(null)}>
          <div className="drawer-content" style={{ width: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className={`status-badge ${requestDetails.request.status.toLowerCase()}`}>
                  {requestDetails.request.status}
                </span>
                <h3 style={{ marginTop: '6px' }}>{requestDetails.request.requestCode}</h3>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                  Requester: {requestDetails.request.requesterName} ({requestDetails.request.departmentCode})
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ minWidth: '40px' }} onClick={() => setSelectedCode(null)}>
                X
              </button>
            </div>

            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ marginBottom: '8px' }}>Request Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                  <div><strong>Purpose:</strong> {requestDetails.request.purpose}</div>
                  <div><strong>Required Date:</strong> {new Date(requestDetails.request.requiredByDate).toLocaleDateString()}</div>
                  {requestDetails.request.machineCode && <div><strong>Machine Compatibility:</strong> {requestDetails.request.machineCode}</div>}
                  {requestDetails.request.workOrderReference && <div><strong>Linked Work Order:</strong> {requestDetails.request.workOrderReference}</div>}
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: '8px' }}>Requested Items List</h4>
                <table className="nax-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Item Code</th>
                      <th>Item Name</th>
                      <th>Qty Requested</th>
                      <th>Qty Issued</th>
                      <th>Est Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestDetails.items.map((itm: any) => (
                      <tr key={itm.id}>
                        <td className="text-bold">{itm.itemCode}</td>
                        <td>{itm.itemName}</td>
                        <td className="text-bold">{itm.requiredQty}</td>
                        <td>{itm.issuedQty}</td>
                        <td className="text-bold">${itm.estimatedValue.toFixed(2)}</td>
                        <td>
                          <span className={`status-badge ${itm.status.toLowerCase()}`}>
                            {itm.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* APPROVAL ACTION DECISION BOARD */}
              
              {/* DH Action */}
              {isDH && requestDetails.request.status === 'PENDING_DH' && (
                <div style={{ backgroundColor: 'var(--light-orange)', padding: '16px', borderRadius: 'var(--border-radius)', border: '1px solid var(--primary-orange)' }}>
                  <h4 style={{ color: 'var(--dark-orange)', marginBottom: '8px' }}>DH Approval Actions</h4>
                  <p style={{ fontSize: '0.8rem', marginBottom: '12px' }}>Review the requested quantities and verify department consumption before decision.</p>
                  <div className="flex-row">
                    <button className="btn btn-primary" onClick={() => handleDHApproval('DH_APPROVE')}>
                      Approve Request
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDHApproval('DH_REJECT')}>
                      Reject Request
                    </button>
                  </div>
                </div>
              )}

              {/* Inventory Stores Action */}
              {isInventory && requestDetails.request.status === 'PENDING_IV' && (
                <div style={{ backgroundColor: 'var(--light-blue)', padding: '16px', borderRadius: 'var(--border-radius)', border: '1px solid var(--primary-blue)' }}>
                  <h4 style={{ color: 'var(--primary-blue)', marginBottom: '8px' }}>Inventory Issue Verification</h4>
                  <p style={{ fontSize: '0.8rem', marginBottom: '12px' }}>
                    Confirm physical stock levels before issuing. If stockout, select "Procure".
                  </p>
                  <div className="flex-row">
                    <button className="btn btn-blue" onClick={() => handleIVIssue('IV_ISSUE')}>
                      Issue From Stock
                    </button>
                    <button className="btn btn-primary" onClick={() => handleIVIssue('SEND_TO_PURCHASE')}>
                      Stockout: Procure Spares
                    </button>
                  </div>
                </div>
              )}

              {/* Discussion Chat Thread */}
              <div>
                <div className="flex-space" style={{ borderBottom: '1px solid var(--border-grey)', paddingBottom: '6px', marginBottom: '12px' }}>
                  <h4>Audit Discussion & Comments</h4>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>{commentsList.length} comments</span>
                </div>
                
                <div className="comments-thread">
                  {commentsList.map((c, i) => (
                    <div key={i} className="comment-bubble">
                      <div className="comment-meta">
                        <span>{c.userName} <span className="comment-meta-role">({c.role})</span></span>
                        <span>{new Date(c.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="comment-body">{c.content}</div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ask for clarification or log note..."
                    style={{ flexGrow: 1 }}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button type="submit" className="btn btn-secondary">
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE REQUEST DRAWER */}
      {showAddDrawer && (
        <div className="drawer-backdrop" onClick={() => setShowAddDrawer(false)}>
          <div className="drawer-content" style={{ width: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Create Material Request</h3>
              <button className="btn btn-secondary btn-sm" style={{ minWidth: '40px' }} onClick={() => setShowAddDrawer(false)}>
                X
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="drawer-body">
              {error && (
                <div className="nax-warning-box">
                  <div className="nax-warning-title">Submission Error</div>
                  <div>{error}</div>
                </div>
              )}

              {/* DYNAMIC CONSUMPTION WARNING ALERTS */}
              {warnings.map((w, idx) => (
                <div className="nax-warning-box" key={idx} style={{ backgroundColor: 'var(--light-orange)', borderLeftColor: 'var(--primary-orange)' }}>
                  <div>{w}</div>
                </div>
              ))}

              <div className="form-grid mb-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="form-group">
                  <label>Request Priority</label>
                  <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (DH confirmation required)</option>
                    <option value="CRITICAL">Critical Breakdown (Immediate)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Required By Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={requiredByDate}
                    onChange={(e) => setRequiredByDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group mb-4">
                <label>Purpose / Material Justification *</label>
                <textarea
                  className="form-control"
                  style={{ height: '50px', resize: 'vertical' }}
                  placeholder="e.g. Weekly tablet compression batch run, preventive maintenance scheduling spares..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid mb-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="form-group">
                  <label>Asset Machine Code Compatibility</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. NAX-MCH-00001"
                    value={machineCode}
                    onChange={(e) => setMachineCode(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Linked Maintenance Work Order Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. NAX-WO-2026-00001"
                    value={workOrderRef}
                    onChange={(e) => setWorkOrderRef(e.target.value)}
                  />
                </div>
              </div>

              {/* MULTI ITEM SELECTION TABLE */}
              <div style={{ border: '1px solid var(--border-grey)', borderRadius: 'var(--border-radius)', padding: '14px', marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '10px' }}>Requested Items List</h4>
                
                {requestItems.map((itm, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '10px' }}>
                    <div className="form-group" style={{ flexGrow: 1 }}>
                      <label style={{ fontSize: '0.7rem' }}>Select Item *</label>
                      <select
                        className="form-control"
                        value={itm.itemCode}
                        onChange={(e) => handleItemSelect(idx, e.target.value)}
                      >
                        <option value="">-- Choose Item --</option>
                        {itemsList.map((i) => (
                          <option key={i.itemCode} value={i.itemCode}>
                            {i.itemCode}: {i.name} (${i.standardRate}/{i.baseUnit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ width: '80px' }}>
                      <label style={{ fontSize: '0.7rem' }}>Qty *</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={itm.requiredQty}
                        onChange={(e) => handleQtyChange(idx, e.target.value)}
                      />
                    </div>

                    {priority === 'CRITICAL' || priority === 'URGENT' ? (
                      <div className="form-group" style={{ flexGrow: 1 }}>
                        <label style={{ fontSize: '0.7rem' }}>Justification *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Why is this urgent?"
                          value={itm.urgentJustification}
                          onChange={(e) => {
                            const updated = [...requestItems];
                            updated[idx].urgentJustification = e.target.value;
                            setRequestItems(updated);
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                ))}

                <button type="button" className="btn btn-secondary btn-sm mt-4" onClick={addFormItemRow}>
                  + Add Row Item
                </button>
              </div>

              <div className="form-group mb-4">
                <label>Opening remarks / Attachments reference</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Certifications, special shipping instructions"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div className="drawer-footer" style={{ margin: '20px -24px -24px -24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddDrawer(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
