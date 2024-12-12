import React from "react";

export default function CompanyProfileLayout({
  children,
}: React.PropsWithChildren) {
  return (
    <main className="bg-grey-300">
      

      {children}
    </main>
  );
}