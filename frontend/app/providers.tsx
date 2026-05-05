"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { GlobalLoader } from "@/components/GlobalLoader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <GlobalLoader />
      <Toaster richColors position="top-center" closeButton duration={4500} />
    </AuthProvider>
  );
}
