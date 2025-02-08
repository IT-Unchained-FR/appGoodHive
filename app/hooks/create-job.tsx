/* simple react hook template */
import Web3 from "web3";
import { useEffect, useState } from "react";
import GoodhiveJobContract from "@/contracts/GoodhiveJobContract.json";
import { GoodhiveContractAddress } from "@constants/common";
import TokenAbi from "@/contracts/TokenAbi.json";
interface Props {
  walletAddress: string;
  token: string;
}

export const useCreateJob = (props: Props) => {
  const { walletAddress } = props;
  const [web3, setWeb3] = useState<any>();
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
    console.log("txHash", txHash);
    if (!window.ethereum) return;
    while (true) {
      const receipt = await window.ethereum.request({
        method: "eth_getTransactionReceipt",
        params: [txHash], // Fix: Pass txHash as a single string
      });
      console.log("receipt", receipt);
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
      return console.log("no account found");
    }
    const contract: any = new web3.eth.Contract(TokenAbi, usdcTokenAddress, {
      from: accounts[0],
    });
    const amountInWei = web3.utils.toWei(amount.toString(), "mwei");
    console.log("Requesting approval for amount (Wei):", amountInWei);

    const tx = contract.methods
      .approve(GoodhiveContractAddress, amountInWei)
      .encodeABI();
    try {
      const receipt = {
        from: accounts[0],
        gas: "0x7A120", // 500,000 gas units
        gasPrice: "0x2E90EDD000", // 200 Gwei
        to: usdcTokenAddress,
        data: tx,
      };
      console.log("Sending approval transaction with params:", receipt);

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [receipt as any],
      });
      console.log("Approval transaction hash:", txHash);

      const txReceipt = await waitForTransactionReceipt(
        txHash as `0x${string}`,
      );
      console.log("Approval transaction receipt:", txReceipt);

      if (txReceipt && txReceipt.status === "0x1") {
        console.log("Approval successful");
      } else {
        throw new Error("Approval failed");
      }
    } catch (error) {
      console.error("Error approving token transfer:", error);
      throw error;
    }
  };

  const createContreact = async () => {
    const web3 = new Web3(process.env.NEXT_PUBLIC_GOODHIVE_INFURA_API);
    const contract = new web3.eth.Contract(
      GoodhiveJobContract.abi,
      GoodhiveContractAddress,
    );
    setWeb3(web3);
    setContract(contract);
  };

  const createJobTx = async (jobId: number, amount: number) => {
    try {
      const web3 = new Web3(process.env.NEXT_PUBLIC_GOODHIVE_INFURA_API);
      const initialBalance = await checkBalanceTx(jobId);
      console.log("Initial balance:", initialBalance);

      if (!window.ethereum) return "";
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      console.log("Connected account:", accounts[0]);

      const EndingBalance = Number(initialBalance) + Number(amount);
      console.log("Expected ending balance:", EndingBalance);

      // Use the USDC token address from env
      const usdcTokenAddress =
        process.env.NEXT_PUBLIC_GOODHIVE_USDC_TOKEN_POLYGON;

      // First do the approval
      await requestApproval(amount);
      console.log("Approval completed for amount:", amount);

      // Create contract instance
      const contract: any = new web3.eth.Contract(
        GoodhiveJobContract.abi,
        GoodhiveContractAddress,
        { from: accounts[0] },
      );

      // Convert amount to USDC decimals (6 decimals)
      const amountInWei = web3.utils.toWei(amount.toString(), "mwei");
      console.log("Amount in Wei:", amountInWei);
      console.log("USDC Token address:", usdcTokenAddress);
      console.log("Job ID:", jobId);

      // Create job transaction
      const tx = contract.methods
        .createJob(jobId, amountInWei, usdcTokenAddress)
        .encodeABI();

      console.log("Encoded transaction data:", {
        jobId,
        amountInWei,
        token: usdcTokenAddress,
        encodedData: tx,
      });

      const receipt = {
        from: accounts[0],
        to: GoodhiveContractAddress,
        data: tx,
        gas: "0x7A120", // 500,000 in hex
        gasPrice: "0x2E90EDD000", // 200 Gwei in hex
        value: "0x0",
      };

      console.log("Sending transaction with params:", receipt);

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [receipt as any],
      });

      console.log("Transaction hash:", txHash);
      const txReceipt = await waitForTransactionReceipt(
        txHash as `0x${string}`,
      );
      console.log("Transaction receipt:", txReceipt);

      if (txReceipt && txReceipt.status === "0x1") {
        await handleUpdateEscrowAmount(jobId, EndingBalance);
        return true;
      } else {
        console.error("Transaction failed. Receipt:", txReceipt);
        throw new Error("Transaction failed - check contract interaction");
      }
    } catch (error: any) {
      console.error("Detailed error in transaction:", {
        message: error.message,
        code: error.code,
        data: error.data,
      });
      throw error;
    }
  };

  const checkBalanceTx = async (jobId: any) => {
    try {
      console.log("Checking balance for jobId:", jobId);
      console.log("Contract instance:", contract);

      const balance = await contract?.methods?.checkBalance(jobId).call();
      console.log("Raw balance from contract:", balance);

      const balanceInEther =
        Number(balance) /
        (props.token === "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
          ? 1000000
          : 1);

      console.log("Calculated balance in Ether:", balanceInEther);
      console.log("Token used:", props.token);

      return balanceInEther;
    } catch (error) {
      console.log("Detailed error checking balance:", error);
      return 0;
    }
  };

  const withdrawFundsTx = async (jobId: number, amount: number) => {
    if (!window.ethereum) return "";
    const web3 = new Web3(process.env.NEXT_PUBLIC_GOODHIVE_INFURA_API);
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length === 0) {
      return console.log("no accout found");
    }
    const contract: any = new web3.eth.Contract(
      GoodhiveJobContract.abi,
      GoodhiveContractAddress,
      { from: accounts[0] },
    );
    const tx = contract.methods
      .withdrawFunds(
        jobId,
        web3.utils.toWei(
          amount.toString(),
          props.token === "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
            ? "mwei"
            : "ether",
        ),
      )
      .encodeABI();
    try {
      const balance = await checkBalanceTx(jobId);
      const EndingBalance = Number(balance) - Number(amount);
      const receipt = {
        from: accounts[0],
        gas: "210000000",
        to: GoodhiveContractAddress,
        data: tx,
      };
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [receipt as any],
      });
      await waitForTransactionReceipt(txHash);
      handleUpdateEscrowAmount(jobId, EndingBalance);
    } catch (error) {
      console.error("Error approving token transfer:", error);
      throw error;
    }
  };

  const transferFundsTx = async (jobId: number, amount: number) => {
    if (!window.ethereum) return "";
    const web3 = new Web3(process.env.NEXT_PUBLIC_GOODHIVE_INFURA_API);
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length === 0) {
      return console.log("no accout found");
    }
    const contract: any = new web3.eth.Contract(
      GoodhiveJobContract.abi,
      GoodhiveContractAddress,
      { from: accounts[0] },
    );
    const tx = contract.methods
      .sendTheFees(jobId, web3.utils.toWei(amount.toString(), "mwei"))
      .encodeABI();
    try {
      const balance = await checkBalanceTx(jobId);
      const EndingBalance = Number(balance) - Number(amount);
      const receipt = {
        from: accounts[0],
        gas: "210000000",
        to: GoodhiveContractAddress,
        data: tx,
      };
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [receipt as any],
      });
      await waitForTransactionReceipt(txHash);
      handleUpdateEscrowAmount(jobId, EndingBalance);
    } catch (error) {
      console.error("Error approving token transfer:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (walletAddress) {
      createContreact();
    }
  }, [walletAddress]);

  return { createJobTx, checkBalanceTx, withdrawFundsTx, transferFundsTx };
};
