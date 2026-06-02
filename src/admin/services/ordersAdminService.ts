import { supabase } from './supabaseClient';
import type { OrderRecord } from '../types';

const ORDERS_TABLE = 'orders';

export async function getOrders() {
  const { data, error } = await supabase.from(ORDERS_TABLE).select('*').order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as OrderRecord[];
}
