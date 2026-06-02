import { useEffect, useState } from 'react';
import { getAdminSession, isSupabaseAdminSession } from '../services/localAdminAuth';
import { supabase } from '../services/supabaseClient';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      const session = await getAdminSession();
      if (!active) {
        return;
      }
      setIsAdmin(isSupabaseAdminSession(session));
      setLoading(false);
    };

    void syncSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Admin session:', session);
      console.log('Admin email:', session?.user?.email);
      if (!active) {
        return;
      }
      setIsAdmin(isSupabaseAdminSession(session));
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    loading,
    isAdmin,
  };
}
