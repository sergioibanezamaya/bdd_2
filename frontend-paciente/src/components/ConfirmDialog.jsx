/**
 * components/ConfirmDialog.jsx — Modal genérico de confirmación
 *
 * Props:
 *   - open: boolean
 *   - title: string
 *   - message: string (puede incluir JSX)
 *   - confirmText, cancelText
 *   - onConfirm, onCancel
 *   - variant: 'primary' | 'danger' (default 'primary')
 */
import React from 'react';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'primary',
}) {
  if (!open) return null;
  const btnClass = variant === 'danger' ? 'btn btn-danger' : 'btn btn-primary';
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p className="muted">{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className={btnClass} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}