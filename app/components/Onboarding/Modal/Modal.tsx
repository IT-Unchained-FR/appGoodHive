import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import "./Modal.css";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      setTimeout(() => {
        setIsVisible(false);
      }, 300);
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <div
      className={`modal-overlay ${isOpen ? "open" : "closing"}`}
      onClick={handleClose}
    >
      <div
        className={`modal-container ${isOpen ? "open" : "closing"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={handleClose} title="Close">
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
