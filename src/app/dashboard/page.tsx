
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
  const [initialDeviceId, setInitialDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!authChecked) return;

    if (user && database) {
      const userRef = ref(database, `users/${user.uid}`);
      get(userRef).then((userSnap) => {
        if (userSnap.exists()) {
          const userProfile = userSnap.val() as UserProfile;
          setInitialDeviceId(userProfile.deviceId);
        } else {
          console.log("No user profile found!");
          setInitialDeviceId(null);
        }
        setLoading(false);
      }).catch(err => {
        console.error("Error fetching user profile:", err);
        setInitialDeviceId(null);
        setLoading(false);
      });
    } else if (!user) {
      router.push("/login");
    }
  }, [authChecked, user, database, router]);


  const handleSignOut = () => {
    auth?.signOut().then(() => {
      router.push('/login');
    });
  }

  if (loading || !authChecked) {
    return (
      <div className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl space-y-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }
  
  if(user) {
    return (
        <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-5xl">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-primary">RiceCooker Pro Max</h1>
                    <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
                </header>
                <ControlPanel initialDeviceId={initialDeviceId} />
            </div>
        </main>
    );
  }

  return null;
}
