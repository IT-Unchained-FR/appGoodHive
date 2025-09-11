"use client";

import { Button } from "@components/button";
import { MessageBoxModal } from "@components/message-box-modal";
import { Mail, MessageCircle, Sparkles } from "lucide-react";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuthCheck } from "@/app/hooks/useAuthCheck";

interface Props {
  toEmail: string;
  toUserName: string;
}

export const CompanyContactBtn = ({ toEmail, toUserName }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPopupModal, setIsPopupModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { user_id, checkAuthAndShowConnectPrompt } = useAuthCheck();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const onContactMeBtnClickHandler = async () => {
    // Check if user is authenticated first
    if (!checkAuthAndShowConnectPrompt("contact this company")) {
      return;
    }
    
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
      // This should not happen if checkAuthAndShowConnectPrompt passed
      // But keeping as fallback
      checkAuthAndShowConnectPrompt("send a message");
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
    <div className={`w-full space-y-4 ${isVisible ? 'animate-slide-in-up delay-300' : 'opacity-0'}`}>
      {/* Enhanced Contact Button */}
      <div className="relative group">
        <button
          onClick={onContactMeBtnClickHandler}
          disabled={isLoading}
          className="relative w-full px-8 py-4 bg-gradient-to-r from-amber-500 via-[#FFC905] to-yellow-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {/* Background Animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Honey Drip Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-honey-drip"></div>
          
          {/* Button Content */}
          <div className="relative z-10 flex items-center justify-center gap-3">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 group-hover:animate-bounce" />
                <span className="text-lg">Contact Company</span>
                <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
              </>
            )}
          </div>
          
          {/* Floating Bees */}
          <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-80 transition-opacity duration-300">
            <div className="bee-particle animate-float"></div>
          </div>
          <div className="absolute -bottom-1 -left-1 opacity-0 group-hover:opacity-60 transition-opacity duration-500">
            <div className="bee-particle animate-float-slow"></div>
          </div>
        </button>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-2xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300 -z-10"></div>
      </div>
      
      {/* Additional Info */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
          <MessageCircle className="w-4 h-4 text-amber-500" />
          <span>Start a conversation with the hive</span>
          <span className="text-lg">🐝</span>
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          <span>Usually responds within 24 hours</span>
        </div>
      </div>
      
      {/* Enhanced Modal */}
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
