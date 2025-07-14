"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface WalletConnectPopupProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
}

export const WalletConnectPopup = ({
  isOpen,
  onClose,
  walletAddress
}: WalletConnectPopupProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Add functionality to connect email with wallet address
    console.log("Connecting email:", email, "with wallet:", walletAddress);

    // For now, just close the popup
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Welcome to GoodHive! 🐝
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            We've created your account with wallet address:
          </p>
          <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
            {walletAddress}
          </p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            To complete your profile and unlock all features, please add your email address:
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? "Connecting..." : "Add Email"}
              </button>
            </div>
          </form>
        </div>

        <div className="text-xs text-gray-500 text-center">
          You can always add this information later in your profile settings.
        </div>
      </div>
    </div>
  );
}; 