'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter, useSearchParams } from 'next/navigation';

export default function MaintenancePage() {
  const { currentUser, activeRole } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [machines, setMachines] = useState<any[]>([]);
  const [breakdowns, setBreakdowns] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [pmSchedules, setPmSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active drawer selections
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [selectedBreakdown, setSelectedBreakdown] = useState<any>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);

  // Form states
  const [showBdDrawer, setShowBdDrawer] = useState(false);
  const [bdMachineCode, setBdMachineCode] = useState('');
  const [bdCategory, setBdCategory] = useState('MECHANICAL');
  const [bdDesc, setBdDesc] = useState('');
  const [bdPriority, setBdPriority] = useState('NORMAL');
  const [bdError, setBdError] = useState('');

  // Technician Update Form
  const [techDiagnosis, setTechDiagnosis] = useState('');
  const [techWorkPerformed, setTechWorkPerformed] = useState('');
  const [techRootCause, setTechRootCause] = useState('');
  const [techCorrective, setTechCorrective] = useState('');
  const [techLaborHours, setTechLaborHours] = useState('2.5');
  const [techSparesCost, setTechSparesCost] = useState('0');

  // DH Verification Form
  const [trialResult, setTrialResult] = useState('SUCCESS');
  const [trialComment, setTrialComment] = useState('Trial run completed under full payload. Lock works fine.');

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  // Monitor URL params for direct link from global search
  useEffect(() => {
    const mchCode = searchParams.get('machineCode');
    const bdCode = searchParams.get('breakdownCode');
    if (mchCode) {
      const match = machines.find(m => m.machineCode === mchCode);
      if (match) setSelectedMachine(match);
    }
    if (bdCode) {
      const match = breakdowns.find(b => b.breakdownCode === bdCode);
      if (match) setSelectedBreakdown(match);
    }
  }, [searchParams, machines, breakdowns]);

  const fetchMaintenanceData = async () => {
    try {
      const res = await fetch('/api/maintenance');
      const data = await res.json();
      setMachines(data.machines || []);
      setBreakdowns(data.breakdowns || []);
      setWorkOrders(data.workOrders || []);
      setPmSchedules(data.pmSchedules || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportBreakdown = async (e: React.FormEvent) => {
    e.preventDefault();
    setBdError('');

    if (!bdMachineCode || !bdDesc) {
      setBdError('Please select a machine and enter description of problem.');
      return;
    }

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REPORT_BREAKDOWN',
          machineCode: bdMachineCode,
          problemCategory: bdCategory,
          problemDescription: bdDesc,
          priority: bdPriority,
          employeeCode: currentUser?.employeeCode,
          userName: currentUser?.fullName,
          activeRole
        })
      });

      const data = await res.json();
      if (data.error) {
        setBdError(data.error);
      } else {
        setShowBdDrawer(false);
        setBdMachineCode('');
        setBdDesc('');
        fetchMaintenanceData();
      }
    } catch (err) {
      setBdError('Failed to log breakdown ticket.');
    }
  };

  const handleCompleteRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkOrder) return;

    try {
      await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COMPLETE_REPAIR',
          workOrderCode: selectedWorkOrder.workOrderCode,
          assignedTechnician: currentUser?.employeeCode,
          diagnosis: techDiagnosis,
          workPerformed: techWorkPerformed,
          rootCause: techRootCause,
          correctiveAction: techCorrective,
          laborHours: techLaborHours,
          vendorCost: 0
        })
      });
      setSelectedWorkOrder(null);
      // Reset tech form
      setTechDiagnosis('');
      setTechWorkPerformed('');
      setTechRootCause('');
      setTechCorrective('');
      fetchMaintenanceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkOrder) return;

    try {
      await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_TRIAL',
          workOrderCode: selectedWorkOrder.workOrderCode,
          trialRunResult: trialResult,
          verificationComment: trialComment,
          employeeCode: currentUser?.employeeCode,
          userName: currentUser?.fullName,
          activeRole
        })
      });
      setSelectedWorkOrder(null);
      fetchMaintenanceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunPM = async (scheduleCode: string) => {
    try {
      await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RUN_PM',
          scheduleCode,
          employeeCode: currentUser?.employeeCode,
          userName: currentUser?.fullName,
          activeRole
        })
      });
      fetchMaintenanceData();
      alert('Preventive Maintenance checklist completed and machine updated.');
    } catch (err) {
      console.error(err);
    }
  };

  const isTech = activeRole === 'MAINTENANCE_TECH' || activeRole === 'DIRECTOR';
  const isDH = activeRole === 'DH' || activeRole === 'DIRECTOR';

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading Maintenance Desk...</div>;
  }

  return (
    <div>
      <div className="flex-space mb-4">
        <div>
          <h2>Engineering Maintenance & Machine Master</h2>
          <p className="text-muted">Report breakdowns, track work orders, and review preventive maintenance schedules.</p>
        </div>
        <div className="flex-row">
          <button className="btn btn-danger" onClick={() => setShowBdDrawer(true)}>
            Log Machine Breakdown
          </button>
        </div>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Machine Master */}
        <div className="table-container">
          <div className="table-header-bar">
            <h3>Machinery Asset Master</h3>
          </div>
          <div className="nax-table-wrapper" style={{ maxHeight: '280px' }}>
            <table className="nax-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Machine Code</th>
                  <th>Machine Name</th>
                  <th>Department</th>
                  <th>Area Location</th>
                  <th>Criticality</th>
                  <th>Current State</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((mch) => (
                  <tr key={mch.machineCode} onClick={() => setSelectedMachine(mch)} style={{ cursor: 'pointer' }}>
                    <td className="text-bold">{mch.machineCode}</td>
                    <td className="text-bold">{mch.name}</td>
                    <td>{mch.departmentCode.replace('NAX-DEP-', '')}</td>
                    <td>{mch.area}</td>
                    <td>
                      <span className={`status-badge ${mch.criticality === 'CRITICAL' ? 'critical' : 'under_review'}`}>
                        {mch.criticality}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${mch.status === 'RUNNING' ? 'approved' : mch.status === 'BREAKDOWN' ? 'rejected' : 'pending'}`}>
                        {mch.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PM compliance schedules */}
        <div className="table-container">
          <div className="table-header-bar">
            <h3>PM compliance Schedules</h3>
          </div>
          <div className="nax-table-wrapper" style={{ maxHeight: '280px' }}>
            <table className="nax-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>PM Code</th>
                  <th>Machine Name</th>
                  <th>Recurrence</th>
                  <th>Next Scheduled Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pmSchedules.map((pm) => (
                  <tr key={pm.scheduleCode}>
                    <td className="text-bold">{pm.scheduleCode}</td>
                    <td>{pm.machineName}</td>
                    <td className="text-bold">{pm.recurrence}</td>
                    <td>{new Date(pm.nextRun).toLocaleDateString()}</td>
                    <td>
                      {isTech && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleRunPM(pm.scheduleCode)}>
                          Run Checklist
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

      {/* WORK ORDER TIMELINE BOARD */}
      <div className="table-container mt-4">
        <div className="table-header-bar">
          <h3>Active Work Orders Board</h3>
        </div>
        <div className="nax-table-wrapper">
          <table className="nax-table">
            <thead>
              <tr>
                <th>Work Order</th>
                <th>Breakdown Ref</th>
                <th>Machine Code</th>
                <th>Planned Target Date</th>
                <th>Spares Cost</th>
                <th>Order Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((wo) => (
                <tr key={wo.workOrderCode}>
                  <td className="text-bold" style={{ color: 'var(--primary-blue)' }}>{wo.workOrderCode}</td>
                  <td>{wo.breakdownCode || 'PM Schedule'}</td>
                  <td>{wo.machineCode}</td>
                  <td>{new Date(wo.targetCompletion).toLocaleDateString()}</td>
                  <td className="text-bold">${wo.spareCost.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${wo.status.toLowerCase()}`}>
                      {wo.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex-row">
                      {isTech && wo.status === 'ASSIGNED' && (
                        <button className="btn btn-primary btn-sm" onClick={() => {
                          setSelectedWorkOrder(wo);
                          setTechLaborHours('3.5');
                        }}>
                          Execute Repair
                        </button>
                      )}
                      {isDH && wo.status === 'TRIAL_RUN' && (
                        <button className="btn btn-danger btn-sm" onClick={() => {
                          setSelectedWorkOrder(wo);
                          setTrialResult('SUCCESS');
                        }}>
                          Verify Trial
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BREAKDOWNS HISTORY TABLE */}
      <div className="table-container mt-4">
        <div className="table-header-bar">
          <h3>Breakdown History Logs</h3>
        </div>
        <div className="nax-table-wrapper" style={{ maxHeight: '250px' }}>
          <table className="nax-table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th>Breakdown Code</th>
                <th>Machine Name</th>
                <th>Failure Category</th>
                <th>Reported At</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {breakdowns.map((bd) => (
                <tr key={bd.breakdownCode} onClick={() => setSelectedBreakdown(bd)} style={{ cursor: 'pointer' }}>
                  <td className="text-bold">{bd.breakdownCode}</td>
                  <td className="text-bold">{bd.machineName}</td>
                  <td>{bd.problemCategory}</td>
                  <td>{new Date(bd.reportedAt).toLocaleString()}</td>
                  <td><span className={`status-badge ${bd.priority === 'CRITICAL' ? 'critical' : 'under_review'}`}>{bd.priority}</span></td>
                  <td><span className={`status-badge ${bd.status.toLowerCase()}`}>{bd.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPORT BREAKDOWN DRAWER */}
      {showBdDrawer && (
        <div className="drawer-backdrop" onClick={() => setShowBdDrawer(false)}>
          <form onSubmit={handleReportBreakdown} className="drawer-content" style={{ width: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Report Machine Failure</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowBdDrawer(false)}>X</button>
            </div>
            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {bdError && (
                <div className="nax-warning-box">
                  <div className="nax-warning-title">Reporting Error</div>
                  <div>{bdError}</div>
                </div>
              )}

              <div className="form-group">
                <label>Select Affected Asset Machinery *</label>
                <select className="form-control" value={bdMachineCode} onChange={(e) => setBdMachineCode(e.target.value)} required>
                  <option value="">-- Choose Machine --</option>
                  {machines.map((m) => (
                    <option key={m.machineCode} value={m.machineCode}>
                      {m.machineCode}: {m.name} ({m.area})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Failure Category</label>
                  <select className="form-control" value={bdCategory} onChange={(e) => setBdCategory(e.target.value)}>
                    <option value="MECHANICAL">Mechanical Failure</option>
                    <option value="ELECTRICAL">Electrical Short</option>
                    <option value="ELECTRONIC">Electronic PLC Error</option>
                    <option value="PNEUMATIC">Pneumatic Air Leak</option>
                    <option value="UTILITY">Utility Steam/Water Stop</option>
                    <option value="SAFETY">Safety Switch Stop</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Failure Priority Urgency</label>
                  <select className="form-control" value={bdPriority} onChange={(e) => setBdPriority(e.target.value)}>
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical Breakdown (Stops production)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Detailed Problem Description *</label>
                <textarea
                  className="form-control"
                  style={{ height: '60px', resize: 'vertical' }}
                  placeholder="Describe the noise, PLC warning code, or failure symptoms..."
                  value={bdDesc}
                  onChange={(e) => setBdDesc(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowBdDrawer(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">File Breakdown Ticket</button>
            </div>
          </form>
        </div>
      )}

      {/* TECH REPAIR FORM DRAWER */}
      {selectedWorkOrder && selectedWorkOrder.status === 'ASSIGNED' && (
        <div className="drawer-backdrop" onClick={() => setSelectedWorkOrder(null)}>
          <form onSubmit={handleCompleteRepair} className="drawer-content" style={{ width: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Perform Machine Repair</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedWorkOrder(null)}>X</button>
            </div>
            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ backgroundColor: 'var(--light-blue)', padding: '12px', borderRadius: 'var(--border-radius)', fontSize: '0.85rem' }}>
                <div><strong>Work Order Code:</strong> {selectedWorkOrder.workOrderCode}</div>
                <div><strong>Asset Machine:</strong> {selectedWorkOrder.machineCode}</div>
                <div><strong>Active Spares Expense:</strong> ${selectedWorkOrder.spareCost}</div>
              </div>

              <div className="form-group">
                <label>Technician Diagnosis *</label>
                <input type="text" className="form-control" value={techDiagnosis} onChange={(e) => setTechDiagnosis(e.target.value)} placeholder="e.g. solenoid coil winding burnt out" required />
              </div>

              <div className="form-group">
                <label>Work Performed Actions *</label>
                <textarea className="form-control" style={{ height: '50px' }} value={techWorkPerformed} onChange={(e) => setTechWorkPerformed(e.target.value)} placeholder="e.g. Replaced solenoid coil, checked validation loops..." required />
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Root Cause Category *</label>
                  <input type="text" className="form-control" value={techRootCause} onChange={(e) => setTechRootCause(e.target.value)} placeholder="e.g. Voltage fluctuation spike" required />
                </div>
                <div className="form-group">
                  <label>Corrective Action logged *</label>
                  <input type="text" className="form-control" value={techCorrective} onChange={(e) => setTechCorrective(e.target.value)} placeholder="e.g. Solenoid replaced, stabilizer connected" required />
                </div>
              </div>

              <div className="form-group">
                <label>Labor Duration (Hours)</label>
                <input type="number" className="form-control" value={techLaborHours} onChange={(e) => setTechLaborHours(e.target.value)} />
              </div>
            </div>
            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedWorkOrder(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Complete Repair & Run Trial</button>
            </div>
          </form>
        </div>
      )}

      {/* DH TRIAL VERIFY DRAWER */}
      {selectedWorkOrder && selectedWorkOrder.status === 'TRIAL_RUN' && (
        <div className="drawer-backdrop" onClick={() => setSelectedWorkOrder(null)}>
          <form onSubmit={handleVerifyTrial} className="drawer-content" style={{ width: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Verify Repair Trial Run</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedWorkOrder(null)}>X</button>
            </div>
            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ backgroundColor: 'var(--light-orange)', padding: '12px', borderRadius: 'var(--border-radius)', fontSize: '0.85rem' }}>
                <div><strong>Work Order Code:</strong> {selectedWorkOrder.workOrderCode}</div>
                <div><strong>Asset Machine:</strong> {selectedWorkOrder.machineCode}</div>
                <div><strong>Technician Diagnosis:</strong> {selectedWorkOrder.diagnosis}</div>
              </div>

              <div className="form-group">
                <label>Trial Run Result *</label>
                <select className="form-control" value={trialResult} onChange={(e) => setTrialResult(e.target.value)}>
                  <option value="SUCCESS">SUCCESS (Close work order & resume machine)</option>
                  <option value="FAILED">FAILED (Reopen repair task and dispatch back to tech)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Trial Verification Comments *</label>
                <textarea className="form-control" style={{ height: '60px' }} value={trialComment} onChange={(e) => setTrialComment(e.target.value)} required />
              </div>
            </div>
            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedWorkOrder(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Confirm & Log Result</button>
            </div>
          </form>
        </div>
      )}

      {/* MACHINE 360 DEGREE DETAIL MODAL */}
      {selectedMachine && (
        <div className="drawer-backdrop" onClick={() => setSelectedMachine(null)}>
          <div className="drawer-content" style={{ width: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className="status-badge approved">{selectedMachine.machineCode}</span>
                <h3 style={{ marginTop: '6px' }}>{selectedMachine.name}</h3>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedMachine(null)}>X</button>
            </div>
            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.85rem' }}>
              <div><strong>Manufacturer:</strong> {selectedMachine.manufacturer} | Model: {selectedMachine.model}</div>
              <div><strong>Plant Area location:</strong> {selectedMachine.area} ({selectedMachine.locationDetail})</div>
              <div><strong>Installation Date:</strong> {new Date(selectedMachine.installationDate).toLocaleDateString()}</div>
              <div><strong>Frequency of PM checks:</strong> {selectedMachine.pmFrequency}</div>
              <div><strong>Warranty Status:</strong> Expired on {new Date(selectedMachine.installationDate).toLocaleDateString()}</div>
              <div><strong>Owner / Lead Operator Code:</strong> {selectedMachine.ownerId || 'David Vance'}</div>
              <hr style={{ borderColor: 'var(--border-grey)' }} />
              <div><strong>Capacity output:</strong> {selectedMachine.capacity || 'Not specified'}</div>
              <div><strong>Criticality Score:</strong> <span className="status-badge critical">{selectedMachine.criticality}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
