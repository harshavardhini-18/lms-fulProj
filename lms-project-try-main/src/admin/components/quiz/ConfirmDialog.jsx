import React from 'react';

export default function ConfirmDialog({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="aqm-modal-overlay" onClick={onCancel}>
      <div className="aqm-modal aqm-modal--md" onClick={(e) => e.stopPropagation()}>
        <div className="aqm-modal-head">
          <h3>{title}</h3>
          <button className="aqm-icon-btn" onClick={onCancel} aria-label="Close" disabled={busy}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="aqm-modal-body">
          <p className="aqm-confirm-text">{message}</p>
        </div>
        <div className="aqm-modal-foot">
          <button className="aqm-btn aqm-btn--ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            className={isDangerous ? 'aqm-btn aqm-btn--danger' : 'aqm-btn aqm-btn--primary'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
