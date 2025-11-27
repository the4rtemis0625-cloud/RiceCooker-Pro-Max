"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ControlPanel } from "@/components/control-panel";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const authStatus = sessionStorage.getItem("ricecooker-auth") === "true";
    setIsAuthenticated(authStatus);
    if (!authStatus) {
      router.push("/login");
    }
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 space-y-4">
        <div className="w-full max-w-2xl space-y-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }
  
  if(isAuthenticated) {
    return <ControlPanel />;
  }

  return null;
}
