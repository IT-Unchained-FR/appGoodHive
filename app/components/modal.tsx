import { useRef, ReactNode, useEffect } from "react";

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

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 w-full h-full bg-black bg-opacity-30 flex items-center justify-center ${
        open ? "block" : "hidden"
      }`}
      onClick={handleOutsideClick}
    >
      <dialog
        ref={dialogRef}
        className="relative bg-white rounded shadow-lg border-0 p-0 max-h-[80%] max-w-[80%]"
      >
        {children}
      </dialog>
    </div>
  );
};

export default Modal;