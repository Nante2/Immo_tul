import { useState, useEffect, useCallback } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getContacts } from '../../services/api';
import { FeedbackProvider } from '../../context/FeedbackContext';
import { LayoutDashboard, Home, LogOut, Mail, Menu, X, ExternalLink, Users, UserCircle } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Tableau de bord', title: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/admin/properties', label: 'Propriétés', title: 'Gestion des propriétés', icon: Home },
  { to: '/admin/messages', label: 'Messages', title: 'Messages des visiteurs', icon: Mail, showUnread: true },
  { to: '/admin/team', label: 'Équipe', title: "Gestion de l'équipe", icon: Users, adminOnly: true },
];
const ACCOUNT_ITEM = { to: '/admin/account', title: 'Mon compte' };

const ROLE_LABELS = { admin: 'Administrateur', agent: 'Agent' };

const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

const AdminLayout = () => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Ferme le menu latéral mobile à chaque changement de page
  const [lastPath, setLastPath] = useState(location.pathname);
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname);
    setSidebarOpen(false);
  }

  const refreshUnread = useCallback(() => {
    getContacts({ status: 'new', limit: 1 })
      .then((data) => setUnread(data.pagination?.total || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshUnread();
    // Vérifie régulièrement l'arrivée de nouveaux messages
    const interval = setInterval(refreshUnread, 60000);
    return () => clearInterval(interval);
  }, [user, refreshUnread]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  const isAdmin = user.role === 'admin';
  const navItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
  // Un agent qui ouvre une page réservée est renvoyé au tableau de bord
  const restricted = NAV_ITEMS.find((item) => item.adminOnly && location.pathname.startsWith(item.to));
  if (restricted && !isAdmin) return <Navigate to="/admin/dashboard" replace />;

  const isActive = (path) =>
    location.pathname === path || (path === '/admin/dashboard' && location.pathname === '/admin');
  const current = [...NAV_ITEMS, ACCOUNT_ITEM].find((item) => isActive(item.to));

  return (
    <FeedbackProvider>
    <div className="flex min-h-screen bg-slate-50">
      {/* Fond assombri derrière le menu mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-start justify-between">
          <Link to="/admin/dashboard" className="text-xl font-bold">
            Immo<span className="text-accent">Tuléar</span>
            <span className="block text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400 mt-1">Administration</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white" aria-label="Fermer le menu">
            <X size={22} />
          </button>
        </div>
        <nav className="mt-2 flex-1 px-4 space-y-1" aria-label="Navigation admin">
          {navItems.map(({ to, label, icon: Icon, showUnread }) => (
            <Link
              key={to}
              to={to}
              aria-current={isActive(to) ? 'page' : undefined}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isActive(to) ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              {label}
              {showUnread && unread > 0 && (
                <span className="ml-auto min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center" aria-label={`${unread} non lu(s)`}>
                  {unread}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Compte connecté */}
        <div className="p-4 border-t border-slate-800 space-y-1">
          <Link
            to={ACCOUNT_ITEM.to}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
              isActive(ACCOUNT_ITEM.to) ? 'bg-slate-800' : 'hover:bg-slate-800'
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold">
              {initials(user.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block text-xs text-slate-400">{ROLE_LABELS[user.role] || user.role}</span>
            </span>
            <UserCircle size={18} className="ml-auto text-slate-500" />
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-sm border-b px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden relative p-1 text-slate-700"
              aria-label="Ouvrir le menu"
            >
              <Menu size={24} />
              {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500" />}
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">{current?.title || ''}</h1>
          </div>
          <Link to="/" className="shrink-0 flex items-center gap-1 text-sm text-blue-600 hover:underline" target="_blank">
            <span className="hidden sm:inline">Voir le site web</span>
            <ExternalLink size={16} />
          </Link>
        </header>
        <div className="p-4 sm:p-8 max-w-7xl">
          <Outlet context={{ refreshUnread }} />
        </div>
      </main>
    </div>
    </FeedbackProvider>
  );
};

export default AdminLayout;
