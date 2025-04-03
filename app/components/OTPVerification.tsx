import React, { useState, useEffect } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface OTPVerificationProps {
  email: string;
  onResendOTP: () => void;
}

const OTPVerification = ({ email, onResendOTP }: OTPVerificationProps) => {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes countdown

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerifyOTP = async () => {
    if (isLoading || otp.length !== 6) return;
    setIsLoading(true);

    try {
      // Verify OTP directly first
      const verifyResponse = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyResponse.ok && verifyData.success) {
        // If verification is successful, then sign in
        const result = await signIn("credentials", {
          email,
          otp,
          verified: "true",
          userId: verifyData.userId,
          redirect: false,
        });

        if (result?.error) {
          toast.error(result.error || "Authentication failed");
          setOtp("");
        } else {
          toast.success("Verification successful");
          router.replace("/talents/my-profile");
        }
      } else {
        toast.error(verifyData.error || "Invalid verification code");
        setOtp("");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (isLoading) return;
    setTimeLeft(120);
    setOtp("");
    onResendOTP();
  };

  const handleOTPComplete = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    setOtp(digitsOnly);

    if (digitsOnly.length === 6) {
      handleVerifyOTP();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digitsOnly = pastedData.replace(/\D/g, "").slice(0, 6);
    setOtp(digitsOnly);
  };

  return (
    <div
      className="flex flex-col items-center w-full max-w-md mx-auto bg-white rounded-2xl p-8"
      style={{
        boxShadow: "rgba(0, 0, 0, 0.08) 0px 0px 0px .5px",
      }}
    >
      <div className="w-full text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Check Your Email
        </h2>
        <p className="text-gray-600 text-lg mb-1">
          We've sent a verification code to
        </p>
        <p className="text-gray-900 font-semibold text-lg">{email}</p>
      </div>

      <div className="w-full mb-10">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={handleOTPComplete}
          onPaste={handlePaste}
          className="gap-3 flex justify-center"
          containerClassName="group flex items-center has-[:disabled]:opacity-30"
        >
          <InputOTPGroup className="gap-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className={`w-[54px] h-[64px] text-2xl font-bold 
                  bg-gray-50/50 border-2 
                  ${
                    otp[index]
                      ? "border-[#FFC905] bg-white text-gray-900 shadow-sm"
                      : "border-gray-200 text-gray-900"
                  }
                  focus:border-[#FFC905] focus:ring-2 focus:ring-[#FFC905] focus:ring-opacity-50 
                  hover:border-gray-300 
                  transition-all duration-200 ease-in-out
                  ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                  transform hover:scale-105 active:scale-95
                  `}
                style={{
                  borderTopLeftRadius: index === 0 ? "10px" : "5px",
                  borderBottomLeftRadius: index === 0 ? "10px" : "5px",
                  borderTopRightRadius: index === 5 ? "10px" : "5px",
                  borderBottomRightRadius: index === 5 ? "10px" : "5px",
                }}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="w-full flex flex-col items-center gap-5">
        {timeLeft > 0 ? (
          <div className="flex items-center gap-2 text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">
              Resend code in {formatTime(timeLeft)}
            </span>
          </div>
        ) : (
          <button
            onClick={handleResendOTP}
            className="text-[#FF8C05] hover:text-[#FFC905] font-medium transition-all duration-200 
              flex items-center gap-2 px-4 py-2 rounded-full hover:bg-orange-50"
            disabled={isLoading}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Resend Code
          </button>
        )}

        <button
          onClick={handleVerifyOTP}
          disabled={isLoading || otp.length !== 6}
          className={`w-full py-4 px-6 text-base font-semibold rounded-xl transition-all duration-300 
            transform hover:scale-[1.02] active:scale-[0.98]
            ${
              isLoading || otp.length !== 6
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#FFC905] text-gray-800 hover:bg-[#FFD935] shadow-md hover:shadow-lg"
            }
          `}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-gray-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Verifying...
            </div>
          ) : (
            "Verify Code"
          )}
        </button>
      </div>

      <p className="mt-8 text-sm text-gray-500 text-center">
        Didn't receive the code?{" "}
        <button
          onClick={() => window.location.reload()}
          className="text-[#FFC905] hover:text-[#FFC905] font-medium transition-colors duration-200 
            hover:underline focus:outline-none"
        >
          Try a different email
        </button>
      </p>
    </div>
  );
};

export default OTPVerification;
