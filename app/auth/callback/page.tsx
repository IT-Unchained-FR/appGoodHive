"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useOkto } from "@okto_web3/react-sdk";

// This is a simple callback page to handle redirects from the auth process
export default function AuthCallback() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const oktoClient = useOkto();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Getting the id_token from the session
  //@ts-ignore
  const idToken = useMemo(() => (session ? session.id_token : null), [session]);
  console.log(session, "session", idToken, "idToken");

  const handleAuthenticate = useCallback(async (): Promise<any> => {
    if (!idToken) {
      setError("No Google login detected");
      return { result: false, error: "No google login" };
    }

    setIsLoading(true);
    try {
      const user = await oktoClient.loginUsingOAuth({
        idToken: idToken,
        provider: "google",
      });

      console.log("Authenticated with Okto:", user);
      setIsLoading(false);
      return user;
    } catch (error) {
      console.error("Authentication error:", error);
      setError("Failed to authenticate with Okto");
      setIsLoading(false);
      return { result: false, error: "Authentication Error" };
    }
  }, [idToken, oktoClient]);

  useEffect(() => {
    // First make sure we have a session
    if (status === "loading") return;

    if (status === "authenticated" && session) {
      // Run Okto authentication when we have a session and token
      if (idToken) {
        handleAuthenticate()
          .then(() => {
            // Redirect to profile page after successful auth
            router.push("/talents/my-profile");
          })
          .catch(() => {
            // On error, still redirect to profile
            // The app can handle showing auth errors there if needed
            router.push("/talents/my-profile");
          });
      } else {
        // No idToken but authenticated, go to profile
        router.push("/talents/my-profile");
      }
    } else if (status === "unauthenticated") {
      // Not authenticated, go to login
      router.push("/auth/login");
    }
  }, [status, router, session, idToken, handleAuthenticate]);

  // Show a loading state with error handling
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {isLoading ? (
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFC905]"></div>
      ) : error ? (
        <div className="text-red-500 mt-4">{error}</div>
      ) : (
        <div className="text-green-500 mt-4">Authenticated successfully!</div>
      )}
    </div>
  );
}
