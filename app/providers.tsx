"use client";

import { OktoProvider } from "@okto_web3/react-sdk";
import { GoogleOAuthProvider } from "@react-oauth/google";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <OktoProvider
        config={{
          environment: "sandbox", // Change to "production" for production environment
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
