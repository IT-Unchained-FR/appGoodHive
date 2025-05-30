import { ethers } from "ethers";

/**
 * Converts a UUID string to a uint128 value as a string
 * @param uuid - The UUID string to convert (e.g. "123e4567-e89b-12d3-a456-426614174000")
 * @returns The uint128 value as a string
 * @throws {Error} If the UUID is invalid or cannot be converted
 */
export const uuidToUint128 = (uuid: string): string => {
  if (!uuid || typeof uuid !== "string") {
    throw new Error("Invalid UUID: must be a non-empty string");
  }

  try {
    const hex = uuid.replace(/-/g, "");
    return BigInt(`0x${hex}`).toString();
  } catch (error) {
    throw new Error(
      `Failed to convert UUID to uint128: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};
