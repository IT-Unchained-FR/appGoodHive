import { getAccount, getPortfolio, useOkto } from "@okto_web3/react-sdk";
import { Check, Copy, Wallet } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

// Placeholder avatar (rocket emoji)
const avatar = "🚀";

export interface WalletPopupProps {
  isOpen: boolean;
  anchorRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
}

export const WalletPopup: React.FC<WalletPopupProps> = ({ isOpen, anchorRef, onClose }) => {
  const oktoClient = useOkto();
  const [loading, setLoading] = useState(false);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");

  const POLYGON_CAIP2_ID = "eip155:137";


  useEffect(() => {
    const fetchUserWallet = async () => {
      if (!oktoClient) return;

      try {
        const accounts = await getAccount(oktoClient);
        console.log(accounts, "accounts...goodhive");
        const polygonAccount = accounts.find(
          (account: any) => account.caipId === POLYGON_CAIP2_ID,
        );
        if (polygonAccount) {
          setWalletAddress(polygonAccount?.address);
        } else {
          toast.error("No wallet found for Polygon network");
        }
      } catch (error: any) {
        console.error("Error fetching user wallet:", error);
        toast.error(`Failed to fetch wallet address: ${error.message}`);
      }
    };

    fetchUserWallet();
  }, [oktoClient]);
  useEffect(() => {
    if (isOpen && walletAddress) {
      setLoading(true);
      setError(null);
      getPortfolio(oktoClient, walletAddress)
        .then((data: any) => {
          setPortfolio(data);
          setLoading(false);
        })
        .catch((err: unknown) => {
          setError("Failed to fetch portfolio");
          setLoading(false);
        });
    }
  }, [isOpen, walletAddress, oktoClient]);

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 1500);
    }
  };

  if (!isOpen) return null;

  // Extract USD balance and coins from portfolio
  const balance = portfolio?.aggregatedData?.totalHoldingPriceUsdt
    ? `$${Number(portfolio.aggregatedData.totalHoldingPriceUsdt).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : "$0.00";

  // Default coins to show when no portfolio data is available
  const defaultCoins = [
    {
      icon: "https://www.dextools.io/resources/tokens/logos/3/ether/0x455e53cbb86018ac2b8092fdcd39d8444affc3f6.png?1698233684",
      name: "POL",
      symbol: "POL",
      network: "POLYGON",
      balance: "0",
      valueUsd: "0",
    },
    {
      icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/18852.png",
      name: "Bridged USD Coin",
      symbol: "USDC.e",
      network: "POLYGON",
      balance: "0",
      valueUsd: "0",
    }
  ];

  const coins = Array.isArray(portfolio?.groupTokens) && portfolio.groupTokens.length > 0
    ? portfolio.groupTokens.map((token: any) => ({
      icon: token.tokenImage,
      name: token.name,
      symbol: token.symbol,
      network: token.networkName,
      balance: token.balance,
      valueUsd: token.holdingsPriceUsdt,
    }))
    : defaultCoins;

  return (
    <div
      className="absolute top-full right-0 mt-4 z-50 min-w-[340px] max-w-[95vw] bg-white rounded-2xl border border-[#FFC905] shadow-2xl p-0"
      ref={anchorRef}
      style={{
        boxShadow: "0 8px 32px 0 rgba(255, 201, 5, 0.18)",
        right: "-24px", // move a bit to the left
      }}
    >
      {/* Arrow */}
      <div className="absolute -top-2 right-10 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white"></div>
      <div className="p-6 pb-4 flex flex-col items-center min-h-[320px]">
        {/* Wallet header */}
        <div className="flex items-center gap-3 w-full">
          <span className="w-10 h-10 rounded-full flex items-center justify-center text-2xl bg-[#ffeabf] border border-[#FFC905]">{avatar}</span>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-semibold text-gray-900 text-base leading-tight">My GoodHive Wallet</span>
            <span className="text-xs text-gray-400 font-mono truncate">{walletAddress}</span>
          </div>
          <button className="ml-auto p-1 rounded-full hover:bg-[#FFF7D1] transition" onClick={onClose} aria-label="Close wallet popup">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="#FFC905" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center w-full min-h-[180px]">
            <svg className="animate-spin h-10 w-10 text-[#FFC905]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#FFC905" strokeWidth="4"></circle>
              <path className="opacity-75" fill="#FFC905" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center w-full min-h-[180px] text-red-500 font-semibold">{error}</div>
        ) : (
          <>
            {/* Balance */}
            <div className="mt-6 mb-2 text-center w-full">
              <div className="text-[#A6A6A6] text-sm font-medium">Wallet Balance</div>
              <div className="text-4xl font-extrabold text-gray-900">{balance}</div>
            </div>

            {/* Wallet Address Section */}
            <div className="w-full mt-4 mb-2">
              <div className="bg-[#FFF7D1] rounded-xl p-3 border border-[#FFC905]/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">Wallet Address</span>
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-[#FFC905]/20 transition"
                    onClick={handleCopyAddress}
                    aria-label="Copy address"
                    disabled={!walletAddress}
                  >
                    {copiedAddress ? (
                      <Check size={14} className="text-green-500 transition-transform scale-110" />
                    ) : (
                      <Copy size={14} className="text-gray-500 hover:text-[#FFC905] transition-transform" />
                    )}
                  </button>
                </div>
                <div className="text-xs font-mono text-gray-600 break-all">
                  {walletAddress || "No wallet address available"}
                </div>
                <div className="mt-2 text-xs text-gray-500 leading-relaxed">
                  This is your default GoodHive wallet address. You can start transactions immediately upon account creation.
                </div>
              </div>
            </div>

            {/* Actions */}
            {/* <div className="flex gap-3 w-full mt-2 mb-4">
              <button className="flex-1 py-2 rounded-xl bg-white border border-[#FFC905] text-gray-900 font-semibold flex items-center justify-center gap-2 hover:bg-[#FFF7D1] transition">
                <span className="inline-block"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" stroke="#FFC905" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                Send
              </button>
              <button className="flex-1 py-2 rounded-xl bg-[#FFC905] text-black font-semibold flex items-center justify-center gap-2 hover:bg-[#FF8C05] transition">
                <span className="inline-block"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 3v18m9-9H3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                Activity
              </button>
            </div> */}

            {/* Coins */}
            <div className="w-full mt-2">
              <div className="text-sm font-semibold text-gray-900 mb-2">Coins</div>
              <div className="flex flex-col gap-2">
                {coins.map((coin: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#FFF7D1] transition">
                    {coin.icon ? (
                      <img src={coin.icon} alt={coin.symbol} className="w-8 h-8 rounded-full border border-[#FFC905] bg-[#FFF7D1] object-contain" />
                    ) : (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FFF7D1] border border-[#FFC905]">
                        <Wallet size={18} color="#FFC905" />
                      </span>
                    )}
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium text-gray-900 text-sm truncate">{coin.name} <span className="text-xs text-gray-400 font-mono">({coin.symbol})</span></span>
                      <span className="text-xs text-gray-400 truncate">
                        {Number(coin.balance) === 0 ? "No balance" : `${Number(coin.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${coin.symbol}`}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-gray-900 text-sm">
                        ${Number(coin.valueUsd).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 