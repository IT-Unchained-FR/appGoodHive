"use client";

import { OktoProvider } from "@okto_web3/react-sdk";
import { GoogleOAuthProvider } from "@react-oauth/google";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  console.log(process.env.NEXT_PUBLIC_ENVIRONMENT, "process.env.NEXT_PUBLIC_ENVIRONMENT...goodhive");
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string}>
      <OktoProvider
        config={{
          environment: process.env.NEXT_PUBLIC_ENVIRONMENT as "sandbox" | "production", // Change to "production" for production environment
          clientPrivateKey: process.env
            .NEXT_PUBLIC_CLIENT_PRIVATE_KEY as `0x${string}`,
          clientSWA: process.env.NEXT_PUBLIC_CLIENT_SWA as `0x${string}`,
        }}
      >
        {children}
      </OktoProvider>
    </GoogleOAuthProvider>
  );
}
