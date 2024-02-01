import React, { FC, useState } from "react";
import { Button } from "./button";
import ReCAPTCHA from "react-google-recaptcha";

interface Props {
  title: string;
  messageLengthLimit: number;
  onSubmit: (coverLetter: string) => void;
  onClose: () => void;
}

export const MessageBoxModal: FC<Props> = (props) => {
  const { title, messageLengthLimit, onClose, onSubmit } = props;
  const [message, setMessage] = useState("");
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);

  const googleSiteKey = process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY || "";
  
  const onChange = (value: any) => {
    if (value) {
      setIsCaptchaValid(true);
    } else {
      setIsCaptchaValid(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const onClickSubmitHandler = () => {
    if (message.length < messageLengthLimit) {
      alert(`Must be at least ${messageLengthLimit} characters!`);
      return;
    } else if (!isCaptchaValid) { 
      alert(`Please complete the captcha!`);
      return;
    }
    onSubmit(message);
  };
  return (
    <div
      className="fixed z-50 inset-0 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <div className="flex flex-col items-center min-w-[400px] bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:min-w-[350px]">
          <div className="w-full bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="mt-3 text-center sm:mt-0 sm:text-left">
              <h4
                className="text-lg mb-5 font-medium text-gray-900"
                id="modal-title"
              >
                {title}
              </h4>

              <textarea
                className="w-full h-40 p-5 mt-2  border border-gray-300 rounded-md"
                placeholder="Enter your cover letter here"
                onChange={handleChange}
              ></textarea>
              <p className="text-left mt-2 text-sm text-gray-500">{`minimum ${messageLengthLimit} characters *`}</p>
            </div>
          </div>
          <ReCAPTCHA sitekey={googleSiteKey} onChange={onChange} />
          <div className="w-full flex justify-end px-4 py-2 mb-4 sm:px-6 sm:flex sm:flex-row-reverse">
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
