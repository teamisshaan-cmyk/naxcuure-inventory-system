'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function HRPage() {
  const { currentUser, activeRole, allUsers } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [plant, setPlant] = useState('Plant 1');
  const [departmentCode, setDepartmentCode] = useState('NAX-DEP-PROD');
  const [designation, setDesignation] = useState('');
  const [roles, setRoles] = useState('USER');
  const [approvalLimit, setApprovalLimit] = useState('0');
  const [reportingManager, setReportingManager] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || allUsers);
    } catch (err) {
      console.error(err);
      setUsers(allUsers);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !designation) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          mobileNumber,
          plant,
          departmentCode,
          designation,
          roles,
          approvalLimit,
          reportingManager
        })
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setShowAddDrawer(false);
        // Reset form
        setFullName('');
        setEmail('');
        setMobileNumber('');
        setDesignation('');
        setRoles('USER');
        setApprovalLimit('0');
        setReportingManager('');
        fetchUsers();
      }
    } catch (err) {
      setError('Failed to create employee profile.');
    }
  };

  const toggleUserStatus = async (employeeCode: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeCode, status: newStatus })
      });
      fetchUsers();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const isHR = activeRole === 'HR' || activeRole === 'DIRECTOR';

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading Employee Registry...</div>;
  }

  return (
    <div>
      <div className="flex-space mb-4">
        <div>
          <h2 className="page-title">Personnel Directory & Identity Access</h2>
          <p className="text-muted">HR Control Panel for NAXCUURE Plant Operations</p>
        </div>
        {isHR && (
          <button className="btn btn-primary" onClick={() => setShowAddDrawer(true)}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 15, height: 15 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Onboard New Employee
          </button>
        )}
      </div>

      <div className="table-container">
        <div className="table-header-bar">
          <h3>Employee Directory List</h3>
        </div>
        <div className="nax-table-wrapper">
          <table className="nax-table">
            <thead>
              <tr>
                <th>Emp Code</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Permitted System Roles</th>
                <th>Approval Value Limit</th>
                <th>Account Status</th>
                {isHR && <th>Control Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((usr) => (
                <tr key={usr.employeeCode}>
                  <td className="code-text">{usr.employeeCode}</td>
                  <td className="text-bold">{usr.fullName}</td>
                  <td>{usr.email}</td>
                  <td>{usr.departmentCode.replace('NAX-DEP-', '')}</td>
                  <td>{usr.designation}</td>
                  <td>
                    {usr.roles.split(',').map((r: string) => (
                      <span key={r} className="status-badge under_review" style={{ margin: '2px', fontSize: '0.65rem' }}>
                        {r}
                      </span>
                    ))}
                  </td>
                  <td className="text-bold">${usr.approvalLimit.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${usr.status === 'ACTIVE' ? 'approved' : 'rejected'}`}>
                      {usr.status}
                    </span>
                  </td>
                  {isHR && (
                    <td>
                      <button
                        className={`btn btn-sm ${usr.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => toggleUserStatus(usr.employeeCode, usr.status)}
                      >
                        {usr.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Drawer Modal */}
      {showAddDrawer && (
        <div className="drawer-backdrop" onClick={() => setShowAddDrawer(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Onboard Plant Employee</h3>
              <button className="btn btn-secondary btn-sm" style={{ minWidth: '40px' }} onClick={() => setShowAddDrawer(false)}>
                X
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="drawer-body">
              {error && (
                <div className="nax-warning-box">
                  <div className="nax-warning-title">Submission Error</div>
                  <div>{error}</div>
                </div>
              )}

              <div className="form-group mb-4">
                <label>Full Employee Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Michael Thorne"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group mb-4">
                <label>Official Email Address *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. michael.t@naxcuure.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group mb-4">
                <label>Mobile Contact Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. +91 9988776655"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                />
              </div>

              <div className="form-grid mb-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="form-group">
                  <label>Department</label>
                  <select
                    className="form-control"
                    value={departmentCode}
                    onChange={(e) => setDepartmentCode(e.target.value)}
                  >
                    <option value="NAX-DEP-PROD">Production</option>
                    <option value="NAX-DEP-PACK">Packing</option>
                    <option value="NAX-DEP-QA">Quality Assurance</option>
                    <option value="NAX-DEP-QC">Quality Control</option>
                    <option value="NAX-DEP-WH">Warehouse</option>
                    <option value="NAX-DEP-ENG">Engineering</option>
                    <option value="NAX-DEP-PUR">Purchase</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Designation *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Production Chemist"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group mb-4">
                <label>Permitted Login Roles (Comma separated) *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. USER,DH,MAINTENANCE_HEAD"
                  value={roles}
                  onChange={(e) => setRoles(e.target.value.toUpperCase())}
                  required
                />
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                  Available roles: USER, DH, DIRECTOR, HR, INVENTORY_HEAD, PURCHASE_MANAGER, QA_QC, MAINTENANCE_TECH, AUDITOR
                </span>
              </div>

              <div className="form-grid mb-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="form-group">
                  <label>Approval Limit Value ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={approvalLimit}
                    onChange={(e) => setApprovalLimit(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Reporting Manager Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. NAX-EMP-00002"
                    value={reportingManager}
                    onChange={(e) => setReportingManager(e.target.value)}
                  />
                </div>
              </div>

              <div className="drawer-footer" style={{ margin: '20px -24px -24px -24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddDrawer(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Onboard & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
