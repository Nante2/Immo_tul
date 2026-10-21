import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Navigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';
import { usePageTitle } from "../../hooks/usePageTitle";

const Login = () => {
  usePageTitle("Connexion admin");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, login, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Après connexion, retour à la page admin demandée au départ
  const redirectTo = location.state?.from?.startsWith('/admin') && location.state.from !== '/admin/login'
    ? location.state.from
    : '/admin/dashboard';

  // Déjà connecté : pas besoin de repasser par le formulaire
  if (user) return <Navigate to={redirectTo} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Erreur de connexion');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-[#0a2540] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-white">
            Immo<span className="text-accent">Tuléar</span>
          </Link>
          <p className="text-slate-400 text-sm mt-2">Espace d'administration</p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Lock size={18} className="text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Connexion</h1>
          </div>

          {sessionExpired && !error && (
            <div role="status" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
              Votre session a expiré. Veuillez vous reconnecter.
            </div>
          )}
          {error && (
            <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-slate-700">Mot de passe</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2.5 pr-11 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              {submitting ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <Link to="/" className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          Retour au site
        </Link>
      </div>
    </div>
  );
};

export default Login;
