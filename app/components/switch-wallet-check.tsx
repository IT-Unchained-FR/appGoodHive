"use client";

import { useAccount } from "wagmi";
import { FC, useEffect } from "react";
import { toast } from "react-hot-toast";

type Props = {
  walletAddress: string;
  handleWalletChange: () => void;
};

export const SwitchWalletCheck: FC<Props> = (props) => {
  const { address, isConnected } = useAccount();
  const { walletAddress, handleWalletChange } = props;

  useEffect(() => {
    if (isConnected && walletAddress && walletAddress !== address) {
      toast.error("You have switched wallets, please reconnect to continue");
      handleWalletChange();
    }
  }, [address, isConnected, walletAddress]);

  return <></>;
};
