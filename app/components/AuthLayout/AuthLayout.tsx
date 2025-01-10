import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Spinner from "../Spinner/Spinner";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const userId = Cookies.get("user_id");

  useEffect(() => {
    if (!userId) {
      router.push("/auth/login");
    }
  }, [userId, router]);

  if (!userId) {
    return <Spinner />;
  }

  return <>{children}</>;
};
