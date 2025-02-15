import React, { useContext, useState } from "react";
import { toast } from "react-hot-toast";

import { useCreateJob } from "@/app/hooks/create-job";
import { AddressContext } from "@components/context";
import Modal from "@components/modal";
import type { FC } from "react";
import type { AddFundsModalProps } from "./PopupModal.types";
import { generateContent } from "./PopupModal.utils";

export const PopupModal: FC<AddFundsModalProps> = (props) => {
  const [amount, setAmount] = useState<number>(0); // Keep amount as a number
  const [isFullAmount, setIsFullAmount] = useState(false);

  const { jobId, open, onClose, type, onSubmit, currencyToken, currencyLabel } =
    props;

  const { title, description, buttonText } = generateContent(type);
  const walletAddress = useContext(AddressContext);

  const { checkBalanceTx } = useCreateJob({
    walletAddress,
    token: currencyToken,
  });

  const handleProvisionAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    const numericValue = Number(value);

    // Update the state with a valid number, no leading zeroes
    if (!isNaN(numericValue) && numericValue >= 0) {
      setAmount(numericValue);
    }
  };

  const handleSubmit = async () => {
    if (!isFullAmount && amount <= 0) {
      toast.error("Please enter a valid amount!");
      return;
    }

    if (type === "withdraw" || type === "transfer") {
      const contractBalance = await checkBalanceTx(Number(jobId));
      console.log(contractBalance, "contractBalance");
      if (isFullAmount) onSubmit(contractBalance, type);
      else if (contractBalance < amount) {
        toast.error("Insufficient funds!");
        return;
      } else {
        onSubmit(amount, type);
      }
    } else {
      onSubmit(amount, type);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="relative bg-white min-w-[500px] h-full rounded shadow-lg border-0 p-0">
        <div className="flex flex-col items-center justify-center p-5">
          <div className="flex justify-between w-full">
            <h3 className="text-2xl font-semibold text-black">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 text-black bg-gray-400 rounded-full"
            >
              &#10005;
            </button>
          </div>
          <div className="flex flex-col items-center justify-center mt-5">
            <p className="mb-3 text-base font-normal text-gray-600">
              {description}
            </p>
            <div className="flex flex-col items-center justify-center mt-5">
              {!isFullAmount && (
                <input
                  className="w-fit form-control block px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  type="number"
                  name="amount"
                  maxLength={100}
                  placeholder={`Enter amount in ${currencyLabel}`}
                  onChange={handleProvisionAmountChange}
                  value={amount === 0 ? "" : amount} // Display empty string for initial 0 value
                  disabled={isFullAmount}
                />
              )}
              {type === "withdraw" || type === "transfer" ? (
                <div className="mb-3 flex items-center justify-center mt-2">
                  <input
                    className="form-checkbox h-5 w-5 text-gray-600"
                    type="checkbox"
                    id="fullAmount"
                    name="amount"
                    title="Full Amount"
                    onChange={() => setIsFullAmount(!isFullAmount)}
                  />
                  <label
                    className="ml-2 text-base font-normal text-gray-600"
                    htmlFor="fullAmount"
                  >
                    Full Amount
                  </label>
                </div>
              ) : null}

              <button
                className="my-4 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                type="button"
                onClick={handleSubmit}
              >
                {buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
