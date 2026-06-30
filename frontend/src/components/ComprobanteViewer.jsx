/**
 * components/ComprobanteViewer.jsx — Modal para ver el comprobante de pago
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 */
import { useState } from 'react';

export default function ComprobanteViewer({ base64, mimeType, onClose }) {
  const [zoomed, setZoomed] = useState(false);
  if (!base64) return null;
  const src = `data:${mimeType || 'image/jpeg'};base64,${base64}`;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal comprobante-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 800 }}
      >
        <div className="modal-header">
          <h2>Comprobante de pago</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div style={{ textAlign: 'center', padding: 8, background: '#f5f7fa' }}>
          <img
            src={src}
            alt="comprobante de pago"
            onClick={() => setZoomed((z) => !z)}
            style={{
              maxWidth: '100%',
              maxHeight: zoomed ? 'none' : 480,
              cursor: 'zoom-in',
              borderRadius: 6,
              transition: 'max-height 0.2s',
            }}
          />
        </div>
        <div className="flex-gap mt-2" style={{ justifyContent: 'space-between' }}>
          <small className="muted">
            {zoomed ? 'Click en la imagen para achicarla' : 'Click en la imagen para agrandarla'}
          </small>
          <a
            href={src}
            download={`comprobante-${Date.now()}.${(mimeType || 'image/jpeg').split('/')[1]}`}
            className="btn btn-outline btn-sm"
          >
            ⬇ Descargar
          </a>
        </div>
      </div>
    </div>
  );
}