
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useDatabase } from "@/firebase";
import { User } from "firebase/auth";
import { ref, get } from "firebase/database";
import { ControlPanel } from "@/components/control-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UserProfile {
    deviceId: string | null;
}

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const database = useDatabase();
  const [user, setUser] = useState<User | null>(null);
  const [initialDeviceId, setInitialDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // This ensures the component only renders its full content on the client side.
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !auth) return;

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, [isClient, auth]);

  useEffect(() => {
    if (!isClient || !authChecked) return;

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
  }, [isClient, authChecked, user, database, router]);

  const handleSignOut = () => {
    auth?.signOut().then(() => {
      router.push('/login');
    });
  }

  if (!isClient || loading || !authChecked) {
    return (
      <div className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-5xl space-y-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-primary">RiceCooker Pro Max</h1>
                <Skeleton className="h-10 w-24" />
            </header>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  if (user) {
    return (
        <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-5xl">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-primary">RiceCooker Pro-Max</h1>
                    <div className="flex items-center gap-4">
                        <Button asChild variant="link">
                            <Link href="/management">Device Management</Link>
                        </Button>
                        <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
                    </div>
                </header>
                <ControlPanel initialDeviceId={initialDeviceId} />
            </div>
        </main>
    );
  }

  // If auth has been checked and there's no user, we redirect, but return null in the meantime.
  return null;
}
