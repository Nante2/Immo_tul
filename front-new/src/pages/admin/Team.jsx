import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Trash2, ShieldCheck, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { getUsers, createUser, deleteUser } from '../../services/api';
import { usePageTitle } from '../../hooks/usePageTitle';

const inputClass = 'w-full rounded-lg border px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30';

const ROLES = {
  admin: { label: 'Administrateur', icon: ShieldCheck, className: 'bg-blue-50 text-blue-700', description: 'Accès complet, y compris la suppression et la gestion de l\'équipe' },
  agent: { label: 'Agent', icon: User, className: 'bg-slate-100 text-slate-700', description: 'Ajoute et modifie les biens, traite les messages' },
};

const EMPTY_FORM = { name: '', email: '', password: '', role: 'agent' };

const formatDate = (date) =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));

const Team = () => {
  usePageTitle("Admin · Équipe");
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setUsers(await getUsers());
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createUser({ ...form, name: form.name.trim(), email: form.email.trim() });
      toast(`Compte créé pour ${form.name.trim()}`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.message.includes('existe déjà') ? 'Un compte utilise déjà cet email.' : err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (member) => {
    const ok = await confirm({
      title: 'Supprimer ce compte ?',
      message: `${member.name} (${member.email}) ne pourra plus se connecter à l'administration.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteUser(member.id);
      toast('Compte supprimé');
      fetchUsers();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-sm text-slate-600">
          Les personnes ci-dessous peuvent se connecter à l'administration du site.
        </p>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus size={18} />
            Ajouter un membre
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border p-6 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Nouveau membre</h2>
            <button type="button" onClick={() => { setShowForm(false); setFormError(''); }} aria-label="Fermer" className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          {formError && (
            <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="t-name" className="mb-1.5 block text-sm font-medium text-slate-700">Nom</label>
              <input id="t-name" required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="t-email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input id="t-email" type="email" required autoComplete="off" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label htmlFor="t-password" className="mb-1.5 block text-sm font-medium text-slate-700">Mot de passe provisoire</label>
              <input id="t-password" type="text" required minLength={6} autoComplete="new-password" className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <p className="text-xs text-slate-500 mt-1">6 caractères minimum. La personne pourra le changer dans « Mon compte ».</p>
            </div>
            <fieldset>
              <legend className="mb-1.5 block text-sm font-medium text-slate-700">Rôle</legend>
              <div className="space-y-2">
                {Object.entries(ROLES).map(([value, role]) => (
                  <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${form.role === value ? 'border-blue-500 bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                    <input type="radio" name="role" value={value} checked={form.role === value} onChange={() => setForm({ ...form, role: value })} className="mt-0.5" />
                    <span>
                      <span className="block text-sm font-medium text-slate-800">{role.label}</span>
                      <span className="block text-xs text-slate-500">{role.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => { setShowForm(false); setFormError(''); }} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
              <UserPlus size={16} />
              {saving ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement de l'équipe...</div>
        ) : (
          <ul className="divide-y">
            {users.map((member) => {
              const role = ROLES[member.role] || ROLES.agent;
              const RoleIcon = role.icon;
              const isMe = member.id === user.id;
              return (
                <li key={member.id} className="flex flex-wrap items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 truncate">
                      {member.name}
                      {isMe && <span className="ml-2 text-xs font-normal text-slate-500">(vous)</span>}
                    </p>
                    <p className="text-sm text-slate-500 truncate">{member.email}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${role.className}`}>
                    <RoleIcon size={14} />
                    {role.label}
                  </span>
                  <span className="hidden sm:block whitespace-nowrap text-right text-xs text-slate-400">Depuis le {formatDate(member.createdAt)}</span>
                  <button
                    onClick={() => handleDelete(member)}
                    disabled={isMe}
                    title={isMe ? 'Vous ne pouvez pas supprimer votre propre compte' : `Supprimer ${member.name}`}
                    aria-label={`Supprimer ${member.name}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                  >
                    <Trash2 size={17} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Team;
