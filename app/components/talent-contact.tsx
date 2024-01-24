"use client";

import { Button } from "@components/button";
import React, { useState, useContext } from "react";
import toast from "react-hot-toast";
import { AddressContext } from "@components/context";
import { MessageBoxModal } from "@components/message-box-modal";

interface Props {
  toEmail: string;
}

export const TalentContact = ({ toEmail }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCoverLetterModal, setIsCoverLetterModal] = useState(false);
  const userWalletAddress = useContext(AddressContext);

  const onContactMeBtnClickHandler = () => {
    setIsCoverLetterModal(true);
  };

  const onCoverLetterModalCloseHandler = () => {
    setIsCoverLetterModal(false);
  };

  const onSubmitHandler = async (message: string) => {
    if (!message) {
      toast.error("Please complete the form!");
      return;
    }
    if (!userWalletAddress) {
      toast.error("Please connect your wallet first!");
      return;
    }
    try {
      setIsLoading(true);
      setIsCoverLetterModal(false);
      const userDataResponse = await fetch(
        `/api/companies/my-profile?walletAddress=${userWalletAddress}`
      );

      if (!userDataResponse.ok) {
        toast.error("You don't have a company profile yet! Please create one.");
        return;
      }

      const userProfile = await userDataResponse.json();
      if(userProfile.status !== "approved") {
        toast.error("Only verified company can contact talent! Please wait for your company to be verified.");
        return;
      }
      const response = await fetch("/api/send-email", {
        method: "POST",
        body: JSON.stringify({
          name: userProfile?.designation,
          email: toEmail,
          type: "contact-talent",
          subject: `Goodhive - ${userProfile?.designation} interested in your profile`,
          userEmail: userProfile?.email,
          message,
          userProfile: `${window.location.origin}/companies/${userWalletAddress}`,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Something went wrong!");
      } else {
        setIsLoading(false);
        toast.success("Message sent successfully!");
      }
    } catch (error) {
      setIsLoading(false);
      toast.error("Something went wrong!");
    }
  };

  return (
    <div className="flex w-full justify-center gap-5 mb-12">
      <Button
        onClickHandler={onContactMeBtnClickHandler}
        text="Contact"
        type="secondary"
        size="medium"
        loading={isLoading}
      ></Button>
      {isCoverLetterModal && (
        <MessageBoxModal
          title="Describe why would you like to hire this talent?"
          messageLengthLimit={50}
          onSubmit={onSubmitHandler}
          onClose={onCoverLetterModalCloseHandler}
        />
      )}
    </div>
  );
};
