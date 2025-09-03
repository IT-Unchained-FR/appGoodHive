import Modal from "@components/modal";
// PopupModal component removed - will be replaced with Thirdweb integration
const PopupModal = () => null;

interface JobModalsProps {
  isManageFundsModalOpen: boolean;
  handleManageFundsModalClose: () => void;
  handlePopupModal: (type: string) => void;
  jobData: any;
  isPopupModalOpen: boolean;
  handlePopupModalClose: () => void;
  popupModalType: string;
  onPopupModalSubmit: (amount: number, type: string) => void;
  selectedCurrency: any;
}

export const JobModals = ({
  isManageFundsModalOpen,
  handleManageFundsModalClose,
  handlePopupModal,
  jobData,
  isPopupModalOpen,
  handlePopupModalClose,
  popupModalType,
  onPopupModalSubmit,
  selectedCurrency,
}: JobModalsProps) => {
  return (
    <>
      <Modal
        open={isManageFundsModalOpen}
        onClose={handleManageFundsModalClose}
      >
        <div className="flex justify-between p-5 min-w-[300px]">
          <h3 className="text-2xl font-semibold text-black">Manage Funds:</h3>
          <button
            type="button"
            onClick={handleManageFundsModalClose}
            className="w-6 h-6 text-black bg-gray-400 rounded-full"
          >
            &#10005;
          </button>
        </div>
        <p className="px-5 mt-2 mb-3 font-base">{`Funds will primarily be allocated to cover the Protocol's Fees.`}</p>
        <div className="flex flex-col p-5 justify-center items-center">
          {!!jobData?.job_id && (
            <button
              className="my-2 text-base font-semibold bg-transparent border-2 border-[#FFC905] h-14 w-56 rounded-full transition duration-150 ease-in-out"
              type="button"
              onClick={() => handlePopupModal("addFunds")}
            >
              Provision Funds
            </button>
          )}
          {!!jobData?.job_id && !!jobData?.escrowAmount && (
            <button
              className="my-2 text-base font-semibold bg-transparent border-2 border-[#FFC905] h-14 w-56 rounded-full transition duration-150 ease-in-out"
              type="button"
              onClick={() => handlePopupModal("withdraw")}
            >
              Withdraw Funds
            </button>
          )}

          {!!jobData?.job_id && !!jobData?.escrowAmount && (
            <button
              className="my-2 text-base font-semibold bg-transparent border-2 border-[#FFC905] h-14 w-56 rounded-full transition duration-150 ease-in-out"
              type="button"
              onClick={() => handlePopupModal("transfer")}
            >
              Pay Now
            </button>
          )}
        </div>
      </Modal>
      <PopupModal
        open={isPopupModalOpen}
        onClose={handlePopupModalClose}
        jobId={jobData?.job_id}
        type={popupModalType}
        onSubmit={onPopupModalSubmit}
        currencyToken={selectedCurrency?.value ?? ""}
        currencyLabel={selectedCurrency?.label ?? ""}
      />
    </>
  );
};
