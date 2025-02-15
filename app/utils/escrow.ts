import { ethers } from "ethers";

/**
 * Converts Wei amount to standard decimal format and updates the escrow amount in the database
 * @param jobId - The job ID
 * @param amount - The amount in Wei (smallest unit)
 * @returns Promise<boolean> - Returns true if update was successful
 */
export const updateEscrowAmount = async (
  jobId: string,
  amount: number,
): Promise<boolean> => {
  if (!amount) {
    return true;
  }

  try {
    const response = await fetch("/api/companies/update-escrow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: parseInt(jobId),
        escrowAmount: amount,
      }),
    });
    const responseBody = await response.json();
    console.log("Response Body:", responseBody);

    if (!response.ok) {
      throw new Error("Failed to update escrow amount in database");
    }

    return true;
  } catch (error) {
    console.log("Error updating escrow amount:", error);
    throw error;
  }
};

/**
 * Converts standard decimal format to Wei amount
 * @param amount - The amount in standard decimal format
 * @returns number - The amount in Wei
 */
export const convertToWei = (amount: number): number => {
  return Number(ethers.parseUnits(amount.toString(), 6));
};

/**
 * Converts Wei amount to standard decimal format
 * @param amount - The amount in Wei
 * @returns number - The amount in standard decimal format
 */
export const convertFromWei = (amount: number): number => {
  return Number(ethers.formatUnits(amount.toString(), 6));
};
