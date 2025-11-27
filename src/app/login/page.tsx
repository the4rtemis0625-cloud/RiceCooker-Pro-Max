import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[url('/rice-pattern.svg')] bg-repeat">
      
      <Card className={cn(
          "w-full max-w-md z-10",
          "border-primary/20 shadow-lg"
        )}>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-wider text-primary">Ultimate Rice Cooker Pro Max</CardTitle>
          <CardDescription className="font-mono text-muted-foreground pt-2">
            
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
