"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFirebase } from "@/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ControlPanel } from "@/components/control-panel";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfile {
    deviceId: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { auth, firestore } = getFirebase();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        sessionStorage.setItem("ricecooker-auth", "true");
        
        // Fetch user profile to get deviceId
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userProfile = userSnap.data() as UserProfile;
            setDeviceId(userProfile.deviceId);
        } else {
            // This case should ideally not happen if profile is created on signup
            console.log("No user profile found!");
            setDeviceId(null);
        }

      } else {
        setUser(null);
        setDeviceId(null);
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
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 space-y-4">
            <ControlPanel initialDeviceId={deviceId} userId={user.uid} />
        </main>
    );
  }

  return null;
}
