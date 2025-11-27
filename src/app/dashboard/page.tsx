"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFirebase } from "@/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { ControlPanel } from "@/components/control-panel";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { auth } = getFirebase();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        sessionStorage.setItem("ricecooker-auth", "true");
      } else {
        setUser(null);
        sessionStorage.removeItem("ricecooker-auth");
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
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
  
  if(user) {
    return <ControlPanel />;
  }

  return null;
}
