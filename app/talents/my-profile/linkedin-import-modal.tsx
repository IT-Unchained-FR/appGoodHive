import { Linkedin, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface LinkedInImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (data: any) => void;
}

// Define styles
const styles = {
  modalOverlay:
    "fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] animate-fadeIn",
  modalContent:
    "bg-white rounded-2xl shadow-lg w-[500px] max-w-[90vw] max-h-[90vh] overflow-y-auto animate-slideDown transition-shadow duration-300 hover:shadow-xl",
  modalHeader:
    "flex items-center justify-between px-6 py-5 border-b border-gray-100",
  modalTitle: "flex items-center text-xl font-semibold text-gray-800 m-0",
  linkedinIcon: "text-[#0077b5] mr-2.5 text-2xl",
  closeButton:
    "bg-transparent border-none text-gray-500 text-2xl cursor-pointer flex items-center justify-center p-1.5 rounded-full hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed",
  modalBody: "p-6",
  modalDescription: "mt-0 mb-5 text-gray-600 leading-relaxed",
  form: "flex flex-col gap-5",
  inputGroup: "relative flex flex-col",
  label: "text-sm font-medium mb-2 text-gray-700 ml-1",
  input:
    "pl-32 pr-4 py-3 border-2 border-[#FFC905] rounded-full text-base transition-all duration-200 focus:outline-none focus:border-[#FF8C05] focus:shadow-[0_0_0_2px_rgba(255,140,5,0.2)] hover:shadow-md disabled:bg-gray-50 disabled:cursor-not-allowed",
  inputPrefix:
    "absolute left-4 top-[42px] text-base text-gray-500 pointer-events-none",
  buttonGroup: "flex justify-end gap-3 mt-6 sm:flex-col",
  cancelButton:
    "px-5 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed sm:w-full",
  submitButton:
    "px-6 py-2.5 border-none bg-[#FFC905] text-gray-800 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:bg-[#FF8C05] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:shadow-[0_0_0_2px_rgba(255,140,5,0.3)] sm:w-full",
  spinner: "animate-spin",
};

// Define keyframe animations
const keyframes = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

export const LinkedInImportModal = ({
  isOpen,
  onClose,
  onImportSuccess,
}: LinkedInImportModalProps) => {
  const [username, setUsername] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    // Add animations stylesheet once
    if (!document.getElementById("linkedin-modal-animations")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "linkedin-modal-animations";
      styleSheet.textContent = keyframes;
      document.head.appendChild(styleSheet);
    }

    // Add event listener for clicking outside
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  const handleLinkedInImport = async (username: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/linkedin-import?username=${encodeURIComponent(username)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to import LinkedIn profile",
        );
      }

      const data = await response.json();
      console.log("Bright Data LinkedIn JSON:", data);
      if (onImportSuccess) {
        onImportSuccess(data);
      }
    } catch (error) {
      console.error("Error importing LinkedIn profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      handleLinkedInImport(username.trim());
    }
  };

  // Only render on client-side
  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className={styles.modalOverlay}>
      <div ref={modalRef} className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <Linkedin className={styles.linkedinIcon} />
            Import LinkedIn Profile
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close modal"
          >
            <X />
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.modalDescription}>
            Enter your LinkedIn username to import your profile data. This will
            help pre-fill your profile information.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="linkedin-username" className={styles.label}>
                LinkedIn Username
              </label>
              <input
                id="linkedin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                className={styles.input}
                disabled={isLoading}
                required
              />
              <span className={styles.inputPrefix}>linkedin.com/in/</span>
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelButton}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading || !username.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className={styles.spinner} />
                    Importing...
                  </>
                ) : (
                  "Import Profile"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
};
