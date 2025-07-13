import { getTokenNameFromAddress } from "@/app/utils/token-utils";
import { BigNumber, ethers } from "ethers";

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

    // Fetch balance
    const balance = await contract.checkBalance(jobId);

    console.log("balance of the job:", balance);

    // Convert from smallest unit (6 decimals for USDC) to human readable
    const formattedBalance = ethers.utils.formatUnits(balance, 6);
    return parseFloat(formattedBalance);
  } catch (error) {
    console.error("Error fetching job balance:", error);
    return 0;
  }
};

// Get job balance with token information
export const getJobBalanceWithToken = async (jobId: string): Promise<{ balance: number; tokenAddress: string; tokenName: string }> => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(POLYGON_MAINNET_RPC_URL);
    const contract = createGoodhiveJobContract(provider);

    const contractJobId = BigNumber.from(jobId);

    // Get full job information including token address
    const [user, amount, token] = await contract.getJob(contractJobId);

    // Convert from smallest unit to human readable
    // Most tokens use 6 decimals (USDC), but DAI uses 18
    let decimals = 6; // Default to USDC decimals
    const tokenName = getTokenNameFromAddress(token);

    if (tokenName === "DAI" || tokenName === "agEUR" || tokenName === "EURO") {
      decimals = 18;
    }

    const formattedBalance = ethers.utils.formatUnits(amount, decimals);

    return {
      balance: parseFloat(formattedBalance),
      tokenAddress: token,
      tokenName: tokenName,
    };
  } catch (error) {
    console.error("Error fetching job balance with token:", error);
    return {
      balance: 0,
      tokenAddress: "",
      tokenName: "Unknown",
    };
  }
};

// Get full job information
export const getJobInfo = async (jobId: string) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(POLYGON_MAINNET_RPC_URL);
    const contract = createGoodhiveJobContract(provider);

    const contractJobId = BigNumber.from(jobId);

    const [user, amount, token] = await contract.getJob(contractJobId);

    // Get token name for better display
    const tokenName = getTokenNameFromAddress(token);

    // Use appropriate decimals
    let decimals = 6; // Default to USDC decimals
    if (tokenName === "DAI" || tokenName === "agEUR" || tokenName === "EURO") {
      decimals = 18;
    }

    return {
      user,
      amount: ethers.utils.formatUnits(amount, decimals),
      token,
      tokenName,
    };
  } catch (error) {
    console.error("Error fetching job info:", error);
    throw error;
  }
};
