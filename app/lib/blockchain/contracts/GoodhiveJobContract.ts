import { ethers, BigNumber } from "ethers";
import { uuidToUint128 } from "@/lib/blockchain/uint128Conversion";

export const POLYGON_MAINNET_RPC_URL = "https://polygon-rpc.com/";
export const GOODHIVE_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_GOODHIVE_POLYGON_MAINNET_DEPLOYED_CONTRACT_ADDRESS as `0x${string}`;

export const goodhiveJobContractAbi = [
  "function createJob(uint128 jobId, uint256 amount, address token) external",
  "function checkBalance(uint128 jobId) external view returns (uint256)",
  "function getJob(uint128 jobId) external view returns (address user, uint256 amount, address token)",
  "function withdrawFunds(uint128 jobId, uint256 amount) external",
  "function withdrawAllFunds(uint128 jobId) external",
  "function sendTheFees(uint128 jobId, uint256 amount) external",
] as const;

export const createGoodhiveJobContract = (
  provider: ethers.providers.Provider,
) => {
  return new ethers.Contract(
    GOODHIVE_CONTRACT_ADDRESS,
    goodhiveJobContractAbi,
    provider,
  );
};

export const getJobBalance = async (jobId: string): Promise<number> => {
  try {
    // Create provider and contract instance
    const provider = new ethers.providers.JsonRpcProvider(POLYGON_MAINNET_RPC_URL);
    const contract = createGoodhiveJobContract(provider);

    // Convert jobId to uint128 format
    const contractJobId = "7777777"

    // Fetch balance
    const balance = await contract.checkBalance(contractJobId);

    console.log("balance of the job:", balance);

    // Convert from smallest unit (6 decimals for USDC) to human readable
    const formattedBalance = ethers.utils.formatUnits(balance, 6);
    return parseFloat(formattedBalance);
  } catch (error) {
    console.error("Error fetching job balance:", error);
    return 0;
  }
};

// Get full job information
export const getJobInfo = async (jobId: string) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(POLYGON_MAINNET_RPC_URL);
    const contract = createGoodhiveJobContract(provider);

    const contractJobId = BigNumber.from(jobId);

    const [user, amount, token] = await contract.getJob(contractJobId);
    return {
      user,
      amount: ethers.utils.formatUnits(amount, 6), // Assuming USDC 6 decimals
      token,
    };
  } catch (error) {
    console.error("Error fetching job info:", error);
    throw error;
  }
};
