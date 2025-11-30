
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-accent/20 overflow-hidden relative" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cg id='onigiri'%3E%3Cpath d='M60 20 L20 80 L100 80 Z' fill='%23F5F5F5'/%3E%3Crect x='35' y='75' width='50' height='15' fill='%234CAF50'/%3E%3Cellipse cx='45' cy='50' rx='5' ry='6' fill='black'/%3E%3Cellipse cx='75' cy='50' rx='5' ry='6' fill='black'/%3E%3C/g%3E%3Cg id='sushi'%3E%3Cellipse cx='60' cy='60' rx='30' ry='15' fill='%23FFF' /%3E%3Cpath d='M30 60 C 30 50, 90 50, 90 60' fill='%23FF6F61' /%3E%3Crect x='25' y='58' width='70' height='4' fill='%23333' /%3E%3C/g%3E%3Cg id='ricebowl'%3E%3Cpath d='M20 70 C 20 90, 80 90, 80 70' fill='%23FFF' /%3E%3Cpath d='M20 70 Q 50 50, 80 70' fill='%23F5F5F5' /%3E%3Cellipse cx='40' cy='65' rx='3' ry='2' fill='black'/%3E%3Cellipse cx='60' cy='65' rx='3' ry='2' fill='black'/%3E%3Cpath d='M45 75 Q 50 80, 55 75' stroke='black' stroke-width='1.5' fill='none'/%3E%3C/g%3E%3C/defs%3E%3Crect width='120' height='120' fill='%23fdfaf7' /%3E%3Cg opacity='0.2'%3E%3Cuse href='%23onigiri' transform='translate(10 10) scale(0.4)'/%3E%3Cuse href='%23sushi' transform='translate(70 20) scale(0.35)'/%3E%3Cuse href='%23ricebowl' transform='translate(20 70) scale(0.5)'/%3E%3Cuse href='%23onigiri' transform='translate(80 90) scale(0.3)'/%3E%3C/g%3E%3C/svg%3E")`
    }}>
      <div className="absolute top-1/4 left-1/2 w-48 h-48 opacity-80 animate-slide-horizontal">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          {/* Body */}
          <path d="M 30 180 C 10 160, 10 100, 30 80 L 170 80 C 190 100, 190 160, 170 180 Z" fill="#e57373" stroke="#c25a5a" strokeWidth="4"/>
          {/* Lid */}
          <path d="M 40 80 C 20 60, 70 20, 100 20 C 130 20, 180 60, 160 80 Z" fill="#e0e0e0" stroke="#bdbdbd" strokeWidth="4"/>
          {/* Lid Handle */}
          <ellipse cx="100" cy="20" rx="15" ry="5" fill="#b0bec5" stroke="#78909c" strokeWidth="2"/>
          <ellipse cx="100" cy="15" rx="10" ry="3" fill="#cfd8dc" />
          {/* Rice */}
          <circle cx="100" cy="65" r="50" fill="white" />
          <text x="60" y="60" fontSize="10" fill="#333">,,,,</text>
          <text x="80" y="55" fontSize="10" fill="#333">'''</text>
          <text x="100" y="60" fontSize="10" fill="#333">,,,</text>
          <text x="120" y="58" fontSize="10" fill="#333">''',</text>
          <text x="70" y="70" fontSize="10" fill="#333">,,'''</text>
          <text x="90" y="75" fontSize="10" fill="#333">,,','</text>
          <text x="110" y="70" fontSize="10" fill="#333">''',,</text>
           {/* Control Panel */}
          <rect x="75" y="120" width="50" height="30" rx="5" fill="#eeeeee" stroke="#bdbdbd" strokeWidth="2" />
          <rect x="82" y="125" width="15" height="8" rx="2" fill="#ffb74d" />
          <rect x="82" y="135" width="36" height="10" rx="2" fill="#90a4ae" />
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
