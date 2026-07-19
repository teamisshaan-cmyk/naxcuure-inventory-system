'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const {
    currentUser,
    activeRole,
    rolesList,
    switchRole,
    allUsers,
    loginAsUser,
    notifications,
    markNotificationAsRead,
    logout,
  } = useApp();

  const pathname = usePathname();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 1) {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setSuggestions(data.results || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Search error:', err);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (item: any) => {
    setShowSuggestions(false);
    setSearchQuery('');
    if (item.type === 'item') router.push(`/dashboard/items?code=${item.code}`);
    else if (item.type === 'machine') router.push(`/dashboard/maintenance?machineCode=${item.code}`);
    else if (item.type === 'request') router.push(`/dashboard/requests?code=${item.code}`);
    else if (item.type === 'po') router.push(`/dashboard/purchase?code=${item.code}`);
    else if (item.type === 'employee') router.push(`/dashboard/hr?code=${item.code}`);
    else if (item.type === 'breakdown') router.push(`/dashboard/maintenance?breakdownCode=${item.code}`);
  };

  if (!currentUser) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '16px', background: '#F8FAFC' }}>
        <div className="spinner" />
        <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Loading session...</p>
      </div>
    );
  }

  const isDirector = activeRole === 'DIRECTOR';
  const isHR = activeRole === 'HR' || isDirector;
  const isDH = activeRole === 'DH' || isDirector;
  const isInventory = ['INVENTORY_HEAD', 'INVENTORY_EXEC'].includes(activeRole) || isDirector;
  const isPurchase = ['PURCHASE_MANAGER', 'PURCHASE_EXEC'].includes(activeRole) || isDirector;
  const isQuality = activeRole === 'QA_QC' || isDirector;
  const isMaintenance = ['MAINTENANCE_HEAD', 'MAINTENANCE_TECH'].includes(activeRole) || isDirector;
  const isAuditor = activeRole === 'AUDITOR' || isDirector;

  const menuItems = [
    {
      label: 'Overview', path: '/dashboard', show: true,
      icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>
    },
    {
      label: 'HR & Personnel', path: '/dashboard/hr', show: isHR,
      icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
    },
    {
      label: 'Item Master', path: '/dashboard/items', show: isDirector || isDH || isInventory,
      icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.007 5.25H3.75v-.008h.008V12Zm-.008 5.25h.008v.008H3.75v-.008Z" /></svg>
    },
    {
      label: 'Material Requests', path: '/dashboard/requests', show: true,
      icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
    },
    {
      label: 'Stores & Stock', path: '/dashboard/inventory', show: isInventory || isAuditor,
      icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
    },
    {
      label: 'Procurement & POs', path: '/dashboard/purchase', show: isPurchase || isAuditor,
      icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
    },
    {
      label: 'Quality Assurance', path: '/dashboard/quality', show: isQuality || isInventory,
      icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>
    },
    {
      label: 'Maintenance', path: '/dashboard/maintenance', show: isMaintenance || isDirector || isDH,
      icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" /></svg>
    },
    {
      label: 'Reports', path: '/dashboard/reports', show: isAuditor || isDirector || isDH,
      icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
    },
    {
      label: 'Audit Log', path: '/dashboard/audit', show: isDirector || isAuditor,
      icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>
    },
  ];

  const unreadCount = notifications.filter(n => !n.isRead && (n.employeeCode === currentUser.employeeCode || n.employeeCode === 'ALL')).length;
  const userInitials = currentUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2);

  return (
    <div className="app-container">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`app-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">
            <div className="sidebar-brand-icon">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
            </div>
            <h1>NAXCUURE</h1>
          </div>
          <span>INVENTORY SYSTEM</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.filter(item => item.show).map((item) => {
            const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
            return (
              <Link href={item.path} key={item.path} className={`nav-item ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <label>DEMO: Switch Profile</label>
          <select value={currentUser.employeeCode} onChange={(e) => loginAsUser(e.target.value)}>
            {allUsers.map((u) => (
              <option key={u.employeeCode} value={u.employeeCode} style={{ color: '#333' }}>
                {u.fullName} — {u.designation}
              </option>
            ))}
          </select>
        </div>
      </aside>

      {/* Content Area */}
      <div className="content-wrapper">
        {/* Header */}
        <header className="app-header">
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 22, height: 22 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div className="header-left" ref={searchRef}>
            <div className="search-wrapper">
              <svg className="search-icon" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.608 10.608Z" />
              </svg>
              <input
                id="global-search"
                type="text"
                className="search-input"
                placeholder="Search items, machines, POs, employees..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.trim().length > 1 && setShowSuggestions(true)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-panel">
                  {suggestions.map((item, idx) => (
                    <div key={idx} className="suggestion-item" onClick={() => handleSuggestionClick(item)}>
                      <div className="suggestion-header">{item.name}</div>
                      <div className="suggestion-meta">
                        <span>{item.code}</span>
                        <span style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700, color: '#F58220' }}>{item.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="header-right">
            {rolesList.length > 1 && (
              <div className="role-selector-wrapper">
                <span className="role-label">Role</span>
                <select className="role-select" value={activeRole} onChange={(e) => switchRole(e.target.value)}>
                  {rolesList.map((role) => (
                    <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            )}

            <div
              id="notif-bell"
              className="notifications-bell"
              onClick={() => setShowNotifDrawer(true)}
              title="Notifications"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              {unreadCount > 0 && <div className="bell-badge" />}
            </div>

            <div className="user-badge" id="user-badge" onClick={() => router.push(`/dashboard/hr`)}>
              <div className="avatar">{userInitials}</div>
              <div className="user-info">
                <span className="user-name">{currentUser.fullName}</span>
                <span className="user-code">{activeRole.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="main-content">
          {children}
        </main>
      </div>

      {/* Notifications Drawer */}
      {showNotifDrawer && (
        <div className="drawer-backdrop" onClick={() => setShowNotifDrawer(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                    {unreadCount} unread
                  </p>
                )}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowNotifDrawer(false)}>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>
            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      border: `1px solid ${notif.isRead ? '#E2E8F0' : '#DBEAFE'}`,
                      borderRadius: '10px',
                      padding: '14px 16px',
                      background: notif.isRead ? 'white' : '#EFF6FF',
                      position: 'relative',
                    }}
                  >
                    {!notif.isRead && (
                      <div style={{
                        position: 'absolute', top: '14px', right: '14px',
                        width: '8px', height: '8px',
                        background: '#1A56DB', borderRadius: '50%',
                      }} />
                    )}
                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0A1F3D', paddingRight: '20px' }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px', lineHeight: 1.5 }}>
                      {notif.message}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        {new Date(notif.timestamp).toLocaleString()}
                      </span>
                      {!notif.isRead && (
                        <button
                          onClick={() => markNotificationAsRead(notif.id)}
                          style={{
                            background: 'none', border: 'none',
                            color: '#1A56DB', fontSize: '0.72rem',
                            cursor: 'pointer', fontWeight: 600,
                          }}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
