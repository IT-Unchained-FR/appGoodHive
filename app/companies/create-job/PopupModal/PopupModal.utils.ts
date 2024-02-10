export const generateContent = (type: string) => {
  switch (type) {
    case "addFunds":
      return {
        title: "Add Funds",
        description: "Enter the amount you want to add for your job",
        buttonText: "Add Funds",
      };
    case "withdraw":
      return {
        title: "Withdraw Funds",
        description: "Enter the amount you want to withdraw from your job contract",
        buttonText: "Withdraw Funds",
      };
    case "transfer":
      return {
        title: "Make Payment",
        description: "Click 'Pay Now' to proceed with your contribution to the community.",
        buttonText: "Pay Now",
      };
    default:
      return {
        title: "Add Funds",
        description: "Enter the amount you want to add to your account",
        buttonText: "Add Funds",
      };
  }
};
