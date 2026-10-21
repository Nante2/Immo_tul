import { useState, useEffect, useRef } from 'react';
import { createProperty, updateProperty, uploadImages, getImageUrl } from '../../services/api';
import { X, ImagePlus, Trash2, Star } from 'lucide-react';
import { useFeedback } from '../../context/FeedbackContext';

const MAX_UPLOAD = 5; // limite du serveur par envoi
const MAX_IMAGES = 15;

const EMPTY_FORM = {
  titre: '',
  description: '',
  prix: '',
  priceNumeric: '',
  type: 'Maison',
  location: '',
  beds: '',
  baths: '',
  area: '',
  status: 'available',
  actionType: 'sale',
  featuresText: '',
  detailsText: '',
};

const safeParse = (data, fallback) => {
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return fallback; }
  }
  return data || fallback;
};

// Prix affiché déduit du prix numérique : 1200000 -> "1 200 000 Ar" (+ " / mois" en location)
const formatPrice = (value, actionType) => {
  if (value === '' || value == null) return '';
  const amount = new Intl.NumberFormat('fr-FR').format(Number(value)).replace(/ | /g, ' ');
  return `${amount} Ar${actionType === 'rent' ? ' / mois' : ''}`;
};

const inputClass = 'w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500';

const Field = ({ label, htmlFor, hint, className = '', children }) => (
  <div className={className}>
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    {children}
    {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
  </div>
);

const PropertyFormModal = ({ isOpen, onClose, property, duplicateFrom, onSave }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]); // { file, url }
  const [priceTouched, setPriceTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { confirm } = useFeedback();
  // État initial du formulaire, pour détecter les modifications non enregistrées
  const [snapshot, setSnapshot] = useState('');

  // Réinitialise le formulaire à chaque ouverture (création ou modification)
  const [openedFor, setOpenedFor] = useState(null);
  // Source du pré-remplissage : le bien modifié, ou le bien dupliqué (enregistré comme nouveau)
  const source = property || duplicateFrom;
  const openKey = isOpen
    ? property ? `edit-${property.id}` : duplicateFrom ? `dup-${duplicateFrom.id}` : 'new'
    : null;
  if (openKey !== openedFor) {
    setOpenedFor(openKey);
    if (isOpen) {
      if (source) {
        const feats = safeParse(source.features, []);
        const dets = safeParse(source.details, {});
        setFormData({
          titre: duplicateFrom ? `${source.titre} (copie)` : source.titre || '',
          description: source.description || '',
          prix: source.prix || '',
          priceNumeric: source.priceNumeric ?? '',
          type: source.type || 'Maison',
          location: source.location || '',
          beds: source.beds ?? '',
          baths: source.baths ?? '',
          area: source.area || '',
          status: duplicateFrom ? 'available' : source.status || 'available',
          actionType: source.actionType || 'sale',
          featuresText: feats.join(', '),
          detailsText: Object.entries(dets).map(([k, v]) => `${k}: ${v}`).join(', '),
        });
        const imgs = safeParse(source.images, []);
        setExistingImages(imgs.length > 0 ? imgs : source.image ? [source.image] : []);
        setPriceTouched(true);
      } else {
        setFormData(EMPTY_FORM);
        setExistingImages([]);
        setPriceTouched(false);
      }
      setNewFiles((prev) => {
        prev.forEach((f) => URL.revokeObjectURL(f.url));
        return [];
      });
      setError(null);
      setSnapshot('');
    }
  }

  // Le premier rendu après ouverture fixe la référence « non modifié »
  const currentState = JSON.stringify({ formData, existingImages, newFiles: newFiles.length });
  if (isOpen && snapshot === '') setSnapshot(currentState);
  const isDirty = isOpen && snapshot !== '' && snapshot !== currentState;

  const confirmingRef = useRef(false);
  const requestClose = async () => {
    if (loading || confirmingRef.current) return;
    if (isDirty) {
      confirmingRef.current = true;
      const ok = await confirm({
        title: 'Abandonner les modifications ?',
        message: 'Les changements apportés à ce bien ne seront pas enregistrés.',
        confirmLabel: 'Abandonner',
        danger: true,
      });
      confirmingRef.current = false;
      if (!ok) return;
    }
    onClose();
  };

  // Libère les aperçus d'images restants quand le composant disparaît
  const newFilesRef = useRef(newFiles);
  useEffect(() => { newFilesRef.current = newFiles; }, [newFiles]);
  useEffect(() => () => newFilesRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  // Échap ferme la fenêtre (sauf pendant l'enregistrement)
  const requestCloseRef = useRef(requestClose);
  useEffect(() => { requestCloseRef.current = requestClose; });
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && requestCloseRef.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'prix') setPriceTouched(true);
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: name === 'priceNumeric' || name === 'beds' || name === 'baths'
          ? (value === '' ? '' : Number(value))
          : value,
      };
      // Tant que le prix affiché n'a pas été saisi à la main, il suit le prix numérique
      if (!priceTouched && (name === 'priceNumeric' || name === 'actionType')) {
        next.prix = formatPrice(next.priceNumeric, next.actionType);
      }
      return next;
    });
  };

  const totalImages = existingImages.length + newFiles.length;

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';
    const room = Math.min(MAX_UPLOAD - newFiles.length, MAX_IMAGES - totalImages);
    if (selected.length > room) {
      setError(`Vous pouvez ajouter ${MAX_UPLOAD} nouvelles photos maximum par enregistrement (${MAX_IMAGES} au total).`);
    } else {
      setError(null);
    }
    const accepted = selected.slice(0, Math.max(room, 0)).map((file) => ({ file, url: URL.createObjectURL(file) }));
    setNewFiles((prev) => [...prev, ...accepted]);
  };

  const removeExisting = (index) => setExistingImages((prev) => prev.filter((_, i) => i !== index));
  const makeCover = (index) => setExistingImages((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);
  const removeNew = (index) => setNewFiles((prev) => {
    URL.revokeObjectURL(prev[index].url);
    return prev.filter((_, i) => i !== index);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { featuresText, detailsText, ...finalData } = formData;

      finalData.features = featuresText
        ? featuresText.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      finalData.details = {};
      if (detailsText) {
        detailsText.split(',').forEach((pair) => {
          const [k, ...rest] = pair.split(':');
          const v = rest.join(':');
          if (k && v) finalData.details[k.trim()] = v.trim();
        });
      }

      // Les nouvelles photos s'ajoutent à celles conservées
      let uploaded = [];
      if (newFiles.length > 0) {
        const result = await uploadImages(newFiles.map((f) => f.file));
        uploaded = result.files || [];
      }
      finalData.images = [...existingImages, ...uploaded];
      finalData.image = finalData.images[0] || '';

      if (property) {
        await updateProperty(property.id, finalData);
      } else {
        await createProperty(finalData);
      }
      onSave(Boolean(property));
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={requestClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="property-form-title"
        className="bg-white rounded-lg w-full max-w-2xl my-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 id="property-form-title" className="text-xl font-semibold">
            {property ? 'Modifier la propriété' : duplicateFrom ? 'Dupliquer la propriété' : 'Ajouter une propriété'}
          </h2>
          <button onClick={requestClose} disabled={loading} aria-label="Fermer" className="text-slate-500 hover:text-slate-700">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div role="alert" className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-200">
              {error}
            </div>
          )}

          {/* Photos */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="block text-sm font-medium text-slate-700">Photos ({totalImages})</span>
              <span className="text-xs text-slate-500">La première photo sert de couverture</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {existingImages.map((img, i) => (
                <div key={`e-${img}`} className="group relative aspect-square rounded-lg overflow-hidden border bg-slate-100">
                  <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">Couverture</span>
                  )}
                  <div className="absolute top-1 right-1 flex gap-1">
                    {i > 0 && (
                      <button type="button" onClick={() => makeCover(i)} title="Utiliser comme couverture" aria-label="Utiliser comme couverture" className="rounded bg-white/90 p-1 text-slate-700 shadow hover:bg-white">
                        <Star size={14} />
                      </button>
                    )}
                    <button type="button" onClick={() => removeExisting(i)} title="Retirer la photo" aria-label="Retirer la photo" className="rounded bg-white/90 p-1 text-red-600 shadow hover:bg-white">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {newFiles.map((f, i) => (
                <div key={f.url} className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-blue-300 bg-slate-100">
                  <img src={f.url} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">Nouvelle</span>
                  <button type="button" onClick={() => removeNew(i)} title="Retirer la photo" aria-label="Retirer la photo" className="absolute top-1 right-1 rounded bg-white/90 p-1 text-red-600 shadow hover:bg-white">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {totalImages < MAX_IMAGES && newFiles.length < MAX_UPLOAD && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  <ImagePlus size={22} />
                  <span className="text-xs font-medium">Ajouter</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Titre" htmlFor="pf-titre" className="md:col-span-2">
              <input id="pf-titre" type="text" name="titre" value={formData.titre} onChange={handleChange} required className={inputClass} />
            </Field>

            <Field label="Description" htmlFor="pf-description" className="md:col-span-2">
              <textarea id="pf-description" name="description" value={formData.description} onChange={handleChange} required rows={4} className={inputClass} />
            </Field>

            <Field label="Action" htmlFor="pf-action">
              <select id="pf-action" name="actionType" value={formData.actionType} onChange={handleChange} className={inputClass}>
                <option value="sale">À vendre</option>
                <option value="rent">À louer</option>
              </select>
            </Field>

            <Field label="Type de bien" htmlFor="pf-type">
              <select id="pf-type" name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                <option value="Maison">Maison</option>
                <option value="Villa">Villa</option>
                <option value="Appartement">Appartement</option>
                <option value="Terrain">Terrain</option>
              </select>
            </Field>

            <Field label="Prix (en Ariary)" htmlFor="pf-price-num" hint="Sert au tri et aux filtres de prix">
              <input id="pf-price-num" type="number" min="0" name="priceNumeric" value={formData.priceNumeric} onChange={handleChange} required className={inputClass} />
            </Field>

            <Field label="Prix affiché" htmlFor="pf-prix" hint={priceTouched ? 'Texte libre' : 'Rempli automatiquement, modifiable'}>
              <input id="pf-prix" type="text" name="prix" value={formData.prix} onChange={handleChange} required placeholder="ex: 1 200 000 Ar" className={inputClass} />
            </Field>

            <Field label="Localisation" htmlFor="pf-location" hint="Quartier, Ville (ex: Ankiembe, Toliara)">
              <input id="pf-location" type="text" name="location" value={formData.location} onChange={handleChange} required className={inputClass} />
            </Field>

            <Field label="Surface" htmlFor="pf-area" hint="ex: 120 m²">
              <input id="pf-area" type="text" name="area" value={formData.area} onChange={handleChange} required className={inputClass} />
            </Field>

            <Field label="Chambres" htmlFor="pf-beds">
              <input id="pf-beds" type="number" min="0" name="beds" value={formData.beds} onChange={handleChange} className={inputClass} />
            </Field>

            <Field label="Salles de bain" htmlFor="pf-baths">
              <input id="pf-baths" type="number" min="0" name="baths" value={formData.baths} onChange={handleChange} className={inputClass} />
            </Field>

            <Field label="Statut" htmlFor="pf-status" className="md:col-span-2">
              <select id="pf-status" name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                <option value="available">Disponible</option>
                <option value="reserved">Réservé</option>
                <option value="sold">Vendu / Loué</option>
              </select>
            </Field>

            <Field label="Caractéristiques" htmlFor="pf-features" hint="Séparées par des virgules (ex: Jardin, Piscine, Garage)" className="md:col-span-2">
              <textarea id="pf-features" name="featuresText" value={formData.featuresText} onChange={handleChange} rows={2} className={inputClass} />
            </Field>

            <Field label="Détails" htmlFor="pf-details" hint="Clé: Valeur, séparés par des virgules (ex: Surface terrain: 300 m², Année: 2020)" className="md:col-span-2">
              <textarea id="pf-details" name="detailsText" value={formData.detailsText} onChange={handleChange} rows={2} className={inputClass} />
            </Field>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button type="button" onClick={requestClose} disabled={loading} className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {loading && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              {loading ? (newFiles.length > 0 ? 'Envoi des photos...' : 'Enregistrement...') : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyFormModal;
