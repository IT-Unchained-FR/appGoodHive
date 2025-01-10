import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Spinner from "../Spinner/Spinner";
import { Loader } from "../loader";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const userId = Cookies.get("user_id");

  useEffect(() => {
    if (!userId) {
      router.push("/auth/login");
    }
  }, [userId, router]);

  if (!userId) {
    return (
      <div className="flex w-full items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
};
