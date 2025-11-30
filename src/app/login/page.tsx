
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-accent/20 overflow-hidden relative" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d9a971' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
    }}>
      <div className="absolute top-1/4 left-1/4 w-32 h-32 opacity-80 animate-gentle-float">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M50,10 C20,20 10,60 50,90 C90,60 80,20 50,10" fill="#FFFFFF" transform="rotate(15 50 50)"/>
          <path d="M25,85 H75 V95 H25 Z" fill="#3D4C53"/>
          <circle cx="38" cy="55" r="4" fill="black"/>
          <circle cx="62" cy="55" r="4" fill="black"/>
          <path d="M45,68 Q50,75 55,68" stroke="black" strokeWidth="2.5" fill="none" />
          <path d="M20 70 L 10 90 L30 90 Z" fill="#F4A460" transform="translate(-5, -20) rotate(-15)"/>
          <path d="M80 70 L 90 90 L 70 90 Z" fill="#F4A460" transform="translate(5, -20) rotate(15)"/>
        </svg>
      </div>

      <Card className={cn(
          "w-full max-w-md z-10",
          "border-primary/20 shadow-lg"
        )}>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-wider text-primary">Ultimate Rice Cooker Pro Max</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      
    </main>
  );
}
