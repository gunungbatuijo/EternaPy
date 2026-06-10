import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, useUser, useClerk } from "@clerk/react";
import { 
  BookOpen, 
  Terminal, 
  LayoutDashboard, 
  Trophy, 
  Medal, 
  Settings, 
  LogOut, 
  Menu,
  X,
  CreditCard,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useGetUserProfile } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [location, setLocation] = useLocation();
  const { data: profile, isLoading: isProfileLoading } = useGetUserProfile({ 
    query: { 
      enabled: isSignedIn,
      retry: false
    } 
  });

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Courses", href: "/courses", icon: BookOpen },
    { name: "Challenges", href: "/challenges", icon: Terminal },
    { name: "Leaderboard", href: "/leaderboard", icon: Medal },
    { name: "Achievements", href: "/achievements", icon: Trophy },
  ];

  const handleLogout = () => {
    signOut({ redirectUrl: import.meta.env.BASE_URL || "/" });
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="EternaPy" className="w-8 h-8" />
              <span className="font-bold text-xl tracking-tight text-primary">EternaPy</span>
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button variant="outline" asChild className="hidden sm:inline-flex">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Start Learning</Link>
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="EternaPy" className="w-8 h-8" />
            <span className="font-bold text-xl tracking-tight text-primary">EternaPy</span>
          </Link>
        </div>
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start ${isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground hover:text-foreground"}`}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.name}
                </Link>
              </Button>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-border">
          {isProfileLoading ? (
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ) : profile ? (
            <Link href="/profile" className="flex items-center gap-3 mb-4 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
              <img src={profile.avatarUrl || user?.imageUrl} alt={profile.displayName} className="w-10 h-10 rounded-full border border-border" />
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">{profile.displayName}</span>
                <span className="text-xs text-muted-foreground mt-1">Lvl {profile.level} • {profile.xp} XP</span>
              </div>
            </Link>
          ) : null}
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" asChild>
              <Link href="/pricing">
                <CreditCard className="mr-2 h-5 w-5" />
                Plan
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={handleLogout}>
              <LogOut className="mr-2 h-5 w-5" />
              Log Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-16 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-50">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="EternaPy" className="w-8 h-8" />
            <span className="font-bold text-xl text-primary">EternaPy</span>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col">
              <div className="h-16 flex items-center px-6 border-b border-border">
                <span className="font-bold text-xl text-primary">Menu</span>
              </div>
              <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                  const isActive = location.startsWith(item.href);
                  return (
                    <Button
                      key={item.name}
                      variant={isActive ? "secondary" : "ghost"}
                      className={`w-full justify-start ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                      asChild
                    >
                      <Link href={item.href}>
                        <item.icon className="mr-2 h-5 w-5" />
                        {item.name}
                      </Link>
                    </Button>
                  );
                })}
              </div>
              <div className="p-4 border-t border-border space-y-1">
                <Button variant="ghost" className="w-full justify-start text-muted-foreground" asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-5 w-5" />
                    Profile
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
                  <LogOut className="mr-2 h-5 w-5" />
                  Log Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
