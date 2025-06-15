export const checkUserLoginMethod = async (email: string) => {
  const response = await fetch(`/api/auth/check-account?email=${email}`);
  const accountData = await response.json();
  return accountData;
};
