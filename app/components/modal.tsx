import { useRef, ReactNode, useEffect } from "react";
import styles from "./modal.module.scss";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

const Modal = ({ open, onClose, children }: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialogElement = dialogRef.current;
    if (dialogElement) {
      if (open) {
        dialogElement.showModal();
      } else if (dialogElement.open) {
        dialogElement.close();
      }
    }
  }, [open]);

  const handleOverlayClick = () => {
    onClose();
  };

  const overlayClasses = `${styles.modalOverlay} ${
    open ? styles.visible : styles.hidden
  }`;

  const dialogClasses = `${styles.modalDialog} ${
    open ? styles.visible : styles.hidden
  }`;

  return (
    <div
      className={overlayClasses}
      onClick={handleOverlayClick}
    >
      <dialog
        ref={dialogRef}
        className={dialogClasses}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </dialog>
    </div>
  );
};

export default Modal;
