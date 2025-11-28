"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useDatabase } from "@/firebase";
import { User } from "firebase/auth";
import { ref, get } from "firebase/database";
import { ControlPanel } from "@/components/control-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface UserProfile {
    deviceId: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const auth = useAuth();
  const database = useDatabase();
  const [user, setUser] = useState<User | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
        // Firebase Auth service is not ready yet.
        return;
    }
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        sessionStorage.setItem("ricecooker-auth", "true");
        
        if (database) {
          // Fetch user profile to get deviceId
          const userRef = ref(database, `users/${user.uid}`);
          const userSnap = await get(userRef);

          if (userSnap.exists()) {
              const userProfile = userSnap.val() as UserProfile;
              setDeviceId(userProfile.deviceId);
          } else {
              console.log("No user profile found!");
              setDeviceId(null);
          }
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
  }, [auth, database, router]);

  const handleCheckAuth = () => {
    if (auth) {
      console.log("Current Auth User:", auth.currentUser);
    } else {
      console.log("Auth service not available.");
    }
  };

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
            <div className="absolute top-4 right-4">
              <Button onClick={handleCheckAuth} variant="outline">Check Auth State</Button>
            </div>
            <ControlPanel initialDeviceId={deviceId} />
        </main>
    );
  }

  return null;
}
