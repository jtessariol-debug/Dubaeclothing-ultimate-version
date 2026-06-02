import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/', label: 'Products', end: true },
  { to: '/orders', label: 'Orders' },
  { to: '/reviews', label: 'Reviews' },
];

export function AdminSidebar() {
  return (
    <aside className="w-full border-b border-slate-800 bg-slate-950/90 px-4 py-4 backdrop-blur md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-sky-400">Dubae</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Admin Panel</h1>
      </div>

      <nav className="flex gap-2 md:flex-col">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                'rounded-2xl px-4 py-3 text-sm font-medium transition',
                isActive ? 'bg-sky-500 text-slate-950' : 'text-slate-300 hover:bg-slate-900 hover:text-white',
              ].join(' ')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-flex rounded-2xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
      >
        View site
      </a>
    </aside>
  );
}
