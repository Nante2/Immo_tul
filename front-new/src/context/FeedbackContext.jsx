import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const FeedbackContext = createContext(null);

// Notifications (toasts) et boîte de confirmation, à la place de alert() / window.confirm()
export const FeedbackProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const toast = useCallback((message, type = 'success') => {
    const id = ++nextId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), type === 'error' ? 6000 : 3500);
  }, [dismiss]);

  // Renvoie une promesse résolue à true (confirmé) ou false (annulé)
  const confirm = useCallback((options) => new Promise((resolve) => {
    setConfirmState({ ...options, resolve });
  }), []);

  const closeConfirm = (result) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`flex items-start gap-3 rounded-lg border bg-white p-4 shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-200 ${
              t.type === 'error' ? 'border-red-200' : 'border-green-200'
            }`}
          >
            {t.type === 'error'
              ? <AlertCircle size={20} className="text-red-600 shrink-0" />
              : <CheckCircle2 size={20} className="text-green-600 shrink-0" />}
            <p className="text-sm text-slate-700 flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} aria-label="Fermer la notification" className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {confirmState && <ConfirmDialog {...confirmState} onClose={closeConfirm} />}
    </FeedbackContext.Provider>
  );
};

const ConfirmDialog = ({ title, message, confirmLabel = 'Confirmer', danger = false, onClose }) => {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150" onClick={() => onClose(false)}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-semibold text-slate-800 mb-2">{title}</h2>
        {message && <p id="confirm-message" className="text-sm text-slate-600 mb-6">{message}</p>}
        <div className="flex justify-end gap-3">
          <button ref={cancelRef} onClick={() => onClose(false)} className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50">
            Annuler
          </button>
          <button
            onClick={() => onClose(true)}
            className={`px-4 py-2 rounded text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const useFeedback = () => useContext(FeedbackContext);
