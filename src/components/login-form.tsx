"use client";

import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();

  const handleLogin = () => {
    // In a real app, you would perform authentication here.
    // For this mock, we'll just set a flag in sessionStorage.
    sessionStorage.setItem("ricecooker-auth", "true");
    router.push("/dashboard");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-muted-foreground">Username</Label>
        <Input 
            id="username" 
            type="text" 
            placeholder="[ USERNAME ]" 
            className="font-mono tracking-widest text-center"
            defaultValue="user" // for demo purposes
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-muted-foreground">Password</Label>
        <Input 
            id="password" 
            type="password" 
            placeholder="[ ACCESS KEY ]" 
            className="font-mono tracking-widest text-center"
            defaultValue="password123" // for demo purposes
        />
      </div>
      <Button
        onClick={handleLogin}
        className="w-full font-bold tracking-wider text-lg"
      >
        <LogIn className="mr-2 h-5 w-5" />
        Log in
      </Button>
    </div>
  );
}
