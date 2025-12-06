
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useDatabase } from "@/firebase";
import { ref, onValue, get } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { DeviceState, Status } from "@/hooks/use-device";
import { User } from "firebase/auth";

interface DeviceWithId extends DeviceState {
  id: string;
  userEmail?: string;
}

const statusVariantMap: Record<Status, "default" | "secondary" | "destructive"> = {
  READY: "default",
  SENDING_COMMAND: "secondary",
  DISPENSING: "secondary",
  WASHING: "secondary",
  COOKING: "secondary",
  DONE: "default",
  CANCELED: "destructive",
  NOT_CONNECTED: "destructive",
};

export default function ManagementPage() {
  const router = useRouter();
  const auth = useAuth();
  const database = useDatabase();
  const [devices, setDevices] = useState<DeviceWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged(user => {
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
      setAuthChecked(true);
    });
    return () => unsubscribe?.();
  }, [auth, router]);

  useEffect(() => {
    if (!authChecked || !database || !user) {
      setLoading(false);
      return;
    };

    setLoading(true);
    
    // 1. Get the current user's profile to find their deviceID
    const userProfileRef = ref(database, `users/${user.uid}`);
    get(userProfileRef).then(userSnap => {
        if (!userSnap.exists() || !userSnap.val().deviceId) {
            setDevices([]);
            setLoading(false);
            return;
        }
        
        const deviceId = userSnap.val().deviceId;
        const deviceRef = ref(database, `devices/${deviceId}`);

        // 2. Listen for real-time updates on that specific device
        const unsubscribeDevice = onValue(deviceRef, (snapshot) => {
            if (snapshot.exists()) {
                const deviceData = snapshot.val();

                let status: Status = "READY";
                switch (deviceData.currentAction) {
                    case 'idle': status = 'READY'; break;
                    case 'dispense rice': status = 'DISPENSING'; break;
                    case 'add water': status = 'WASHING'; break;
                    case 'cook': status = 'COOKING'; break;
                    case 'done': status = 'DONE'; break;
                    case 'canceled': status = 'CANCELED'; break;
                    default: status = 'READY';
                }
                if (deviceData.command?.dispense || deviceData.command?.add_water || deviceData.command?.cook) {
                    status = 'SENDING_COMMAND';
                }

                const deviceWithId: DeviceWithId = {
                    ...deviceData,
                    id: deviceId,
                    status,
                    userEmail: user.email || "N/A",
                };
                setDevices([deviceWithId]); // Set state with an array containing the single device
            } else {
                setDevices([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching device:", error);
            setDevices([]);
            setLoading(false);
        });

        // Return a cleanup function for the device listener
        return () => unsubscribeDevice();
    }).catch(error => {
        console.error("Error fetching user profile:", error);
        setDevices([]);
        setLoading(false);
    });

  }, [authChecked, database, user]);


  if (loading || !authChecked) {
    return (
      <div className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-5xl space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-5xl">
        <div className="mb-8">
            <Button asChild variant="ghost" className="mb-4">
                <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
            </Button>
            <h1 className="text-3xl font-bold text-primary">Device Management</h1>
            <p className="text-muted-foreground">An overview of your registered device.</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Registered Device</CardTitle>
            <CardDescription>A real-time view of your connected rice cooker.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Registered To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.length > 0 ? (
                  devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-mono text-xs">{device.id}</TableCell>
                      <TableCell>{device.userEmail}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariantMap[device.status] || "secondary"}>
                          {device.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {device.lastUpdated ? new Date(device.lastUpdated).toLocaleString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No device is registered to this account.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
