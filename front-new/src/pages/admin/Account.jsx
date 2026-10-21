import { useState } from 'react';
import { Eye, EyeOff, Save, KeyRound, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { updateMe } from '../../services/api';
import { usePageTitle } from '../../hooks/usePageTitle';

const inputClass = 'w-full rounded-lg border px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30';
const ROLE_LABELS = { admin: 'Administrateur', agent: 'Agent' };

const PasswordInput = ({ id, value, onChange, autoComplete, ...props }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className={`${inputClass} pr-11`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

const Account = () => {
  usePageTitle('Admin · Mon compte');
  const { user, setUser } = useAuth();
  const { toast } = useFeedback();

  const [profile, setProfile] = useState({ name: user.name, email: user.email, currentPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', password: '', confirm: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const emailChanged = profile.email.trim() !== user.email;
  const profileChanged = profile.name.trim() !== user.name || emailChanged;

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = { name: profile.name.trim() };
      if (emailChanged) {
        payload.email = profile.email.trim();
        payload.currentPassword = profile.currentPassword;
      }
      const updated = await updateMe(payload);
      setUser((prev) => ({ ...prev, ...updated }));
      setProfile((p) => ({ ...p, currentPassword: '' }));
      toast('Profil mis à jour');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (passwords.password.length < 6) {
      setPasswordError('Le nouveau mot de passe doit faire au moins 6 caractères.');
      return;
    }
    if (passwords.password !== passwords.confirm) {
      setPasswordError('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }
    setSavingPassword(true);
    try {
      await updateMe({ password: passwords.password, currentPassword: passwords.currentPassword });
      setPasswords({ currentPassword: '', password: '', confirm: '' });
      toast('Mot de passe modifié');
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-5xl">
      {/* Profil */}
      <form onSubmit={saveProfile} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <UserRound size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Profil</h2>
            <p className="text-xs text-slate-500">Rôle : {ROLE_LABELS[user.role] || user.role}</p>
          </div>
        </div>
        <div>
          <label htmlFor="acc-name" className="mb-1.5 block text-sm font-medium text-slate-700">Nom</label>
          <input id="acc-name" required autoComplete="name" className={inputClass} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
        </div>
        <div>
          <label htmlFor="acc-email" className="mb-1.5 block text-sm font-medium text-slate-700">Email de connexion</label>
          <input id="acc-email" type="email" required autoComplete="email" className={inputClass} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
        </div>
        {emailChanged && (
          <div>
            <label htmlFor="acc-email-pwd" className="mb-1.5 block text-sm font-medium text-slate-700">Mot de passe actuel</label>
            <PasswordInput
              id="acc-email-pwd"
              required
              autoComplete="current-password"
              value={profile.currentPassword}
              onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
            />
            <p className="text-xs text-slate-500 mt-1">Requis pour changer l'email de connexion.</p>
          </div>
        )}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!profileChanged || savingProfile}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={16} />
            {savingProfile ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>

      {/* Mot de passe */}
      <form onSubmit={savePassword} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <KeyRound size={18} className="text-amber-600" />
          </div>
          <h2 className="font-semibold text-slate-800">Changer le mot de passe</h2>
        </div>
        {passwordError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{passwordError}</div>
        )}
        <div>
          <label htmlFor="acc-cur" className="mb-1.5 block text-sm font-medium text-slate-700">Mot de passe actuel</label>
          <PasswordInput id="acc-cur" required autoComplete="current-password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
        </div>
        <div>
          <label htmlFor="acc-new" className="mb-1.5 block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
          <PasswordInput id="acc-new" required minLength={6} autoComplete="new-password" value={passwords.password} onChange={(e) => setPasswords({ ...passwords, password: e.target.value })} />
          <p className="text-xs text-slate-500 mt-1">6 caractères minimum.</p>
        </div>
        <div>
          <label htmlFor="acc-confirm" className="mb-1.5 block text-sm font-medium text-slate-700">Confirmer le nouveau mot de passe</label>
          <PasswordInput id="acc-confirm" required autoComplete="new-password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingPassword}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
          >
            <KeyRound size={16} />
            {savingPassword ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Account;
