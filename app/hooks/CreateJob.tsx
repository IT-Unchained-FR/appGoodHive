/* simple react hook template */
import Web3 from "web3";
import { useEffect, useState } from "react";
import GoodhiveJobContract from "@/contracts/GoodhiveJobContract.json";
import { GoodhiveContractAddress } from "@constants/common";
import { toast } from "react-hot-toast";

interface Props {
  walletAddress: string;
}

export const useCreateJob = (props: Props) => {
  const { walletAddress } = props;
  const [web3, setWeb3] = useState<any>();
  const [contract, setContract] = useState<any>();

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
      console.log("Job created successfully!");
      toast.success("Job created successfully!");
    } catch (error) {
      toast.error("Error creating job!");
      console.error("Error creating job:", error);
    }
  };

  const checkBalanceTx = async (jobId: number) => {
    try {
      const balance = await contract.methods.checkBalance(jobId).call();
      const balanceInEther = web3.utils.fromWei(balance, "ether");
      console.log("Job balance:", balanceInEther);
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
    } catch (error) {
      console.error("Error withdrawing funds:", error);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      createContreact();
    }
  }, [walletAddress]);

  return { createJobTx, checkBalanceTx, withdrawFundsTx };
};
