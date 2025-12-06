
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useDatabase } from "@/firebase";
import { ref, onValue, update, remove, get } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2 } from "lucide-react";
import { DeviceState, Status } from "@/hooks/use-device";
import { User } from "firebase/auth";
import { DeviceForm } from "@/components/management/device-form";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface DeviceWithId extends Partial<DeviceState> {
  id: string;
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
  const { toast } = useToast();
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

  const fetchDeviceData = useCallback(async (deviceId: string): Promise<DeviceWithId> => {
    if (!database) return { id: deviceId, status: "NOT_CONNECTED" };
    const deviceRef = ref(database, `devices/${deviceId}`);
    const snapshot = await get(deviceRef);

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
      return { ...deviceData, id: deviceId, status };
    }
    return { id: deviceId, status: "NOT_CONNECTED" };
  }, [database]);


  useEffect(() => {
    if (!authChecked || !database || !user) {
      setLoading(false);
      return;
    };

    setLoading(true);
    
    const userProfileRef = ref(database, `users/${user.uid}/deviceIds`);
    const unsubscribeProfile = onValue(userProfileRef, async (snapshot) => {
      if (snapshot.exists()) {
        const deviceIds = Object.keys(snapshot.val());
        const devicePromises = deviceIds.map(id => fetchDeviceData(id));
        const deviceList = await Promise.all(devicePromises);
        setDevices(deviceList);
      } else {
        setDevices([]);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching user device IDs:", error);
        setDevices([]);
        setLoading(false);
    });

    return () => unsubscribeProfile();
  }, [authChecked, database, user, fetchDeviceData]);

  const handleAddDevice = async (newDeviceId: string) => {
    if (!database || !user) return;

    try {
        const userRef = ref(database, `users/${user.uid}/deviceIds`);
        await update(userRef, { [newDeviceId]: true });
        toast({
            title: "Device Registered",
            description: `Device ${newDeviceId} has been added to your account.`,
        });
    } catch (err: any) {
        console.error("Error adding device ID:", err);
        toast({
            variant: 'destructive',
            title: "Registration Error",
            description: err.message || "Could not add the device ID.",
        });
    }
  };

  const handleDeleteDevice = async (deviceIdToDelete: string) => {
    if (!database || !user) return;
    const deviceRef = ref(database, `users/${user.uid}/deviceIds/${deviceIdToDelete}`);
    try {
        await remove(deviceRef);
        toast({
            title: "Device Registration Removed",
            description: `Device ${deviceIdToDelete} has been unlinked from your account.`,
        });
    } catch (err: any) {
        console.error("Error deleting device registration:", err);
        toast({
            variant: 'destructive',
            title: "Deletion Error",
            description: err.message || "Could not remove device registration.",
        });
    }
  };


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

  const hasDevices = devices.length > 0;

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-5xl space-y-8">
        <div className="mb-8">
            <Button asChild variant="ghost" className="mb-4">
                <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
            </Button>
            <h1 className="text-3xl font-bold text-primary">Device Management</h1>
            <p className="text-muted-foreground">Add or remove your registered devices.</p>
        </div>
        
        <DeviceForm onSubmit={handleAddDevice} />

        <Card>
          <CardHeader>
            <CardTitle>Your Registered Devices</CardTitle>
            <CardDescription>A real-time list of your connected rice cookers.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hasDevices ? (
                  devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-mono text-xs">{device.id}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariantMap[device.status!] || "secondary"}>
                          {device.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {device.lastUpdated ? new Date(device.lastUpdated).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove the device <span className="font-mono text-xs bg-muted p-1 rounded-sm">{device.id}</span> from your account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteDevice(device.id)}>
                                Continue
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                      No devices are registered to this account.
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
