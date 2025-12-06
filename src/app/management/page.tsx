
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useDatabase } from "@/firebase";
import { ref, onValue, get, child } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { DeviceState, Status } from "@/hooks/use-device";

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
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged(user => {
      if (!user) {
        router.push('/login');
      }
      setAuthChecked(true);
    });
    return () => unsubscribe?.();
  }, [auth, router]);

  useEffect(() => {
    if (!authChecked || !database) return;

    const devicesRef = ref(database, 'devices');
    const unsubscribe = onValue(devicesRef, async (snapshot) => {
      if (snapshot.exists()) {
        const devicesData = snapshot.val();
        const deviceList: Promise<DeviceWithId>[] = Object.keys(devicesData).map(async (deviceId) => {
          const device: any = devicesData[deviceId];

          // Determine status from currentAction
          let status: Status = "READY";
          switch (device.currentAction) {
            case 'idle': status = 'READY'; break;
            case 'dispense rice': status = 'DISPENSING'; break;
            case 'add water': status = 'WASHING'; break;
            case 'cook': status = 'COOKING'; break;
            case 'done': status = 'DONE'; break;
            case 'canceled': status = 'CANCELED'; break;
            default: status = 'READY';
          }
          if (device.command?.dispense || device.command?.add_water || device.command?.cook) {
             status = 'SENDING_COMMAND';
          }

          // Find user associated with this device
          const usersRef = ref(database, 'users');
          const usersSnap = await get(usersRef);
          let userEmail = "N/A";
          if (usersSnap.exists()) {
              const usersData = usersSnap.val();
              for (const uid in usersData) {
                  if (usersData[uid].deviceId === deviceId) {
                      userEmail = usersData[uid].email;
                      break;
                  }
              }
          }
          
          return {
            ...device,
            id: deviceId,
            status,
            userEmail,
          };
        });
        const resolvedDevices = await Promise.all(deviceList);
        setDevices(resolvedDevices);
      } else {
        setDevices([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching devices:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authChecked, database]);

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
            <p className="text-muted-foreground">An overview of all registered devices in the system.</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Registered Devices</CardTitle>
            <CardDescription>A real-time list of all connected rice cookers.</CardDescription>
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
                      No devices found.
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
