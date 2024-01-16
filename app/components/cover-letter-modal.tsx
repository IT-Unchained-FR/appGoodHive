import React, { FC, useState } from "react";
import { Button } from "./button";

interface Props {
  onSubmitHandler: (coverLetter: string) => void;
  onClose: () => void;
}

export const CoverLetterModal: FC<Props> = (props) => {
  const { onClose, onSubmitHandler } = props;
  const [coverLetter, setCoverLetter] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCoverLetter(e.target.value);
  };

  const onClickSubmitHandler = () => {
    if (coverLetter.length < 200) {
      alert("Cover letter must be at least 200 characters");
      return;
    }
    onSubmitHandler(coverLetter);
  };
  return (
    <div
      className="fixed z-10 inset-0 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h4
                  className="text-lg mb-5 font-medium text-gray-900"
                  id="modal-title"
                >
                  Describe who you are and why you are a good fit for this job
                  (200 characters minimum):
                </h4>

                <textarea
                  className="w-full h-40 p-5 mt-2  border border-gray-300 rounded-md"
                  placeholder="Enter your cover letter here"
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
          </div>
          <div className="w-full flex justify-end px-4 py-3 mb-4 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              text="Submit"
              type="primary"
              size="medium"
              onClickHandler={onClickSubmitHandler}
            ></Button>
          </div>
        </div>
      </div>
    </div>
  );
};
