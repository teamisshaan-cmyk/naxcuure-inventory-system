'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { allUsers, loginAsUser } = useApp();
  const router = useRouter();

  // Mode: signin vs signup
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up states
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [designation, setDesignation] = useState('');
  const [departmentCode, setDepartmentCode] = useState('NAX-DEP-PROD');
  const [selectedRole, setSelectedRole] = useState('USER');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    const matched = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      setIsLogging(true);
      loginAsUser(matched.employeeCode);
      router.push('/dashboard');
    } else {
      setError('Invalid credentials. Please use one of the Quick Access profiles below.');
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!fullName || !signupEmail || !signupPassword || !designation) {
      setError('Please fill in Full Name, Email, Password, and Designation.');
      return;
    }

    setIsLogging(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email: signupEmail,
          mobileNumber: signupMobile || '9876543210',
          plant: 'Plant 1',
          departmentCode,
          designation,
          roles: selectedRole,
          approvalLimit: selectedRole === 'DIRECTOR' ? 1000000 : 50000,
          reportingManager: 'NAX-EMP-00001'
        })
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setIsLogging(false);
      } else {
        setSuccessMsg('Account created successfully! Signing you in...');
        setTimeout(() => {
          loginAsUser(data.user.employeeCode);
          router.push('/dashboard');
        }, 1200);
      }
    } catch (err) {
      setError('Failed to create account. Please try again.');
      setIsLogging(false);
    }
  };

  const handleQuickLogin = (employeeCode: string) => {
    setIsLogging(true);
    loginAsUser(employeeCode);
    router.push('/dashboard');
  };

  const roleColor: Record<string, string> = {
    DIRECTOR: '#7C3AED',
    HR: '#0891B2',
    DH: '#059669',
    INVENTORY_HEAD: '#D97706',
    PURCHASE_MANAGER: '#DC2626',
    QA_QC: '#DB2777',
    MAINTENANCE_HEAD: '#EA580C',
    MAINTENANCE_TECH: '#65A30D',
    USER: '#64748B',
  };

  const getRoleColor = (roles: string) => roleColor[roles.split(',')[0]] || '#64748B';

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #0A1F3D 0%, #0D2B5E 50%, #081630 100%)',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background circles */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '-5%',
          width: '500px', height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(26,86,219,0.15) 0%, transparent 70%)',
          animation: 'floatA 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', right: '-5%',
          width: '600px', height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,130,32,0.1) 0%, transparent 70%)',
          animation: 'floatB 10s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '30%',
          width: '300px', height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
          animation: 'floatC 12s ease-in-out infinite',
        }} />
      </div>

      {/* Left Branding Panel */}
      <div style={{
        display: 'none',
        flex: 1,
        padding: '60px',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
      }} className="login-left-panel">
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px',
        }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'linear-gradient(135deg, #F58220, #D96B0B)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(245,130,32,0.35)',
          }}>
            <svg style={{ width: '26px', height: '26px', color: 'white' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", color: 'white', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.5px', lineHeight: 1 }}>NAXCUURE</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem', letterSpacing: '3px', fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' }}>INVENTORY SYSTEM</div>
          </div>
        </div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", color: 'white', fontSize: '2.8rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '20px', letterSpacing: '-0.03em' }}>
          Enterprise<br/>Pharmaceutical<br/>Manufacturing ERP
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '360px' }}>
          End-to-end inventory, procurement, quality assurance, and machine maintenance — all in one intelligent platform.
        </p>
        <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {['Material Requests & Approval Workflow', 'Procurement & Purchase Orders', 'Machine Maintenance & Breakdowns', 'Quality Assurance & GRN Inspection'].map((feat) => (
            <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(245,130,32,0.2)', border: '1px solid rgba(245,130,32,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg style={{ width: '11px', height: '11px', color: '#F58220' }} fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem' }}>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Login Panel */}
      <div style={{
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px 24px',
        position: 'relative',
        zIndex: 1,
        overflowY: 'auto',
      }}>
        <div style={{
          width: '100%',
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '42px', height: '42px',
                background: 'linear-gradient(135deg, #F58220, #D96B0B)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(245,130,32,0.3)',
                flexShrink: 0,
              }}>
                <svg style={{ width: '22px', height: '22px', color: 'white' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", color: '#0A1F3D', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.3px', lineHeight: 1 }}>NAXCUURE</div>
                <div style={{ color: '#F58220', fontSize: '0.6rem', letterSpacing: '2.5px', fontWeight: 700, textTransform: 'uppercase', marginTop: '3px' }}>INVENTORY SYSTEM</div>
              </div>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.84rem', marginTop: '4px' }}>
              {mode === 'signin' ? 'Sign in to your plant operations account' : 'Register a new enterprise user account'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'flex',
            background: '#F1F5F9',
            borderRadius: '12px',
            padding: '4px',
            gap: '4px',
          }}>
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                background: mode === 'signin' ? '#1A56DB' : 'transparent',
                color: mode === 'signin' ? '#FFFFFF' : '#64748B',
                transition: 'all 0.2s',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                background: mode === 'signup' ? '#1A56DB' : 'transparent',
                color: mode === 'signup' ? '#FFFFFF' : '#64748B',
                transition: 'all 0.2s',
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Login / Signup Forms */}
          {mode === 'signin' ? (
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {error && (
                <div style={{
                  background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#7F1D1D',
                  padding: '10px 14px', borderRadius: '8px', fontSize: '0.81rem', fontWeight: 500,
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0A1F3D' }}>Official Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  style={{
                    padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: '10px',
                    fontSize: '0.85rem', outline: 'none', transition: 'all 0.2s', color: '#0F172A',
                  }}
                  placeholder="e.g. arthur.nax@naxcuure.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0A1F3D' }}>Password</label>
                <input
                  id="login-password"
                  type="password"
                  style={{
                    padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: '10px',
                    fontSize: '0.85rem', outline: 'none', transition: 'all 0.2s', color: '#0F172A',
                  }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                />
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={isLogging}
                style={{
                  width: '100%', padding: '12px',
                  background: isLogging ? '#94A3B8' : 'linear-gradient(135deg, #F58220 0%, #D96B0B 100%)',
                  color: 'white', fontWeight: 700, fontSize: '0.9rem', border: 'none', borderRadius: '10px',
                  cursor: isLogging ? 'not-allowed' : 'pointer', marginTop: '4px',
                  boxShadow: isLogging ? 'none' : '0 4px 14px rgba(245,130,32,0.35)',
                }}
              >
                {isLogging ? 'Authenticating...' : 'Sign In to Dashboard'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {error && (
                <div style={{
                  background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#7F1D1D',
                  padding: '10px 14px', borderRadius: '8px', fontSize: '0.81rem', fontWeight: 500,
                }}>
                  {error}
                </div>
              )}

              {successMsg && (
                <div style={{
                  background: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46',
                  padding: '10px 14px', borderRadius: '8px', fontSize: '0.81rem', fontWeight: 500,
                }}>
                  {successMsg}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0A1F3D' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alexander Vance"
                  style={{ padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '0.83rem' }}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0A1F3D' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alex.vance@naxcuure.com"
                  style={{ padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '0.83rem' }}
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0A1F3D' }}>Create Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  style={{ padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '0.83rem' }}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0A1F3D' }}>Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Engineer"
                    style={{ padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '0.83rem' }}
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0A1F3D' }}>Primary Role</label>
                  <select
                    style={{ padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '0.83rem' }}
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="USER">Standard User</option>
                    <option value="DH">Department Head</option>
                    <option value="INVENTORY_HEAD">Inventory Manager</option>
                    <option value="PURCHASE_MANAGER">Purchase Manager</option>
                    <option value="QA_QC">QA/QC Manager</option>
                    <option value="MAINTENANCE_HEAD">Maintenance Head</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLogging}
                style={{
                  width: '100%', padding: '12px',
                  background: isLogging ? '#94A3B8' : 'linear-gradient(135deg, #1A56DB 0%, #0D2B5E 100%)',
                  color: 'white', fontWeight: 700, fontSize: '0.9rem', border: 'none', borderRadius: '10px',
                  cursor: isLogging ? 'not-allowed' : 'pointer', marginTop: '6px',
                  boxShadow: isLogging ? 'none' : '0 4px 14px rgba(26,86,219,0.35)',
                }}
              >
                {isLogging ? 'Creating Profile...' : 'Register & Create Account'}
              </button>
            </form>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '1px' }}>QUICK ACCESS</span>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
          </div>

          {/* Quick Profiles Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {allUsers.slice(0, 9).map((usr) => {
              const primaryRole = usr.roles.split(',')[0];
              const color = getRoleColor(usr.roles);
              const initials = usr.fullName.split(' ').map(n => n[0]).join('').substring(0, 2);
              return (
                <div
                  key={usr.employeeCode}
                  id={`quick-login-${usr.employeeCode}`}
                  onClick={() => handleQuickLogin(usr.employeeCode)}
                  className="quick-profile-card"
                  style={{
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '10px 8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: 'white',
                    textAlign: 'center',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = color;
                    el.style.background = `${color}12`;
                    el.style.transform = 'translateY(-2px)';
                    el.style.boxShadow = `0 6px 16px ${color}20`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = '#E2E8F0';
                    el.style.background = 'white';
                    el.style.transform = 'translateY(0)';
                    el.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px',
                    borderRadius: '50%',
                    background: `${color}20`,
                    border: `2px solid ${color}40`,
                    color: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.72rem',
                    margin: '0 auto 6px',
                  }}>{initials}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#0F172A', lineHeight: 1.2, marginBottom: '3px' }}>
                    {usr.fullName.split(' ')[0]} {usr.fullName.split(' ')[1]?.[0]}.
                  </div>
                  <div style={{
                    fontSize: '0.6rem', color: color,
                    fontWeight: 700, letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}>{primaryRole.replace('_', ' ')}</div>
                </div>
              );
            })}
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94A3B8' }}>
            Demo system — any password accepted with valid email
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes floatA {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(20px) scale(0.95); }
        }
        @keyframes floatC {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(-20px); }
        }
        @media (min-width: 900px) {
          .login-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
