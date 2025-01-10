"use client";

import { Button } from "@components/button";
import React, { useState, useContext } from "react";
import toast from "react-hot-toast";
import { AddressContext } from "@components/context";
import { MessageBoxModal } from "@components/message-box-modal";
import Cookies from "js-cookie";

interface Props {
  toEmail: string;
  toUserName: string;
}

export const CompanyContactBtn = ({ toEmail, toUserName }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPopupModal, setIsPopupModal] = useState(false);
  const user_id = Cookies.get("user_id");

  const onContactMeBtnClickHandler = async () => {
    setIsLoading(true);
    const userDataResponse = await fetch(
      `/api/talents/my-profile?user_id=${user_id}`,
    );

    if (!userDataResponse.ok) {
      setIsLoading(false);
      toast.error("You don't have a talent profile yet! Please create one.");
    }

    const userProfile = await userDataResponse.json();
    if (!userProfile.approved) {
      setIsLoading(false);
      toast.error(
        "Only verified talent can contact company! Please wait for your profile to be verified.",
      );
      return;
    } else {
      setIsPopupModal(true);
    }
  };

  const onPopupModalCloseHandler = () => {
    setIsPopupModal(false);
    setIsLoading(false);
  };

  const onSubmitHandler = async (message: string) => {
    if (!message) {
      toast.error("Please complete the form!");
      return;
    }
    if (!user_id) {
      toast.error("Please login to your account first!");
      return;
    }
    try {
      setIsPopupModal(false);
      const userDataResponse = await fetch(
        `/api/talents/my-profile?user_id=${user_id}`,
      );

      if (!userDataResponse.ok) {
        throw new Error(`HTTP error! status: ${userDataResponse.status}`);
      }

      const userProfile = await userDataResponse.json();
      const response = await fetch("/api/send-email", {
        method: "POST",
        body: JSON.stringify({
          name: userProfile?.first_name,
          toUserName: toUserName,
          email: toEmail,
          type: "contact-company",
          subject: `Goodhive - ${userProfile?.first_name} send you a message`,
          userEmail: userProfile?.email,
          message,
          userProfile: `${window.location.origin}/talents/${user_id}`,
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
      {isPopupModal && (
        <MessageBoxModal
          title="Write your message:"
          messageLengthLimit={30}
          onSubmit={onSubmitHandler}
          onClose={onPopupModalCloseHandler}
        />
      )}
    </div>
  );
};
