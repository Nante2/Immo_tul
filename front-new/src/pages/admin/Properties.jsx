import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProperties, deleteProperty, updatePropertyStatus, getImageUrl, PLACEHOLDER_IMAGE } from '../../services/api';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, ExternalLink, Copy, Eye, MessageSquare, Home } from 'lucide-react';
import PropertyFormModal from './PropertyFormModal';
import { useFeedback } from '../../context/FeedbackContext';
import { useAuth } from '../../context/AuthContext';
import { usePageTitle } from "../../hooks/usePageTitle";

const PAGE_SIZE = 20;

const ACTION_TABS = [
  { value: '', label: 'Tous' },
  { value: 'sale', label: 'À vendre' },
  { value: 'rent', label: 'À louer' },
];

const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponible', className: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'reserved', label: 'Réservé', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'sold', label: 'Vendu / Loué', className: 'bg-red-50 text-red-700 border-red-200' },
];

const SORT_OPTIONS = [
  { value: '', label: 'Plus récents' },
  { value: 'price-desc', label: 'Prix décroissant' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'area-desc', label: 'Surface décroissante' },
];

const selectClass = 'py-2 pl-3 pr-8 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';

const handleImageError = (e) => {
  if (!e.currentTarget.src.endsWith(PLACEHOLDER_IMAGE)) e.currentTarget.src = PLACEHOLDER_IMAGE;
};

// Sélecteur de statut coloré, modifiable directement depuis la liste
const StatusSelect = ({ property, onChange, disabled }) => {
  const option = STATUS_OPTIONS.find((o) => o.value === property.status) || STATUS_OPTIONS[0];
  return (
    <select
      value={property.status}
      disabled={disabled}
      onChange={(e) => onChange(property, e.target.value)}
      aria-label={`Statut de ${property.titre}`}
      className={`rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${option.className}`}
    >
      {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
};

const IconButton = ({ label, onClick, href, className = '', children }) => {
  const classes = `inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${className}`;
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" title={label} aria-label={label} className={classes}>{children}</a>
  ) : (
    <button type="button" onClick={onClick} title={label} aria-label={label} className={classes}>{children}</button>
  );
};

const Properties = () => {
  usePageTitle("Admin · Propriétés");
  const { toast, confirm } = useFeedback();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  // Lien « Ajouter un bien » du tableau de bord : ouvre directement le formulaire
  const [modal, setModal] = useState(() => ({ open: searchParams.get('nouveau') === '1', property: null, duplicateFrom: null }));
  useEffect(() => {
    if (searchParams.get('nouveau')) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchProps = useCallback(async () => {
    try {
      const data = await getProperties({ page, limit: PAGE_SIZE, search, actionType, status, sort, withStats: 1 });
      setProperties(data.properties || []);
      setPagination(data.pagination || null);
    } catch (err) {
      toast(err.message || 'Impossible de charger les propriétés', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, actionType, status, sort, toast]);

  useEffect(() => {
    fetchProps();
  }, [fetchProps]);

  // Recherche lancée après une courte pause de frappe
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const openNew = () => setModal({ open: true, property: null, duplicateFrom: null });
  const openEdit = (prop) => setModal({ open: true, property: prop, duplicateFrom: null });
  const openDuplicate = (prop) => setModal({ open: true, property: null, duplicateFrom: prop });
  const closeModal = useCallback(() => setModal((m) => ({ ...m, open: false })), []);

  const handleStatusChange = async (prop, newStatus) => {
    const previous = prop.status;
    setUpdatingId(prop.id);
    // Mise à jour optimiste : l'affichage change tout de suite, on annule en cas d'erreur
    setProperties((list) => list.map((p) => (p.id === prop.id ? { ...p, status: newStatus } : p)));
    try {
      await updatePropertyStatus(prop.id, newStatus);
      const label = STATUS_OPTIONS.find((o) => o.value === newStatus)?.label;
      toast(`« ${prop.titre} » : ${label}`);
    } catch (err) {
      setProperties((list) => list.map((p) => (p.id === prop.id ? { ...p, status: previous } : p)));
      toast(err.message || 'Impossible de changer le statut', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (prop) => {
    const ok = await confirm({
      title: 'Supprimer cette propriété ?',
      message: `« ${prop.titre} » sera définitivement supprimée, ainsi que ses statistiques.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteProperty(prop.id);
      toast('Propriété supprimée');
      // Revient à la page précédente si on vient de vider la dernière
      if (properties.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchProps();
    } catch (err) {
      toast(err.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const handleSaved = (isEdit) => {
    toast(isEdit ? 'Propriété mise à jour' : 'Propriété ajoutée');
    fetchProps();
  };

  const hasFilters = search || actionType || status;

  const renderActions = (prop) => (
    <div className="flex items-center justify-end gap-1">
      <IconButton label="Voir sur le site" href={`/property/${prop.id}`} className="text-slate-500 hover:bg-slate-100 hover:text-slate-800">
        <ExternalLink size={17} />
      </IconButton>
      <IconButton label={`Dupliquer ${prop.titre}`} onClick={() => openDuplicate(prop)} className="text-slate-500 hover:bg-slate-100 hover:text-slate-800">
        <Copy size={17} />
      </IconButton>
      <IconButton label={`Modifier ${prop.titre}`} onClick={() => openEdit(prop)} className="text-blue-600 hover:bg-blue-50">
        <Edit size={17} />
      </IconButton>
      {isAdmin && (
        <IconButton label={`Supprimer ${prop.titre}`} onClick={() => handleDelete(prop)} className="text-red-600 hover:bg-red-50">
          <Trash2 size={17} />
        </IconButton>
      )}
    </div>
  );

  return (
    <div>
      {/* Barre d'outils */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-lg border bg-white p-1" role="tablist" aria-label="Type de transaction">
            {ACTION_TABS.map((tab) => (
              <button
                key={tab.value}
                role="tab"
                aria-selected={actionType === tab.value}
                onClick={() => changeFilter(setActionType)(tab.value)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  actionType === tab.value ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Ajouter une propriété
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher par titre, quartier…"
              aria-label="Rechercher une propriété"
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={status} onChange={(e) => changeFilter(setStatus)(e.target.value)} aria-label="Filtrer par statut" className={selectClass}>
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={sort} onChange={(e) => changeFilter(setSort)(e.target.value)} aria-label="Trier" className={selectClass}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {pagination && (
            <span className="text-sm text-slate-500 whitespace-nowrap">{pagination.total} bien(s)</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="divide-y" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                <div className="h-12 w-16 rounded-lg bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="h-3 w-1/4 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Home className="text-slate-400" />
            </div>
            <p className="font-medium text-slate-700 mb-1">
              {hasFilters ? 'Aucune propriété ne correspond à ces critères' : 'Aucune propriété pour le moment'}
            </p>
            <p className="text-sm text-slate-500 mb-5">
              {hasFilters ? 'Modifiez la recherche ou les filtres.' : 'Ajoutez votre premier bien pour le publier sur le site.'}
            </p>
            {hasFilters ? (
              <button
                onClick={() => { setSearchInput(''); setSearch(''); setActionType(''); setStatus(''); setPage(1); }}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50"
              >
                Réinitialiser les filtres
              </button>
            ) : (
              <button onClick={openNew} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                <Plus size={16} /> Ajouter une propriété
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Tableau (écrans moyens et grands) */}
            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b text-xs uppercase tracking-wide text-slate-500">
                  <th className="p-4 font-semibold">Bien</th>
                  <th className="p-4 font-semibold">Prix</th>
                  <th className="p-4 font-semibold text-center">Activité</th>
                  <th className="p-4 font-semibold">Statut</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((prop) => (
                  <tr key={prop.id} className="border-b last:border-0 hover:bg-slate-50/70">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(prop.image)}
                          alt=""
                          loading="lazy"
                          onError={handleImageError}
                          className="h-12 w-16 shrink-0 rounded-lg object-cover bg-slate-100"
                        />
                        <div className="min-w-0">
                          <button onClick={() => openEdit(prop)} className="block max-w-xs truncate text-left font-medium text-slate-800 hover:text-blue-600">
                            {prop.titre}
                          </button>
                          <p className="text-xs text-slate-500 truncate max-w-xs">
                            {prop.type} · {prop.actionType === 'rent' ? 'Location' : 'Vente'} · {prop.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-700 whitespace-nowrap">{prop.prix}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1" title="Vues"><Eye size={15} className="text-slate-400" />{prop.views ?? 0}</span>
                        <span className="flex items-center gap-1" title="Messages"><MessageSquare size={15} className="text-slate-400" />{prop.contacts ?? 0}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusSelect property={prop} onChange={handleStatusChange} disabled={updatingId === prop.id} />
                    </td>
                    <td className="p-4">{renderActions(prop)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Cartes (mobile) */}
            <ul className="md:hidden divide-y">
              {properties.map((prop) => (
                <li key={prop.id} className="p-4">
                  <div className="flex gap-3">
                    <img
                      src={getImageUrl(prop.image)}
                      alt=""
                      loading="lazy"
                      onError={handleImageError}
                      className="h-16 w-20 shrink-0 rounded-lg object-cover bg-slate-100"
                    />
                    <div className="min-w-0 flex-1">
                      <button onClick={() => openEdit(prop)} className="block w-full truncate text-left font-medium text-slate-800">
                        {prop.titre}
                      </button>
                      <p className="text-xs text-slate-500 truncate">{prop.type} · {prop.location}</p>
                      <p className="text-sm font-semibold text-slate-700 mt-1">{prop.prix}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <StatusSelect property={prop} onChange={handleStatusChange} disabled={updatingId === prop.id} />
                    {renderActions(prop)}
                  </div>
                </li>
              ))}
            </ul>
          </>
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

      <PropertyFormModal
        isOpen={modal.open}
        onClose={closeModal}
        property={modal.property}
        duplicateFrom={modal.duplicateFrom}
        onSave={handleSaved}
      />
    </div>
  );
};

export default Properties;
