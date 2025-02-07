import Web3 from "web3";
import { useEffect } from "react";
import GoodhiveJobContract from "@/contracts/GoodhiveJobContract.json";
import { GoodhiveContractAddress } from "@constants/common";
import TokenAbi from "@/contracts/TokenAbi.json";
import { decodeErrorResult } from "viem";

interface Props {
  walletAddress: string;
  token: string;
}

const isHexString = (value: string): value is `0x${string}` => {
  return value.startsWith("0x");
};

interface TransactionReceipt {
  status: boolean;
  [key: string]: any;
}

export const useCreateJob = (props: Props) => {
  const initializeContracts = async () => {
    if (!window.ethereum) throw new Error("Ethereum provider not found");

    const web3Instance = new Web3(window.ethereum);
    const contractInstance = new web3Instance.eth.Contract(
      GoodhiveJobContract.abi,
      GoodhiveContractAddress,
    );

    return { web3Instance, contractInstance };
  };

  const handleUpdateEscrowAmount = async (id: number, amount: number) => {
    await fetch(`/api/companies/update-escrow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, escrowAmount: amount }),
    });
  };

  const waitForTransactionReceipt = async (
    txHash: `0x${string}`,
  ): Promise<TransactionReceipt | null> => {
    if (!window.ethereum) return null;

    const checkReceipt = async (): Promise<TransactionReceipt | null> => {
      const receipt = (await window.ethereum!.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      })) as TransactionReceipt | null;

      if (receipt) return receipt;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return checkReceipt();
    };

    return checkReceipt();
  };

  const checkBalanceTx = async (jobId: number) => {
    const { web3Instance, contractInstance } = await initializeContracts();

    try {
      const balance = await contractInstance.methods.checkBalance(jobId).call();
      const decimals =
        props.token === "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" ? 6 : 18;
      return Number(balance) / Math.pow(10, decimals);
    } catch (error) {
      console.error("Balance check failed:", error);
      return 0;
    }
  };

  const requestApproval = async (amount: number) => {
    const { web3Instance } = await initializeContracts();
    const accounts = await web3Instance.eth.getAccounts();

    if (!accounts.length) throw new Error("No accounts available");

    const tokenContract = new web3Instance.eth.Contract(TokenAbi, props.token);
    const decimals =
      props.token === "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" ? 6 : 18;
    const approvalAmount = BigInt(amount * Math.pow(10, decimals));

    try {
      // Send approval transaction
      const txData = tokenContract.methods
        .approve(GoodhiveContractAddress, approvalAmount.toString())
        .encodeABI();

      const txHash = await window.ethereum?.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: accounts[0] as `0x${string}`,
            to: props.token as `0x${string}`,
            data: txData as `0x${string}`,
            gas: "0x186A0", // 100,000 gas
          },
        ],
      });

      if (!txHash) throw new Error("Transaction hash is null");

      await waitForTransactionReceipt(txHash as `0x${string}`);

      // Verify allowance
      const allowance = (await tokenContract.methods
        .allowance(accounts[0], GoodhiveContractAddress)
        .call()) as unknown as string;

      if (BigInt(allowance) < approvalAmount) {
        throw new Error("Approval verification failed");
      }
    } catch (error: any) {
      console.error("Approval process failed:", error);
      throw error;
    }
  };

  const createJobTx = async (jobIdString: string, amount: number) => {
    const jobId = Number(jobIdString);

    try {
      // Validate input parameters first
      if (typeof jobId !== "number" || jobId <= 0) {
        throw new Error("Invalid job ID. Must be a positive number");
      }

      if (typeof amount !== "number" || amount <= 0) {
        throw new Error("Invalid amount. Must be a positive number");
      }

      // Contract initialization
      const { web3Instance, contractInstance } =
        await initializeContracts().catch((error) => {
          throw new Error(`Contract initialization failed: ${error.message}`);
        });

      // Account check
      const accounts = await web3Instance.eth.getAccounts().catch((error) => {
        throw new Error(`Account retrieval failed: ${error.message}`);
      });

      if (!accounts.length) {
        throw new Error("No connected accounts. Please connect your wallet");
      }

      // Decimal conversion
      const decimals =
        props.token === "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" ? 6 : 18;
      let amountToSend: string;
      try {
        const multiplier = Math.pow(10, decimals);
        const rawAmount = BigInt(Math.round(amount * multiplier));
        amountToSend = rawAmount.toString();
      } catch (error) {
        console.error("Amount conversion error:", error);
        throw new Error(
          `Amount conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }

      // Token approval
      await requestApproval(amount).catch((error) => {
        throw new Error(
          `Token approval failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      });

      // Verify allowance before proceeding
      const tokenContract = new web3Instance.eth.Contract(
        TokenAbi,
        props.token,
      );
      const allowance = await tokenContract.methods
        .allowance(accounts[0], GoodhiveContractAddress)
        .call();

      if (BigInt(allowance as any) < BigInt(amountToSend)) {
        throw new Error("Insufficient token allowance");
      }

      // Transaction preparation
      const txData = contractInstance.methods
        .createJob(jobId, amountToSend)
        .encodeABI();

      // Estimate gas with a buffer
      let estimatedGas;
      try {
        estimatedGas = await web3Instance.eth.estimateGas({
          from: accounts[0],
          to: GoodhiveContractAddress,
          data: txData,
        });
        // Add 20% buffer to estimated gas
        estimatedGas = Math.ceil(Number(estimatedGas) * 1.2);
      } catch (error) {
        console.error("Gas estimation failed:", error);
        estimatedGas = 700000; // Fallback gas limit
      }

      // Get current gas price and add 10% buffer
      const gasPrice = await web3Instance.eth.getGasPrice();
      const gasPriceWithBuffer = (
        (BigInt(gasPrice) * BigInt(110)) /
        BigInt(100)
      ).toString(16);

      // Send transaction
      const txHash = await window.ethereum?.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: accounts[0] as `0x${string}`,
            to: GoodhiveContractAddress as `0x${string}`,
            data: txData as `0x${string}`,
            gas: `0x${estimatedGas.toString(16)}` as `0x${string}`,
            gasPrice: gasPriceWithBuffer as `0x${string}`,
          },
        ],
      });

      if (!txHash || typeof txHash !== "string")
        throw new Error("Transaction hash is null");

      // Wait for receipt
      const receipt = await waitForTransactionReceipt(txHash as `0x${string}`);

      if (!receipt || !receipt.status) {
        const revertReason = await getRevertReason(
          web3Instance,
          txHash as string,
        );
        throw new Error(`Transaction failed: ${revertReason}`);
      }

      // Update escrow amount after successful transaction
      const currentBalance = await checkBalanceTx(jobId);
      await handleUpdateEscrowAmount(jobId, currentBalance + amount);

      return true;
    } catch (error: any) {
      console.error("Transaction failed:", error);
      throw new Error(`Job creation failed: ${error.message}`);
    }
  };

  // Helper function to get revert reasons
  const getRevertReason = async (
    web3: Web3,
    txHash: string,
  ): Promise<string> => {
    if (!txHash) return "No transaction hash provided";

    try {
      const tx = await web3.eth.getTransaction(txHash);
      if (!tx || !tx.blockNumber) return "Transaction not found";

      try {
        await web3.eth.call(
          {
            to: tx.to as `0x${string}`,
            from: tx.from as `0x${string}`,
            data: tx.input as `0x${string}`,
            value: tx.value as `0x${string}`,
            gas: tx.gas as `0x${string}`,
            gasPrice: tx.gasPrice as `0x${string}`,
          },
          tx.blockNumber,
        );
        return "No revert reason found";
      } catch (error: any) {
        const revertData = error.data || error.message;
        if (typeof revertData === "string" && revertData.startsWith("0x")) {
          try {
            return decodeErrorResult({
              abi: GoodhiveJobContract.abi,
              data: revertData as `0x${string}`,
            }).errorName;
          } catch {
            return revertData;
          }
        }
        return "Unknown revert reason";
      }
    } catch (error) {
      return "Failed to fetch transaction details";
    }
  };

  // const withdrawFundsTx = async (jobId: number, amount: number) => {
  //   if (!window.ethereum) return "";
  //   const web3 = new Web3(process.env.NEXT_PUBLIC_GOODHIVE_INFURA_API);
  //   const accounts = await window.ethereum.request({ method: "eth_accounts" });
  //   if (accounts.length === 0) {
  //     return console.log("no accout found");
  //   }
  //   const contract: any = new web3.eth.Contract(
  //     GoodhiveJobContract.abi,
  //     GoodhiveContractAddress,
  //     { from: accounts[0] },
  //   );
  //   const tx = contract.methods
  //     .withdrawFunds(
  //       jobId,
  //       web3.utils.toWei(
  //         amount.toString(),
  //         props.token === "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
  //           ? "mwei"
  //           : "ether",
  //       ),
  //     )
  //     .encodeABI();
  //   try {
  //     const balance = await checkBalanceTx(jobId);
  //     const EndingBalance = Number(balance) - Number(amount);
  //     const receipt = {
  //       from: accounts[0],
  //       gas: "21000",
  //       to: GoodhiveContractAddress,
  //       data: tx,
  //     };
  //     const txHash = await window.ethereum.request({
  //       method: "eth_sendTransaction",
  //       params: [receipt as any],
  //     });
  //     await waitForTransactionReceipt(txHash);
  //     handleUpdateEscrowAmount(jobId, EndingBalance);
  //   } catch (error) {
  //     console.error("Error approving token transfer:", error);
  //     throw error;
  //   }
  // };

  // const transferFundsTx = async (jobId: number, amount: number) => {
  //   if (!window.ethereum) return "";
  //   const web3 = new Web3(process.env.NEXT_PUBLIC_GOODHIVE_INFURA_API);
  //   const accounts = await window.ethereum.request({ method: "eth_accounts" });
  //   if (accounts.length === 0) {
  //     return console.log("no accout found");
  //   }
  //   const contract: any = new web3.eth.Contract(
  //     GoodhiveJobContract.abi,
  //     GoodhiveContractAddress,
  //     { from: accounts[0] },
  //   );
  //   const tx = contract.methods
  //     .sendTheFees(jobId, web3.utils.toWei(amount.toString(), "mwei"))
  //     .encodeABI();
  //   try {
  //     const balance = await checkBalanceTx(jobId);
  //     const EndingBalance = Number(balance) - Number(amount);
  //     const receipt = {
  //       from: accounts[0],
  //       gas: "21000",
  //       to: GoodhiveContractAddress,
  //       data: tx,
  //     };
  //     const txHash = await window.ethereum.request({
  //       method: "eth_sendTransaction",
  //       params: [receipt as any],
  //     });
  //     await waitForTransactionReceipt(txHash);
  //     handleUpdateEscrowAmount(jobId, EndingBalance);
  //   } catch (error) {
  //     console.error("Error approving token transfer:", error);
  //     throw error;
  //   }
  // };

  useEffect(() => {
    if (props.walletAddress) {
      initializeContracts().catch(console.error);
    }
  }, [props.walletAddress]);

  return { createJobTx, checkBalanceTx };
};
