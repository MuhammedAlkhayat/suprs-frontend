import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

const ICONS = {
  success: <FaCheckCircle color="#10b981" size={18} />,
  error:   <FaTimesCircle color="#ef4444" size={18} />,
  info:    <FaInfoCircle  color="#00d2ff" size={18} />,
  warning: <FaExclamationTriangle color="#f59e0b" size={18} />,
};

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const showToast = useCallback((title, message = '', type = 'info', duration = 4500) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t.slice(-4), { id, title, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={{ showToast, dismiss }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}
            style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px',
              background:'var(--bg-surface)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-lg)',
              minWidth:280, maxWidth:380, pointerEvents:'all',
              animation:'toast-in 0.35s var(--ease-spring)' }}>
            <div style={{ flexShrink:0, marginTop:1 }}>{ICONS[t.type]}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:13, color:'var(--text-primary)', marginBottom:2 }}>{t.title}</div>
              {t.message && <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.4 }}>{t.message}</div>}
            </div>
            <button onClick={() => dismiss(t.id)}
              style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:2, flexShrink:0 }}>
              <FaTimes size={12} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}