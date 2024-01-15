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
        title: "Pay The Fees",
        description: "Enter the amount you want to pay",
        buttonText: "Pay Fees",
      };
    default:
      return {
        title: "Add Funds",
        description: "Enter the amount you want to add to your account",
        buttonText: "Add Funds",
      };
  }
};
