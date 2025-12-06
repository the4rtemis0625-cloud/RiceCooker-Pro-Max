
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useDatabase } from "@/firebase";
import { User } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { ControlPanel } from "@/components/control-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UserProfile {
    deviceIds?: Record<string, boolean>;
    deviceId?: string; // For backward compatibility
}

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const database = useDatabase();
  const [user, setUser] = useState<User | null>(null);
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !auth) return;

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
      }
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, [isClient, auth, router]);

  useEffect(() => {
    if (!isClient || !authChecked || !user || !database) return;

    setLoading(true);
    const userRef = ref(database, `users/${user.uid}`);
    const unsubscribeProfile = onValue(userRef, (userSnap) => {
      if (userSnap.exists()) {
        const userProfile = userSnap.val() as UserProfile;
        
        let fetchedDeviceIds: string[] = [];
        // Check for the new multi-device format first
        if (userProfile.deviceIds && typeof userProfile.deviceIds === 'object') {
            fetchedDeviceIds = Object.keys(userProfile.deviceIds);
        } 
        // Fallback to the old single-device format
        else if (userProfile.deviceId && typeof userProfile.deviceId === 'string') {
            fetchedDeviceIds = [userProfile.deviceId];
        }

        setDeviceIds(fetchedDeviceIds);

        if (fetchedDeviceIds.length > 0) {
          if (!selectedDeviceId || !fetchedDeviceIds.includes(selectedDeviceId)) {
            setSelectedDeviceId(fetchedDeviceIds[0]);
          }
        } else {
          setSelectedDeviceId(null);
        }
      } else {
        console.log("No user profile found!");
        setDeviceIds([]);
        setSelectedDeviceId(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching user profile:", err);
      setDeviceIds([]);
      setSelectedDeviceId(null);
      setLoading(false);
    });

    return () => unsubscribeProfile();
  }, [isClient, authChecked, user, database, selectedDeviceId]);

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
                <h1 className="text-2xl font-bold text-primary">RiceCooker Pro-Max</h1>
                <Skeleton className="h-10 w-24" />
            </header>
            <Skeleton className="h-24 w-full" />
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
            <div className="w-full max-w-5xl space-y-8">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-primary">RiceCooker Pro-Max</h1>
                    <div className="flex items-center gap-4">
                        <Button asChild variant="link">
                            <Link href="/management">Device Management</Link>
                        </Button>
                        <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
                    </div>
                </header>

                {deviceIds.length > 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Device</CardTitle>
                      <CardDescription>Choose which RiceCooker to control.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select value={selectedDeviceId || ''} onValueChange={setSelectedDeviceId}>
                        <SelectTrigger className="w-full md:w-1/2">
                          <SelectValue placeholder="Select a device" />
                        </SelectTrigger>
                        <SelectContent>
                          {deviceIds.map(id => (
                            <SelectItem key={id} value={id}>{id}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                )}

                {deviceIds.length > 0 ? (
                  <ControlPanel activeDeviceId={selectedDeviceId} />
                ) : (
                  <Card className="text-center py-12">
                      <CardHeader>
                          <CardTitle>No Devices Registered</CardTitle>
                          <CardDescription className="mt-2">
                              You don't have any devices linked to your account yet.
                          </CardDescription>
                      </CardHeader>
                      <CardContent>
                          <Button asChild>
                              <Link href="/management">Register a Device</Link>
                          </Button>
                      </CardContent>
                  </Card>
                )}
            </div>
        </main>
    );
  }

  return null;
}
