/**
 * components/ConfirmDialog.jsx — Modal de confirmación genérico
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 */
export default function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmClass = 'btn-primary',
}) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        <p>{message}</p>
        <div className="flex-gap mt-2" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onCancel}>{cancelText}</button>
          <button className={`btn ${confirmClass}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}