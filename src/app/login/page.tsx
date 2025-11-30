import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-accent/20" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cstyle%3E .float %7B animation: float 8s ease-in-out infinite; %7D @keyframes float %7B 0%25 %7B transform: translateY(0px) translateX(0px) rotate(-3deg) scale(1); %7D 25%25 %7B transform: translateY(-15px) translateX(20px) rotate(5deg) scale(1.05); %7D 50%25 %7B transform: translateY(-5px) translateX(-20px) rotate(-5deg) scale(1); %7D 75%25 %7B transform: translateY(10px) translateX(15px) rotate(3deg) scale(1.05); %7D 100%25 %7B transform: translateY(0px) translateX(0px) rotate(-3deg) scale(1); %7D %7D %3C/style%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg class='float' transform='translate(150 20) rotate(-10) scale(0.9)' style='animation-delay: 0s;'%3E%3Cpath d='M25.5,12.5c-3.3,0-6-2.7-6-6s2.7-6,6-6s6,2.7,6,6S28.8,12.5,25.5,12.5z' fill='%23F2E2CE'/%3E%3Crect fill='%23D9A971' x='19.5' y='18.5' width='12' height='12' rx='6' opacity='0.4'/%3E%3C/g%3E%3Cg class='float' transform='translate(20 85) rotate(20) scale(1.1)' style='animation-delay: 1.5s;'%3E%3Cpath d='M15,25c-5.5,0-10-4.5-10-10S9.5,5,15,5s10,4.5,10,10S20.5,25,15,25z' fill='%23FFFFFF'/%3E%3Cpath d='M15,5 C7,5 5,12 5,15 C5,18 7,20 15,20 C23,20 25,18 25,15 C25,12 23,5 15,5z' fill='%23F2E2CE'/%3E%3Cpath d='M15,30C6.7,30,0,23.3,0,15S6.7,0,15,0s15,6.7,15,15S23.3,30,15,30z' fill='%23D9A971' opacity='0.3'/%3E%3C/g%3E%3Cg class='float' transform='translate(130 140) rotate(-15) scale(0.8)' style='animation-delay: 3s;'%3E%3Cpath d='M22.5,2.5 L11.5,22.5 L33.5,22.5 Z' fill='%23FFFFFF'/%3E%3Crect x='11.5' y='22.5' width='22' height='5' fill='%233D3833' opacity='0.8'/%3E%3Cpath d='M22.5,2.5 L11.5,22.5 L33.5,22.5 Z' fill='%23f2e2ce' opacity='0.8' transform='translate(0, -2)'/%3E%3C/g%3E%3Cg class='float' transform='translate(80 50) rotate(5) scale(1.2)' style='animation-delay: 4.5s;'%3E%3Ccircle cx='10' cy='10' r='10' fill='%238dca8d'/%3E%3Ccircle cx='10' cy='25' r='10' fill='%23f4c5c5'/%3E%3Ccircle cx='10' cy='40' r='10' fill='%23ffffff'/%3E%3Crect x='8' y='5' width='4' height='50' fill='%23d9a971'/%3E%3C/g%3E%3Cg class='float' transform='translate(30 10) rotate(15) scale(1)' style='animation-delay: 6s;'%3E%3Cpath d='M50,5c-6.1,0-11,4.9-11,11s4.9,11,11,11s11-4.9,11-11S56.1,5,50,5z M50,22c-2.8,0-5-2.2-5-5s2.2-5,5-5s5,2.2,5,5 S52.8,22,50,22z' fill='%23D9A971' opacity='0.4' transform='scale(0.5)'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat',
    }}>
      
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
