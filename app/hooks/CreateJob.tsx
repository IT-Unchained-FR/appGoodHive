/* simple react hook template */
import Web3 from "web3";
import { useEffect, useState } from "react";
import GoodhiveJobContract from "@/contracts/GoodhiveJobContract.json";
import { GoodhiveContractAddress } from "@constants/common";

interface Props {
  walletAddress: string;
}

export const useCreateJob = (props: Props) => {
  const { walletAddress } = props;
  const [web3, setWeb3] = useState<any>();
  const [contract, setContract] = useState<any>();

  const handleUpdateEscrowAmount = async (id: number) => {
    const escrowAmount = await checkBalanceTx(id);
    await fetch(`/api/companies/update-escrow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, escrowAmount }),
    });
    
  };

  const createContreact = async () => {
    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(
      GoodhiveJobContract.abi,
      GoodhiveContractAddress
    );

    setWeb3(web3);
    setContract(contract);
  };

  const createJobTx = async (jobId: number, amount: number) => {
    try {
      const accounts = await web3.eth.getAccounts();
      const amountInWei = web3.utils.toWei(amount.toString(), "ether");
      await contract.methods.createJob(jobId, amountInWei).send({
        from: accounts[0],
        value: amountInWei,
      });
      console.log("Fund Added successfully!");
      handleUpdateEscrowAmount(jobId);
    } catch (error) {
      console.error("Error putting funds in:", error);
      throw error;
    }
  };

  const checkBalanceTx = async (jobId: number) => {
    try {
      const balance = await contract.methods.checkBalance(jobId).call();
      const balanceInEther = web3.utils.fromWei(balance, "ether");
      console.log("Job balance >>", balanceInEther);
      return balanceInEther;
    } catch (error) {
      console.error("Error checking balance:", error);
    }
  };

  const withdrawFundsTx = async (jobId: number, amount: number) => {
    try {
      const accounts = await web3.eth.getAccounts();
      const amountInWei = web3.utils.toWei(amount.toString(), "ether");
      await contract.methods
        .withdrawFunds(jobId, amountInWei)
        .send({ from: accounts[0] });
      console.log("Funds withdrawn successfully!");
      handleUpdateEscrowAmount(jobId);
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      throw error;
    }
  };

  const transferFundsTx = async (jobId: number, amount: number, toAddress: string) => {
    try {
      const accounts = await web3.eth.getAccounts();
      const amountInWei = web3.utils.toWei(amount.toString(), "ether");
      await contract.methods
        .payTheFees(jobId, toAddress, amountInWei)
        .send({ from: accounts[0] });
      console.log("Funds transferred successfully!");
      handleUpdateEscrowAmount(jobId);
    } catch (error) {
      console.error("Error transferring funds:", error);
    }
  }

  useEffect(() => {
    if (walletAddress) {
      createContreact();
    }
  }, [walletAddress]);

  return { createJobTx, checkBalanceTx, withdrawFundsTx, transferFundsTx };
};
