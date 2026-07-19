'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

interface DashboardData {
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalDepts: number;
    totalItems: number;
    totalInvValue: number;
    outOfStock: number;
    lowStock: number;
    pendingMR_DH: number;
    pendingMR_IV: number;
    openPR: number;
    openPO: number;
    openBreakdowns: number;
    criticalBreakdowns: number;
    totalMaintenanceCost: number;
  };
  charts: {
    deptConsumption: Array<{ name: string; value: number }>;
    activeDowntimes: Array<{
      code: string;
      machine: string;
      priority: string;
      reportedAt: string;
      status: string;
    }>;
  };
  lists: {
    recentUsers: Array<{ code: string; name: string; designation: string; status: string }>;
    pendingRequests: Array<{ code: string; purpose: string; status: string; date: string }>;
    lowStockItems: Array<{ code: string; name: string; balance: number; reorderLevel: number }>;
    recentPOs: Array<{ code: string; vendor: string; value: number; status: string }>;
  }
}

function KpiCard({
  title,
  value,
  desc,
  color,
  icon,
  onClick,
}: {
  title: string;
  value: string | number;
  desc: string;
  color?: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div className={`summary-card ${color || ''}`} onClick={onClick}>
      <div className="summary-card-icon">{icon}</div>
      <div>
        <div className="summary-title">{title}</div>
        <div className="summary-value">{value}</div>
        <div className="summary-desc">{desc}</div>
      </div>
    </div>
  );
}

const iconInventory = (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
  </svg>
);
const iconRequest = (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);
const iconBreakdown = (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);
const iconMoney = (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const iconPO = (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
  </svg>
);
const iconUsers = (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);

// Array of nice colors to pick from for dynamic charts
const CHART_COLORS = ['#1A56DB', '#F58220', '#059669', '#7C3AED', '#E11D48', '#0284C7', '#0F766E'];

// SVG Donut chart
function DonutChart({ data }: { data: Array<{ name: string; value: number }> }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 70;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const slices = data.map((d, i) => {
    const pct = total > 0 ? d.value / total : 0;
    const dash = pct * circumference;
    const slice = { ...d, color: CHART_COLORS[i % CHART_COLORS.length], dash, offset, pct };
    offset += dash;
    return slice;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: '180px', height: '180px', flexShrink: 0 }}>
        {total === 0 ? (
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '28px solid #F1F5F9' }} />
        ) : (
          <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
            {slices.map((s, i) => (
              <circle
                key={i}
                cx="90" cy="90" r={r}
                fill="transparent"
                stroke={s.color}
                strokeWidth="28"
                strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                strokeDashoffset={-s.offset}
                strokeLinecap="butt"
              />
            ))}
          </svg>
        )}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0A1F3D', fontFamily: 'Syne, sans-serif' }}>
            ${total > 0 ? (total / 1000).toFixed(0) + 'k' : '—'}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Total</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {slices.length === 0 && <div className="text-muted" style={{ fontSize: '0.85rem' }}>No data available</div>}
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: s.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A' }}>{s.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>${s.value.toLocaleString()} · {total > 0 ? Math.round(s.value / total * 100) : 0}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser, activeRole } = useApp();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [activeRole]);

  if (loading || !data) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <p style={{ color: '#64748B' }}>Loading dashboard data...</p>
      </div>
    );
  }

  if (!currentUser) return null;

  const { summary: stats, charts, lists } = data;

  // ─── HR Dashboard ───────────────────────────────────────────
  if (activeRole === 'HR') {
    return (
      <div>
        <div className="flex-space mb-4">
          <div>
            <h2 className="page-title">Human Resources Dashboard</h2>
            <p className="text-muted">Welcome, {currentUser.fullName} · HR Administrator</p>
          </div>
          <button className="btn btn-primary" onClick={() => router.push('/dashboard/hr')}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 15, height: 15 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Onboard Employee
          </button>
        </div>

        <div className="dashboard-grid">
          <KpiCard title="Total Employees" value={stats.totalUsers} desc="All records in directory" icon={iconUsers} onClick={() => router.push('/dashboard/hr')} />
          <KpiCard title="Active Profiles" color="green" value={stats.activeUsers} desc="Live system access" icon={iconUsers} onClick={() => router.push('/dashboard/hr')} />
          <KpiCard title="Departments" value={stats.totalDepts} desc="Plant 1 cost centres" icon={iconUsers} onClick={() => router.push('/dashboard/hr')} />
        </div>

        <div className="table-container">
          <div className="table-header-bar">
            <h3>Employee Directory</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => router.push('/dashboard/hr')}>View All</button>
          </div>
          <div className="nax-table-wrapper">
            <table className="nax-table">
              <thead><tr>
                <th>Emp Code</th><th>Full Name</th><th>Designation</th><th>Status</th>
              </tr></thead>
              <tbody>
                {lists.recentUsers.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center' }}>No users found</td></tr>
                ) : (
                  lists.recentUsers.map((u, i) => (
                    <tr key={i}>
                      <td className="text-bold code-text">{u.code}</td>
                      <td>{u.name}</td>
                      <td>{u.designation}</td>
                      <td>
                        <span className={`status-badge ${u.status === 'ACTIVE' ? 'approved' : 'pending'}`}>
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ─── Department Head Dashboard ─────────────────────────────
  if (activeRole === 'DH') {
    return (
      <div>
        <div className="flex-space mb-4">
          <div>
            <h2 className="page-title">Department Console</h2>
            <p className="text-muted">Welcome, {currentUser.fullName}</p>
          </div>
          <button className="btn btn-primary" onClick={() => router.push('/dashboard/requests')}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 15, height: 15 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Raise Material Request
          </button>
        </div>

        <div className="dashboard-grid">
          <KpiCard title="Pending Approvals" color="orange" value={stats.pendingMR_DH} desc="Material requests awaiting your action" icon={iconRequest} onClick={() => router.push('/dashboard/requests')} />
          <KpiCard title="Machine Breakdowns" color="red" value={stats.openBreakdowns} desc="Open maintenance tickets" icon={iconBreakdown} onClick={() => router.push('/dashboard/maintenance')} />
        </div>

        <div className="table-container">
          <div className="table-header-bar">
            <h3>Outstanding Actions</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => router.push('/dashboard/requests')}>View All</button>
          </div>
          <div className="nax-table-wrapper">
            <table className="nax-table">
              <thead><tr>
                <th>Req No</th><th>Purpose</th><th>Date</th><th>Action</th>
              </tr></thead>
              <tbody>
                {lists.pendingRequests.filter(r => r.status === 'PENDING_DH').length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center' }}>No pending actions</td></tr>
                ) : (
                  lists.pendingRequests.filter(r => r.status === 'PENDING_DH').map((r, i) => (
                    <tr key={i}>
                      <td className="text-bold code-text">{r.code}</td>
                      <td>{r.purpose}</td>
                      <td>{new Date(r.date).toLocaleDateString()}</td>
                      <td><button className="btn btn-blue btn-sm" onClick={() => router.push(`/dashboard/requests?code=${r.code}`)}>Review & Approve</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ─── Inventory Dashboard ──────────────────────────────────
  if (activeRole === 'INVENTORY_HEAD' || activeRole === 'USER') {
    return (
      <div>
        <div className="flex-space mb-4">
          <div>
            <h2 className="page-title">Stores & Warehouse Control</h2>
            <p className="text-muted">Plant 1 Inventory Operations</p>
          </div>
        </div>
        
        <div className="dashboard-grid">
          <KpiCard title="Items Master" value={stats.totalItems} desc="Registered item codes" icon={iconInventory} onClick={() => router.push('/dashboard/items')} />
          <KpiCard title="Asset Valuation" color="green" value={`$${stats.totalInvValue.toLocaleString()}`} desc="Total stock holding value" icon={iconMoney} onClick={() => router.push('/dashboard/reports')} />
          <KpiCard title="Low Stock Alerts" color={stats.lowStock > 0 ? "orange" : "green"} value={stats.lowStock} desc="Items below reorder level" icon={iconRequest} onClick={() => router.push('/dashboard/inventory')} />
          <KpiCard title="Pending Dispatches" color="blue" value={stats.pendingMR_IV} desc="Approved MRs awaiting issue" icon={iconInventory} onClick={() => router.push('/dashboard/requests')} />
        </div>

        <div className="table-container">
          <div className="table-header-bar">
            <h3>Item Shortage Alerts</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => router.push('/dashboard/inventory')}>View Ledger</button>
          </div>
          <div className="nax-table-wrapper">
            <table className="nax-table">
              <thead><tr>
                <th>Item Code</th><th>Item Name</th><th>Current Bal</th><th>Reorder Lvl</th><th>Action</th>
              </tr></thead>
              <tbody>
                {lists.lowStockItems.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center' }}>No stock alerts</td></tr>
                ) : (
                  lists.lowStockItems.map((itm, i) => (
                    <tr key={i}>
                      <td className="text-bold code-text">{itm.code}</td>
                      <td>{itm.name}</td>
                      <td style={{ color: itm.balance === 0 ? '#DC2626' : '#EA580C', fontWeight: 600 }}>{itm.balance}</td>
                      <td>{itm.reorderLevel}</td>
                      <td><button className="btn btn-secondary btn-sm" onClick={() => router.push('/dashboard/purchase')}>Create PR</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ─── Maintenance Dashboard ──────────────────────────────────
  if (activeRole === 'MAINTENANCE_HEAD' || activeRole === 'MAINTENANCE_TECH') {
    return (
      <div>
        <div className="flex-space mb-4">
          <div>
            <h2 className="page-title">Engineering & Maintenance</h2>
            <p className="text-muted">Breakdown Tracking & Work Orders</p>
          </div>
        </div>

        <div className="dashboard-grid">
          <KpiCard title="Active Breakdowns" color="red" value={stats.openBreakdowns} desc="Open tickets" icon={iconBreakdown} onClick={() => router.push('/dashboard/maintenance')} />
          <KpiCard title="Critical Incidents" color="red" value={stats.criticalBreakdowns} desc="High severity issues" icon={iconBreakdown} onClick={() => router.push('/dashboard/maintenance')} />
          <KpiCard title="Maint. Spares Cost" color="orange" value={`$${stats.totalMaintenanceCost.toLocaleString()}`} desc="Cost incurred this month" icon={iconMoney} onClick={() => router.push('/dashboard/reports')} />
        </div>

        <div className="table-container">
          <div className="table-header-bar">
            <h3>Machine Status Overview</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => router.push('/dashboard/maintenance')}>Manage Tickets</button>
          </div>
          <div className="nax-table-wrapper">
            <table className="nax-table">
              <thead><tr>
                <th>Breakdown ID</th><th>Machine</th><th>Priority</th><th>Time Reported</th><th>Status</th>
              </tr></thead>
              <tbody>
                {charts.activeDowntimes.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center' }}>No active breakdowns</td></tr>
                ) : (
                  charts.activeDowntimes.map((d, i) => (
                    <tr key={i} style={d.priority === 'CRITICAL' ? { background: '#FEF2F2' } : {}}>
                      <td className="text-bold code-text">{d.code}</td>
                      <td className={d.priority === 'CRITICAL' ? "text-bold" : ""}>{d.machine}</td>
                      <td>
                        <span className={`status-badge ${d.priority === 'CRITICAL' ? 'critical' : 'under_review'}`}>
                          {d.priority}
                        </span>
                      </td>
                      <td>{new Date(d.reportedAt).toLocaleString()}</td>
                      <td><span className="status-badge pending">{d.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ─── Director Dashboard (Default Super View) ────────────────
  return (
    <div>
      <div className="flex-space mb-4">
        <div>
          <h2 className="page-title">Director Command Center</h2>
          <p className="text-muted">Welcome back, {currentUser.fullName} · Comprehensive overview of Plant 1 operations</p>
        </div>
      </div>

      {/* Row 1 */}
      <div className="dashboard-grid mb-4">
        <KpiCard title="Total Active Items" value={stats.totalItems} desc="Item Master records" icon={iconInventory} onClick={() => router.push('/dashboard/items')} />
        <KpiCard title="Pending DH Approvals" color="orange" value={stats.pendingMR_DH} desc="Material Request queue" icon={iconRequest} onClick={() => router.push('/dashboard/requests')} />
        <KpiCard title="Inventory Capital Value" color="green" value={`$${stats.totalInvValue.toLocaleString()}`} desc="Stores asset valuation" icon={iconMoney} onClick={() => router.push('/dashboard/reports')} />
        <KpiCard title="Machine Downtimes" color="red" value={stats.openBreakdowns} desc={`${stats.criticalBreakdowns} critical breakdown active`} icon={iconBreakdown} onClick={() => router.push('/dashboard/maintenance')} />
      </div>

      {/* Row 2 */}
      <div className="dashboard-grid mb-4">
        <KpiCard title="Open Purchase Orders" color="green" value={stats.openPO} desc="Active procurement lines" icon={iconPO} onClick={() => router.push('/dashboard/purchase')} />
        <KpiCard title="Pending Requisitions" color="orange" value={stats.openPR} desc="PRs awaiting action" icon={iconRequest} onClick={() => router.push('/dashboard/purchase')} />
        <KpiCard title="Personnel Registered" color="blue" value={stats.totalUsers} desc="System active logins" icon={iconUsers} onClick={() => router.push('/dashboard/hr')} />
        <KpiCard title="Maintenance Costs" color="red" value={`$${stats.totalMaintenanceCost.toLocaleString()}`} desc="Spares consumed this month" icon={iconMoney} onClick={() => router.push('/dashboard/reports')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Col */}
        <div className="table-container" style={{ margin: 0, height: '100%' }}>
          <div className="table-header-bar">
            <h3>Department Consumption (YTD)</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => router.push('/dashboard/reports')}>Detailed Report</button>
          </div>
          <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DonutChart data={charts.deptConsumption} />
          </div>
        </div>

        {/* Right Col */}
        <div className="table-container" style={{ margin: 0, height: '100%' }}>
          <div className="table-header-bar">
            <h3>Machine Health / Active Incidents</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => router.push('/dashboard/maintenance')}>Maint. Logs</button>
          </div>
          <div className="nax-table-wrapper" style={{ border: 'none' }}>
            <table className="nax-table">
              <thead><tr>
                <th>Machine</th><th>Priority</th><th>Since</th>
              </tr></thead>
              <tbody>
                {charts.activeDowntimes.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center' }}>No active downtime incidents</td></tr>
                ) : (
                  charts.activeDowntimes.map((d, i) => (
                    <tr key={i}>
                      <td className="text-bold">{d.machine}</td>
                      <td>
                        <span className={`status-badge ${d.priority === 'CRITICAL' ? 'critical' : 'under_review'}`}>
                          {d.priority}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(d.reportedAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
