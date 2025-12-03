
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center mb-4">
        <Image src="/logo.png" alt="Official Logo" width={100} height={100} />
      </div>
      <Card className={cn(
          "w-full max-w-md z-10",
          "border-primary/20 shadow-lg bg-card/80 backdrop-blur-sm"
        )}>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-wider text-primary">RiceCooker Pro Max</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      
    </main>
  );
}
