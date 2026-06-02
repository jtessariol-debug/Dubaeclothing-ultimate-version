import { useEffect, useMemo, useState } from 'react';
import { getOrders } from '../services/ordersAdminService';
import type { OrderRecord } from '../types';

export function OrdersManager() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getOrders()
      .then((data) => {
        if (active) {
          setOrders(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load orders.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + Number(order.total || 0), 0), [orders]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-sky-400">Orders</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Orders manager</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Live PayPal orders saved in Supabase with customer details and purchased products.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-sm text-slate-400">Total orders</p>
          <p className="mt-4 text-4xl font-semibold text-white">{orders.length}</p>
        </section>
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-sm text-slate-400">Revenue</p>
          <p className="mt-4 text-4xl font-semibold text-white">${totalRevenue.toFixed(2)}</p>
        </section>
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-sm text-slate-400">Status</p>
          <p className="mt-4 text-lg font-medium text-white">{loading ? 'Loading orders' : 'Connected'}</p>
        </section>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-slate-300">Loading orders...</div>
      ) : null}

      {!loading && !orders.length ? (
        <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center text-slate-400">
          No orders found yet.
        </div>
      ) : null}

      {!loading && orders.length ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-sky-400">{order.status}</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">{order.customer_name}</h2>
                  <p className="mt-2 text-sm text-slate-400">{order.customer_phone}</p>
                  <p className="mt-1 text-sm text-slate-400">{order.customer_address}</p>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-2xl font-semibold text-white">${Number(order.total || 0).toFixed(2)}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{order.currency}</p>
                  <p className="mt-2 text-xs text-slate-500">{new Date(order.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Purchased items</p>
                  <div className="mt-3 space-y-2">
                    {order.items.map((item, index) => (
                      <div key={`${order.id}-${index}`} className="flex justify-between gap-3 text-sm text-slate-200">
                        <span>
                          {item.name}
                          {item.size ? ` / ${item.size}` : ''}
                          {` x${item.qty}`}
                        </span>
                        <span>${Number(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Payment details</p>
                  <p className="mt-3">Source: {order.payment_source ?? 'paypal'}</p>
                  <p className="mt-1">Mode: {order.payment_mode ?? 'cart'}</p>
                  <p className="mt-1 break-all">PayPal order: {order.paypal_order_id ?? 'N/A'}</p>
                  <p className="mt-1 break-all">Capture: {order.paypal_capture_id ?? 'N/A'}</p>
                </section>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
