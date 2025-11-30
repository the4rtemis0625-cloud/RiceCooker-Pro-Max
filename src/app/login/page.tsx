import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-accent/20" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='180' height='180' viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cstyle%3E .float %7B animation: float 4s ease-in-out infinite; %7D @keyframes float %7B 0%25 %7B transform: translateY(0px) rotate(-2deg); %7D 50%25 %7B transform: translateY(-15px) rotate(2deg); %7D 100%25 %7B transform: translateY(0px) rotate(-2deg); %7D %7D %3C/style%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg transform='translate(10 10)'%3E%3Cpath d='M45.2,38.8c-2.6-1.5-4.5-4.2-5.1-7.3c-0.6-3.1,0.3-6.3,2.2-8.8c3.8-5,10.9-6.3,16.9-3.9c5.9,2.4,9.7,8.2,9.7,14.5 c0,2.6-0.6,5.1-1.7,7.4L45.2,38.8z M50,22c-2.8,0-5,2.2-5,5s2.2,5,5,5s5-2.2,5-5S52.8,22,50,22z' fill='%23F2E2CE'/%3E%3Cpath d='M50,5c-6.1,0-11,4.9-11,11s4.9,11,11,11s11-4.9,11-11S56.1,5,50,5z M50,22c-2.8,0-5-2.2-5-5s2.2-5,5-5s5,2.2,5,5 S52.8,22,50,22z' fill='%23D9A971' opacity='0.4'/%3E%3C/g%3E%3Cg class='float' transform='translate(80 70) rotate(15)' style='animation-delay: 1s;'%3E%3Cpath d='M25.5,12.5c-3.3,0-6-2.7-6-6s2.7-6,6-6s6,2.7,6,6S28.8,12.5,25.5,12.5z' fill='%23F2E2CE'/%3E%3Crect fill='%23D9A971' x='19.5' y='18.5' width='12' height='12' rx='6' opacity='0.4'/%3E%3C/g%3E%3Cg class='float' transform='translate(20 85) rotate(-30)'%3E%3Cpath d='M15,30C6.7,30,0,23.3,0,15S6.7,0,15,0s15,6.7,15,15S23.3,30,15,30z' fill='%23D9A971' opacity='0.3'/%3E%3Cpath d='M15,25c-5.5,0-10-4.5-10-10S9.5,5,15,5s10,4.5,10,10S20.5,25,15,25z' fill='%23FFFFFF'/%3E%3Cpath d='M18.5,18.5c-2.5,2.5-6.6,2.5-9.2,0c-2.2-2.2-2.5-5.6-0.9-8.1l9.2,9.2C19.1,13.8,19,16.3,18.5,18.5z' fill='%23F4C5C5'/%3E%3C/g%3E%3Cg class='float' transform='translate(130 140) rotate(25)' style='animation-delay: 2s;'%3E%3Cpath d='M22.5,15.5c-6.1,0-11-4.9-11-11s4.9-11,11-11s11,4.9,11,11S28.6,15.5,22.5,15.5z' fill='%23f2e2ce' opacity='0.8'/%3E%3Cpath d='M0,25.5 L45,25.5 L22.5,2.5 Z' fill='%233D3833'/%3E%3C/g%3E%3Cg class='float' transform='translate(140 20) rotate(-10)' style='animation-delay: 3s;'%3E%3Ccircle cx='10' cy='10' r='10' fill='%238dca8d'/%3E%3Ccircle cx='10' cy='25' r='10' fill='%23f4c5c5'/%3E%3Ccircle cx='10' cy='40' r='10' fill='%23ffffff'/%3E%3Crect x='8' y='5' width='4' height='50' fill='%23d9a971'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
