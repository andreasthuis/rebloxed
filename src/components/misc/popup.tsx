interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function LauncherModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  onConfirm,
  onCancel,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay popup-overlay">
      <div className="modal-content popup-content">
        <div className="popup-header">
          <div className="warning-icon">!</div>
          <h2 className="popup-title">{title}</h2>
          <div className="warning-icon">!</div>
        </div>

        <div className="popup-message">
          <p>{message}</p>
        </div>

        <div className="action-buttons popup-buttons">
          <button className="btn-secondary popup-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary popup-button" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LauncherModal;
