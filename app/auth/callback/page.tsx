"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useOkto } from "@okto_web3/react-sdk";

// This is a simple callback page to handle redirects from the auth process
export default function AuthCallback() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const oktoClient = useOkto();

  // Getting the id_token from the session
  //@ts-ignore
  const idToken = useMemo(() => (session ? session.id_token : null), [session]);
  console.log(idToken, "idToken.......");

  const handleAuthenticate = useCallback(async (): Promise<any> => {
    if (!idToken) {
      return { result: false, error: "No google login" };
    }
    try {
      const user = await oktoClient.loginUsingOAuth({
        idToken: idToken,
        provider: "google",
      });
      console.log("Authentication Success", user);
      return JSON.stringify(user);
    } catch (error) {
      console.log("Authentication Error", error);
      return { result: false, error: "Authentication Error" };
    }
  }, [idToken, oktoClient]);

  useEffect(() => {
    // If not authenticated, redirect to login page
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    console.log(idToken, "idToken");
    console.log(oktoClient.loginUsingOAuth, "oktoClient");
    if (idToken) {
      handleAuthenticate();
    }
  }, [idToken, handleAuthenticate, oktoClient]);

  // Show a minimal loading state
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFC905]"></div>
    </div>
  );
}
