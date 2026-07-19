'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  employeeCode: string;
  userCode: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  plant: string;
  departmentCode: string;
  designation: string;
  reportingManager: string | null;
  status: string;
  roles: string; // Comma-separated roles
  joiningDate: string;
  approvalLimit: number;
  profilePhoto: string | null;
  remarks: string | null;
}

export interface AppNotification {
  id: string;
  employeeCode: string;
  title: string;
  message: string;
  isRead: boolean;
  timestamp: string;
}

interface AppContextType {
  currentUser: UserProfile | null;
  activeRole: string;
  rolesList: string[];
  allUsers: UserProfile[];
  notifications: AppNotification[];
  switchRole: (role: string) => void;
  loginAsUser: (employeeCode: string) => void;
  addNotification: (title: string, message: string, targetEmployeeCode?: string) => void;
  markNotificationAsRead: (id: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<string>('USER');
  const [rolesList, setRolesList] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load initial session on mount
  useEffect(() => {
    async function initSession() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        const users = data.users || [];
        setAllUsers(users);

        const savedUserCode = localStorage.getItem('nax_user_code');
        const savedActiveRole = localStorage.getItem('nax_active_role');

        if (savedUserCode && users.length > 0) {
          const user = users.find((u: UserProfile) => u.employeeCode === savedUserCode) || users[0];
          setCurrentUser(user);
          const userRoles = user.roles.split(',');
          setRolesList(userRoles);
          
          if (savedActiveRole && userRoles.includes(savedActiveRole)) {
            setActiveRole(savedActiveRole);
          } else {
            setActiveRole(userRoles[0]);
          }
        } else if (users.length > 0) {
          // Default to first user if none saved
          const defaultUser = users[0];
          setCurrentUser(defaultUser);
          const userRoles = defaultUser.roles.split(',');
          setRolesList(userRoles);
          setActiveRole(userRoles[0]);
        }
      } catch (err) {
        console.error('Failed to load users for session:', err);
      }

      // Seed initial demo notifications
      setNotifications([
        {
          id: 'n-1',
          employeeCode: 'ALL',
          title: 'System Online',
          message: 'NAXCUURE ERP connected to backend successfully.',
          isRead: false,
          timestamp: new Date().toISOString()
        }
      ]);

      setIsLoading(false);
    }
    initSession();
  }, []);

  const loginAsUser = (employeeCode: string) => {
    setIsLoading(true);
    const user = allUsers.find((u) => u.employeeCode === employeeCode);
    if (user) {
      setCurrentUser(user);
      const userRoles = user.roles.split(',');
      setRolesList(userRoles);
      setActiveRole(userRoles[0]);
      localStorage.setItem('nax_user_code', user.employeeCode);
      localStorage.setItem('nax_active_role', userRoles[0]);
    }
    setIsLoading(false);
  };

  const switchRole = (role: string) => {
    if (rolesList.includes(role)) {
      setActiveRole(role);
      localStorage.setItem('nax_active_role', role);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveRole('USER');
    setRolesList([]);
    localStorage.removeItem('nax_user_code');
    localStorage.removeItem('nax_active_role');
  };

  const addNotification = (title: string, message: string, targetEmployeeCode?: string) => {
    const newNotif: AppNotification = {
      id: `n-${Date.now()}`,
      employeeCode: targetEmployeeCode || currentUser?.employeeCode || 'ALL',
      title,
      message,
      isRead: false,
      timestamp: new Date().toISOString()
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeRole,
        rolesList,
        allUsers,
        notifications,
        switchRole,
        loginAsUser,
        addNotification,
        markNotificationAsRead,
        logout,
        isLoading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
