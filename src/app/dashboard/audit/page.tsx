'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function AuditPage() {
  const { activeRole } = useApp();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isDirector = activeRole === 'DIRECTOR' || activeRole === 'AUDITOR';

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading System Security Trails...</div>;
  }

  if (!isDirector) {
    return (
      <div className="nax-warning-box">
        <div className="nax-warning-title">Access Denied</div>
        <div>Only Company Director or Authorized Auditors are permitted to view the raw system security Audit Trail logs.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-space mb-4">
        <div>
          <h2>System Audit Trail logs</h2>
          <p className="text-muted">Permanent, immutable logs of all transactional actions, modifications, and administrative operations.</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header-bar">
          <h3>Permanent Security Logs</h3>
        </div>
        <div className="nax-table-wrapper">
          <table className="nax-table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th>Audit ID</th>
                <th>Timestamp</th>
                <th>Employee</th>
                <th>Working Role</th>
                <th>Module Scope</th>
                <th>Performed Action</th>
                <th>Target Record</th>
                <th>Security Logs & Remarks</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="text-bold">{l.id.substring(0, 8).toUpperCase()}</td>
                  <td>{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="text-bold">{l.userName} ({l.employeeCode})</td>
                  <td><span className="status-badge on_hold" style={{ fontSize: '0.65rem' }}>{l.activeRole}</span></td>
                  <td><span className="status-badge under_review" style={{ fontSize: '0.65rem' }}>{l.module}</span></td>
                  <td><span className={`status-badge ${l.action === 'CREATE' ? 'approved' : 'pending'}`} style={{ fontSize: '0.65rem' }}>{l.action}</span></td>
                  <td className="text-bold">{l.recordCode}</td>
                  <td>
                    <div style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={l.newValue || l.comment}>
                      {l.comment || l.newValue || 'No remark logged.'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
