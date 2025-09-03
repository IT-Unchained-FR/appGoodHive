"use client";
import { ThirdwebProvider } from "thirdweb/react";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      <ThirdwebProvider>
        <div>{children}</div>
      </ThirdwebProvider>
    </>
  );
}
