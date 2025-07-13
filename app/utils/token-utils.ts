// Token address mappings for Polygon mainnet
export const TOKEN_ADDRESS_MAP: { [key: string]: string } = {
  // USDC
  "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359": "USDC",
  "0x3C499c542cEF5E3811e1192ce70d8cC03d5c3359": "USDC", // Different case

  // DAI
  "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063": "DAI",
  "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063": "DAI", // Different case

  // agEUR
  "0xE0B52e49357Fd4DAf2c15e02058DCE6BC0057db4": "agEUR",
  "0xe0b52e49357fd4daf2c15e02058dce6bc0057db4": "agEUR", // Different case

  // EURO
  "0x4d0B6356605e6FA95c025a6f6092ECcf0Cf4317b": "EURO",
  "0x4d0b6356605e6fa95c025a6f6092eccf0cf4317b": "EURO", // Different case

  // Legacy USDC address (if still in use)
  "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": "USDC",
  "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174": "USDC", // Different case
};

// Reverse mapping for currency names to addresses
export const CURRENCY_TO_ADDRESS_MAP: { [key: string]: string } = {
  "USDC": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  "DAI": "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
  "agEUR": "0xE0B52e49357Fd4DAf2c15e02058DCE6BC0057db4",
  "EURO": "0x4d0B6356605e6FA95c025a6f6092ECcf0Cf4317b",
};

/**
 * Maps a token address to its human-readable currency name
 * @param tokenAddress - The token contract address
 * @returns The human-readable currency name (e.g., "USDC", "DAI") or "Unknown" if not found
 * 
 * @example
 * getTokenNameFromAddress("0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359") // Returns "USDC"
 * getTokenNameFromAddress("0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063") // Returns "DAI"
 */
export const getTokenNameFromAddress = (tokenAddress: string): string => {
  if (!tokenAddress) return "Unknown";

  // Handle empty or invalid addresses
  if (tokenAddress.length < 10) return "Unknown";

  // Normalize the address to lowercase for comparison
  const normalizedAddress = tokenAddress.toLowerCase();

  // Check all possible case variations
  for (const [address, name] of Object.entries(TOKEN_ADDRESS_MAP)) {
    if (address.toLowerCase() === normalizedAddress) {
      return name;
    }
  }

  // If not found, return "Unknown" instead of the address for better UX
  return "Unknown";
};

/**
 * Maps a currency name to its token address
 * @param currencyName - The currency name (e.g., "USDC", "DAI")
 * @returns The token contract address or null if not found
 * 
 * @example
 * getAddressFromTokenName("USDC") // Returns "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
 * getAddressFromTokenName("DAI") // Returns "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063"
 */
export const getAddressFromTokenName = (currencyName: string): string | null => {
  return CURRENCY_TO_ADDRESS_MAP[currencyName.toUpperCase()] || null;
};

/**
 * Checks if a token address is supported
 * @param tokenAddress - The token contract address
 * @returns True if the token is supported, false otherwise
 * 
 * @example
 * isSupportedToken("0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359") // Returns true
 * isSupportedToken("0x1234567890123456789012345678901234567890") // Returns false
 */
export const isSupportedToken = (tokenAddress: string): boolean => {
  if (!tokenAddress) return false;

  const normalizedAddress = tokenAddress.toLowerCase();
  return Object.keys(TOKEN_ADDRESS_MAP).some(
    address => address.toLowerCase() === normalizedAddress
  );
};

/**
 * Get token symbol with proper formatting
 * @param tokenAddress - The token contract address
 * @returns Formatted token symbol
 * 
 * @example
 * getFormattedTokenSymbol("0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359") // Returns "USDC"
 * getFormattedTokenSymbol("0xE0B52e49357Fd4DAf2c15e02058DCE6BC0057db4") // Returns "agEUR"
 */
export const getFormattedTokenSymbol = (tokenAddress: string): string => {
  const tokenName = getTokenNameFromAddress(tokenAddress);

  // Add special formatting for specific tokens
  switch (tokenName) {
    case "USDC":
      return "USDC";
    case "DAI":
      return "DAI";
    case "agEUR":
      return "agEUR";
    case "EURO":
      return "EURO";
    default:
      return tokenName;
  }
};

/**
 * Get all supported tokens
 * @returns Array of supported token information
 * 
 * @example
 * getSupportedTokens() // Returns [{ address: "0x3c49...", name: "USDC" }, ...]
 */
export const getSupportedTokens = (): Array<{ address: string; name: string }> => {
  return Object.entries(TOKEN_ADDRESS_MAP).map(([address, name]) => ({
    address,
    name,
  }));
};

// Test function to verify token mapping works correctly
export const testTokenMapping = () => {
  console.log("🧪 Testing Token Mapping...");

  // Test known addresses
  const testCases = [
    { address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", expected: "USDC" },
    { address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", expected: "DAI" },
    { address: "0xE0B52e49357Fd4DAf2c15e02058DCE6BC0057db4", expected: "agEUR" },
    { address: "0x4d0B6356605e6FA95c025a6f6092ECcf0Cf4317b", expected: "EURO" },
  ];

  testCases.forEach(({ address, expected }) => {
    const result = getTokenNameFromAddress(address);
    console.log(`${address} -> ${result} ${result === expected ? "✅" : "❌"}`);
  });

  // Test unknown address
  const unknownResult = getTokenNameFromAddress("0x1234567890123456789012345678901234567890");
  console.log(`Unknown address -> ${unknownResult} ${unknownResult === "Unknown" ? "✅" : "❌"}`);

  console.log("✅ Token mapping test complete!");
};

export default {
  getTokenNameFromAddress,
  getAddressFromTokenName,
  isSupportedToken,
  getFormattedTokenSymbol,
  getSupportedTokens,
  testTokenMapping,
  TOKEN_ADDRESS_MAP,
  CURRENCY_TO_ADDRESS_MAP,
}; 