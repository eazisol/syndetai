import React from 'react';

const ConfirmModal = ({ open, title, description, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2 className="modal-title">{title}</h2>
        {description ? (
          <div className="modal-content" style={{ marginTop: 12 }}>
            {typeof description === 'string' ? (
              <p style={{ color: 'var(--placeholder-color)', textAlign: 'center' }}>{description}</p>
            ) : (
              description
            )}
          </div>
        ) : null}
        <div className="modal-actions">
          <button className="modal-btn modal-btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="modal-btn modal-btn-primary" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;