interface SubmitButtonsProps {
  saveProfileLoading: boolean;
  reviewProfileLoading: boolean;
  onSaveProfile: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onSendForReview: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const SubmitButtons = ({
  saveProfileLoading,
  reviewProfileLoading,
  onSaveProfile,
  onSendForReview,
}: SubmitButtonsProps) => {
  return (
    <div className="mt-10 mb-16 text-center flex gap-4 justify-center">
      <button
        className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
        type="button"
        name="save-talent-only"
        onClick={onSaveProfile}
        disabled={saveProfileLoading}
      >
        {saveProfileLoading ? "Saving Profile..." : "Save Profile"}
      </button>
      <button
        className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
        type="submit"
        name="send-for-review"
        onClick={onSendForReview}
        disabled={reviewProfileLoading}
      >
        {reviewProfileLoading
          ? "Sending Profile To Review..."
          : "Send Profile To Review"}
      </button>
    </div>
  );
};
