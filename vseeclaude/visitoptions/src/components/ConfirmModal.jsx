export default function ConfirmModal({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onCancel} aria-label="Close">&times;</button>
        </div>
        <div className="modal-content">
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{message}</p>
        </div>
        <div className="modal-actions">
          <button onClick={onCancel} className="btn btn-ghost btn-sm">Cancel</button>
          <button onClick={onConfirm} className="btn btn-danger btn-sm">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
