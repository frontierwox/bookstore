import React, { createContext, useState, useCallback, useContext } from 'react';

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken'));
  const [loading, setLoading] = useState(false);

  const adminLogin = useCallback(async (email, password) => {
    setLoading(true);
    try {
      // API call logic would go here
      // const response = await api.post('/admin/login', { email, password });
      // const { token, user } = response.data;
      // setAdminToken(token);
      // setAdminUser(user);
      // localStorage.setItem('adminToken', token);
      return { success: true };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const adminLogout = useCallback(() => {
    setAdminUser(null);
    setAdminToken(null);
    localStorage.removeItem('adminToken');
  }, []);

  const value = {
    adminUser,
    adminToken,
    loading,
    adminLogin,
    adminLogout,
    isAdminAuthenticated: !!adminToken
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
