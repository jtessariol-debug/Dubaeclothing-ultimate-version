import { useEffect, useState } from 'react';
import { isLocalAdminAuthenticated } from '../services/localAdminAuth';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncSession = () => {
      setIsAdmin(isLocalAdminAuthenticated());
      setLoading(false);
    };

    syncSession();
    window.addEventListener('storage', syncSession);

    return () => {
      window.removeEventListener('storage', syncSession);
    };
  }, []);

  return {
    loading,
    isAdmin,
  };
}
