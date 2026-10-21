import { useState, useEffect, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Mail, Phone, Trash2, Reply, MailOpen, Inbox, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { getContacts, getContactById, updateContactStatus, deleteContact } from '../../services/api';
import { useFeedback } from '../../context/FeedbackContext';
import { usePageTitle } from "../../hooks/usePageTitle";

const FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'new', label: 'Nouveaux' },
  { value: 'read', label: 'Lus' },
  { value: 'replied', label: 'Répondus' },
];

const STATUS_STYLES = {
  new: { label: 'Nouveau', className: 'bg-blue-100 text-blue-700' },
  read: { label: 'Lu', className: 'bg-slate-100 text-slate-600' },
  replied: { label: 'Répondu', className: 'bg-green-100 text-green-700' },
};

const formatDate = (date) =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(date));

const Messages = () => {
  usePageTitle("Admin · Messages");
  const { refreshUnread } = useOutletContext() || {};
  const { toast, confirm } = useFeedback();
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ contacts: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  const fetchContacts = useCallback(async () => {
    try {
      const result = await getContacts({ status: filter, page, limit: 15 });
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const changeFilter = (value) => {
    setFilter(value);
    setPage(1);
    setLoading(true);
  };

  const openMessage = async (contact) => {
    setSelected(contact);
    if (contact.status === 'new') {
      try {
        // La lecture du détail marque le message comme lu côté serveur
        const full = await getContactById(contact.id);
        setSelected((prev) => (prev?.id === full.id ? { ...prev, status: full.status } : prev));
        setData((prev) => ({
          ...prev,
          contacts: prev.contacts.map((c) => (c.id === full.id ? { ...c, status: full.status } : c)),
        }));
        refreshUnread?.();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const changeStatus = async (contact, status) => {
    try {
      await updateContactStatus(contact.id, status);
      setSelected((prev) => (prev?.id === contact.id ? { ...prev, status } : prev));
      await fetchContacts();
      refreshUnread?.();
      toast(status === 'replied' ? 'Message marqué comme répondu' : status === 'new' ? 'Message marqué comme non lu' : 'Statut mis à jour');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleDelete = async (contact) => {
    const ok = await confirm({
      title: 'Supprimer ce message ?',
      message: `Le message de ${contact.name} sera définitivement supprimé.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteContact(contact.id);
      setSelected(null);
      await fetchContacts();
      refreshUnread?.();
      toast('Message supprimé');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const { contacts, pagination } = data;

  return (
    <div>
      {/* Filtres */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => changeFilter(f.value)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                filter === f.value ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {pagination && <span className="text-sm text-slate-500">{pagination.total} message(s)</span>}
      </div>

      {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Liste */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Chargement des messages...</div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Inbox className="mx-auto mb-2 text-slate-300" size={40} />
              Aucun message.
            </div>
          ) : (
            <ul className="divide-y">
              {contacts.map((c) => {
                const status = STATUS_STYLES[c.status] || STATUS_STYLES.read;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => openMessage(c)}
                      className={`w-full text-left p-4 transition-colors hover:bg-slate-50 ${
                        selected?.id === c.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`truncate ${c.status === 'new' ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {c.name}
                        </span>
                        <span className="text-xs text-slate-400 shrink-0">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-600 truncate">{c.subject}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>{status.label}</span>
                        {c.property && <span className="text-xs text-slate-400 truncate">{c.property.titre}</span>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between p-3 border-t text-sm">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1 px-2 py-1 rounded disabled:opacity-40 hover:bg-slate-100"
              >
                <ChevronLeft size={16} /> Précédent
              </button>
              <span className="text-slate-500">Page {page} / {pagination.pages}</span>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 px-2 py-1 rounded disabled:opacity-40 hover:bg-slate-100"
              >
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Détail */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border p-6">
          {!selected ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400">
              <Mail size={48} className="mb-3 text-slate-300" />
              Sélectionnez un message pour l'afficher
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selected.subject}</h2>
                  <p className="text-sm text-slate-500 mt-1">Reçu le {formatDate(selected.createdAt)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${(STATUS_STYLES[selected.status] || STATUS_STYLES.read).className}`}>
                  {(STATUS_STYLES[selected.status] || STATUS_STYLES.read).label}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-6 p-4 bg-slate-50 rounded">
                <div>
                  <p className="text-xs text-slate-500">Nom</p>
                  <p className="font-medium text-slate-800">{selected.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <a href={`mailto:${selected.email}`} className="font-medium text-blue-600 hover:underline break-all">{selected.email}</a>
                </div>
                {selected.phone && (
                  <div>
                    <p className="text-xs text-slate-500">Téléphone</p>
                    <a href={`tel:${selected.phone}`} className="font-medium text-blue-600 hover:underline flex items-center gap-1">
                      <Phone size={14} /> {selected.phone}
                    </a>
                  </div>
                )}
                {selected.property && (
                  <div>
                    <p className="text-xs text-slate-500">Bien concerné</p>
                    <Link to={`/property/${selected.property.id}`} target="_blank" className="font-medium text-blue-600 hover:underline flex items-center gap-1">
                      {selected.property.titre} <ExternalLink size={14} />
                    </Link>
                  </div>
                )}
              </div>

              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed mb-8">{selected.message}</p>

              <div className="flex flex-wrap gap-3 pt-6 border-t">
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                  onClick={() => selected.status !== 'replied' && changeStatus(selected, 'replied')}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  <Reply size={16} /> Répondre par email
                </a>
                {selected.status !== 'replied' && (
                  <button
                    onClick={() => changeStatus(selected, 'replied')}
                    className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-slate-50 transition-colors text-sm"
                  >
                    Marquer comme répondu
                  </button>
                )}
                {selected.status !== 'new' && (
                  <button
                    onClick={() => changeStatus(selected, 'new')}
                    className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-slate-50 transition-colors text-sm"
                  >
                    <MailOpen size={16} /> Marquer non lu
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selected)}
                  className="flex items-center gap-2 text-red-600 border border-red-200 px-4 py-2 rounded hover:bg-red-50 transition-colors text-sm ml-auto"
                >
                  <Trash2 size={16} /> Supprimer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
