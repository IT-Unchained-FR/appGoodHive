/* simple react hook template */
import Web3 from "web3";
import { useEffect, useState } from "react";
import GoodHiveContractABI from "@/contracts/GoodhiveJobContract.json";
import { GoodhiveContractAddress } from "@constants/common";
import TokenAbi from "@/contracts/TokenAbi.json";

interface Props {
  walletAddress: string;
  token: string;
}

export const useCreateJob = (props: Props) => {
  const { walletAddress } = props;
  const [web3, setWeb3] = useState<Web3>();
  const [contract, setContract] = useState<any>();

  const handleUpdateEscrowAmount = async (id: number, amount: number) => {
    await fetch(`/api/companies/update-escrow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, escrowAmount: amount }),
    });
  };

  const waitForTransactionReceipt = async (txHash: `0x${string}`) => {
    if (!window.ethereum) return;
    while (true) {
      const receipt = await window.ethereum.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      });
      if (receipt) {
        return receipt;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  const requestApproval = async (amount: number) => {
    const usdcTokenAddress =
      process.env.NEXT_PUBLIC_GOODHIVE_USDC_TOKEN_POLYGON;
    if (!window.ethereum) return "";
    const web3 = new Web3(process.env.NEXT_PUBLIC_GOODHIVE_INFURA_API);
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length === 0) {
      return;
    }
    const contract: any = new web3.eth.Contract(TokenAbi, usdcTokenAddress, {
      from: accounts[0],
    });
    const amountInWei = web3.utils.toWei(amount.toString(), "mwei");

    const tx = contract.methods
      .approve(GoodhiveContractAddress, amountInWei)
      .encodeABI();
    try {
      const receipt = {
        from: accounts[0],
        gas: "21000",
        to: usdcTokenAddress,
        data: tx,
      };

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [receipt as any],
      });

      const txReceipt = await waitForTransactionReceipt(
        txHash as `0x${string}`,
      );

      if (txReceipt && txReceipt.status === "0x1") {
        return true;
      } else {
        throw new Error("Approval failed");
      }
    } catch (error) {
      throw error;
    }
  };

  const createContract = async () => {
    try {
      if (!window.ethereum) {
        return;
      }

      const web3Instance = new Web3(
        process.env.NEXT_PUBLIC_GOODHIVE_INFURA_API,
      );
      const contractInstance = new web3Instance.eth.Contract(
        GoodHiveContractABI,
        GoodhiveContractAddress,
      );

      setWeb3(web3Instance);
      setContract(contractInstance);
    } catch (error) {
      console.error("Error initializing contract:", error);
    }
  };

  const checkBalanceTx = async (jobId: number) => {
    try {
      // Ensure contract is initialized
      if (!contract) {
        await createContract();
      }

      const balance = await contract?.methods
        .checkBalance(Number(jobId))
        .call();

      const balanceInEther = Number(balance) / 1000000;
      return balanceInEther;
    } catch (error) {
      return 0;
    }
  };

  const createJobTx = async (jobId: number, amount: number) => {
    try {
      // Ensure contract is initialized
      if (!contract) {
        await createContract();
      }

      const initialBalance = await checkBalanceTx(jobId);

      if (!window.ethereum) return "";
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      const EndingBalance = Number(initialBalance) + Number(amount);

      // Use the USDC token address from env
      const usdcTokenAddress =
        process.env.NEXT_PUBLIC_GOODHIVE_USDC_TOKEN_POLYGON;

      // First do the approval
      await requestApproval(amount);

      // Create job transaction
      const amountInWei = web3?.utils.toWei(amount.toString(), "mwei");

      // Convert jobId to uint128 as expected by the contract
      const jobIdBigInt = BigInt(jobId);

      const tx = contract.methods
        .createJob(jobIdBigInt, amountInWei, usdcTokenAddress)
        .encodeABI();

      const receipt = {
        from: accounts[0],
        to: GoodhiveContractAddress,
        data: tx,
        gas: "210000",
      };

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [receipt as any],
      });

      const txReceipt = await waitForTransactionReceipt(
        txHash as `0x${string}`,
      );

      if (txReceipt && txReceipt.status === "0x1") {
        await handleUpdateEscrowAmount(jobId, EndingBalance);
        return true;
      } else {
        throw new Error("Transaction failed - check contract interaction");
      }
    } catch (error: any) {
      throw error;
    }
  };

  const withdrawFundsTx = async (jobId: number, amount: number) => {
    try {
      // Ensure contract is initialized
      if (!contract) {
        await createContract();
      }

      if (!window.ethereum) return "";
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length === 0) {
        throw new Error("No account found");
      }

      const amountInWei = web3?.utils.toWei(amount.toString(), "mwei");
      const tx = contract.methods.withdrawFunds(jobId, amountInWei).encodeABI();

      const receipt = {
        from: accounts[0],
        gas: "21000",
        to: GoodhiveContractAddress,
        data: tx,
      };

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [receipt as any],
      });

      await waitForTransactionReceipt(txHash as `0x${string}`);
      const balance = await checkBalanceTx(jobId);
      const EndingBalance = Number(balance) - Number(amount);
      await handleUpdateEscrowAmount(jobId, EndingBalance);

      return txHash;
    } catch (error) {
      throw error;
    }
  };

  const transferFundsTx = async (jobId: number, amount: number) => {
    try {
      // Ensure contract is initialized
      if (!contract) {
        await createContract();
      }

      if (!window.ethereum) return "";
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length === 0) {
        throw new Error("No account found");
      }

      const amountInWei = web3?.utils.toWei(amount.toString(), "mwei");
      const tx = contract.methods.sendTheFees(jobId, amountInWei).encodeABI();

      const receipt = {
        from: accounts[0],
        gas: "21000",
        to: GoodhiveContractAddress,
        data: tx,
      };

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [receipt as any],
      });

      await waitForTransactionReceipt(txHash as `0x${string}`);
      const balance = await checkBalanceTx(jobId);
      const EndingBalance = Number(balance) - Number(amount);
      await handleUpdateEscrowAmount(jobId, EndingBalance);

      return txHash;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (walletAddress) {
      createContract();
    }
  }, [walletAddress]);

  return { createJobTx, checkBalanceTx, withdrawFundsTx, transferFundsTx };
};
