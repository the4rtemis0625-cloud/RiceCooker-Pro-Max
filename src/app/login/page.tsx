
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-accent/20 overflow-hidden relative" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d9a971' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
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

      <div className="absolute bottom-8 right-8 w-32 h-32 opacity-90 animate-slow-spin">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          {/* Bowl */}
          <path d="M 40 180 C 10 160, 10 90, 40 70 L 160 70 C 190 90, 190 160, 160 180 Z" fill="#e59866" stroke="#c0392b" stroke-width="5" />
          {/* Rice */}
          <path d="M 50 80 C 40 60, 160 60, 150 80 C 155 70, 145 55, 100 55 C 55 55, 45 70, 50 80 Z" fill="#fdfdfd" />
          <path d="M70,75 C72,73 74,73 76,75" stroke="#e6e6e6" fill="none" stroke-width="3" stroke-linecap="round"/>
          <path d="M90,72 C92,70 94,70 96,72" stroke="#e6e6e6" fill="none" stroke-width="3" stroke-linecap="round"/>
          <path d="M110,75 C112,73 114,73 116,75" stroke="#e6e6e6" fill="none" stroke-width="3" stroke-linecap="round"/>
          <path d="M130,72 C132,70 134,70 136,72" stroke="#e6e6e6" fill="none" stroke-width="3" stroke-linecap="round"/>
          <path d="M80,82 C82,80 84,80 86,82" stroke="#e6e6e6" fill="none" stroke-width="3" stroke-linecap="round"/>
          <path d="M100,85 C102,83 104,83 106,85" stroke="#e6e6e6" fill="none" stroke-width="3" stroke-linecap="round"/>
          <path d="M120,82 C122,80 124,80 126,82" stroke="#e6e6e6" fill="none" stroke-width="3" stroke-linecap="round"/>
          <rect x="35" y="65" width="130" height="10" rx="5" fill="#f5cba7" />
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
