
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useDatabase } from "@/firebase";
import { ref, onValue, get, update, query, orderByChild, equalTo } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { DeviceState, Status } from "@/hooks/use-device";
import { User } from "firebase/auth";
import { DeviceForm } from "@/components/management/device-form";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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

  useEffect(() => {
    if (!authChecked || !database || !user) {
      setLoading(false);
      return;
    };

    setLoading(true);
    
    const userProfileRef = ref(database, `users/${user.uid}`);
    const unsubscribeProfile = onValue(userProfileRef, (userSnap) => {
      if (!userSnap.exists() || !userSnap.val().deviceId) {
          setDevices([]);
          setLoading(false);
          return;
      }
      
      const deviceId = userSnap.val().deviceId;
      const deviceRef = ref(database, `devices/${deviceId}`);

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
              setDevices([deviceWithId]);
          } else {
              setDevices([]);
          }
          setLoading(false);
      }, (error) => {
          console.error("Error fetching device:", error);
          setDevices([]);
          setLoading(false);
      });

      return () => unsubscribeDevice();
    }, (error) => {
        console.error("Error fetching user profile:", error);
        setDevices([]);
        setLoading(false);
    });

    return () => unsubscribeProfile();
  }, [authChecked, database, user]);

  const handleUpdateDevice = async (newDeviceId: string) => {
    if (!database || !user) return;

    const usersRef = ref(database, 'users');
    const deviceIdQuery = query(usersRef, orderByChild('deviceId'), equalTo(newDeviceId));

    try {
        const snapshot = await get(deviceIdQuery);
        if (snapshot.exists()) {
            const usersWithDevice = snapshot.val();
            const otherUser = Object.keys(usersWithDevice).find(uid => uid !== user.uid);
            if (otherUser) {
                toast({
                    variant: 'destructive',
                    title: "Device Already Registered",
                    description: "This device ID is already registered to another user.",
                });
                return;
            }
        }
        
        const userRef = ref(database, `users/${user.uid}`);
        await update(userRef, { deviceId: newDeviceId });
        toast({
            title: "Device Registration Updated",
            description: `Your account is now linked to device: ${newDeviceId}`,
        });
    } catch (err: any) {
        console.error("Error updating device ID:", err);
        toast({
            variant: 'destructive',
            title: "Update Error",
            description: err.message || "Could not update the device ID.",
        });
    }
  };

  const handleDeleteDevice = async () => {
    if (!database || !user) return;
    const userRef = ref(database, `users/${user.uid}`);
    try {
        await update(userRef, { deviceId: null });
        toast({
            title: "Device Registration Removed",
            description: "The device has been unlinked from your account.",
        });
        setDevices([]);
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

  const hasDevice = devices.length > 0;
  const currentDeviceId = hasDevice ? devices[0].id : undefined;

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-5xl space-y-8">
        <div className="mb-8">
            <Button asChild variant="ghost" className="mb-4">
                <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
            </Button>
            <h1 className="text-3xl font-bold text-primary">Device Management</h1>
            <p className="text-muted-foreground">An overview of your registered device.</p>
        </div>
        
        <DeviceForm 
            currentDeviceId={currentDeviceId}
            onSubmit={handleUpdateDevice}
        />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Registered Device</CardTitle>
              <CardDescription>A real-time view of your connected rice cooker.</CardDescription>
            </div>
            {hasDevice && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Registration</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently remove the device registration from your account. 
                      You can re-register it later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteDevice}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
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
                {hasDevice ? (
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
