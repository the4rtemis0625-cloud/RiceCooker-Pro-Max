"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFirebase } from "@/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  AuthError
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleAuthAction = async () => {
    const { auth } = getFirebase();

    if (isSignUp) {
      if (password !== confirmPassword) {
        toast({
          variant: "destructive",
          title: "Passwords do not match",
          description: "Please make sure your passwords match.",
        });
        return;
      }
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        sessionStorage.setItem("ricecooker-auth", "true");
        router.push("/dashboard");
      } catch (error) {
        const authError = error as AuthError;
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: authError.message || "Could not create account.",
        });
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        sessionStorage.setItem("ricecooker-auth", "true");
        router.push("/dashboard");
      } catch (error) {
        const authError = error as AuthError;
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: authError.message || "Could not log in.",
        });
      }
    }
  };

  const toggleFormMode = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-muted-foreground">Email</Label>
        <Input 
            id="email" 
            type="email" 
            className="font-mono tracking-widest text-center"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-muted-foreground">Password</Label>
        <Input 
            id="password" 
            type="password"
            className="font-mono tracking-widest text-center"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {isSignUp && (
        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-muted-foreground">Confirm Password</Label>
          <Input 
              id="confirm-password" 
              type="password"
              className="font-mono tracking-widest text-center"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      )}
      <Button
        onClick={handleAuthAction}
        className="w-full font-bold tracking-wider text-lg"
      >
        <LogIn className="mr-2 h-5 w-5" />
        {isSignUp ? "Create Account" : "Log in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}
        <Button variant="link" onClick={toggleFormMode} className="font-bold">
          {isSignUp ? "Log in" : "Create one"}
        </Button>
      </p>
    </div>
  );
}
