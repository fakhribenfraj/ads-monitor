"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { NavDrawer, MobileNavToggle } from "@/components/NavDrawer";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BellOff, Bell } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>("default");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/notifications?userId=${session.user.id}`);
          const data = await response.json();
          if (data.response) {
            const unread = data.response.filter((n: { read: boolean }) => !n.read).length;
            setUnreadCount(unread);
          }
        } catch (error) {
          console.error("Error fetching unread count:", error);
        }
      }
    };
    fetchUnreadCount();
  }, [session, pathname]);

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
    }
  };

  useEffect(() => {
    setIsNavOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    // Clear any local storage data
    localStorage.removeItem("lastBriefId");
    localStorage.removeItem("credentials");
    localStorage.removeItem("accessToken");
    router.push("/");
  };

  const isAuthPage = pathname === "/";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen h-screen md:pl-64">
      <header className="sticky top-0 z-30 flex h-auto min-h-[4rem] items-center gap-4 border-b bg-background px-4 md:px-6 py-2">
        <MobileNavToggle onClick={() => setIsNavOpen(true)} />
        <div className="flex-1" />
        {notificationStatus === "granted" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="h-4 w-4" />
            <span>Notifications enabled</span>
          </div>
        ) : (
          <Alert variant={notificationStatus === "denied" ? "destructive" : "warning"} className="py-2 px-3">
            <AlertDescription className="flex items-center justify-between gap-3">
              <span className="text-sm">
                {notificationStatus === "denied"
                  ? "Notifications blocked"
                  : "Enable notifications to receive alerts"}
              </span>
              {notificationStatus !== "denied" && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={requestNotificationPermission}
                  className="shrink-0"
                >
                  <BellOff className="h-4 w-4 mr-1" />
                  Enable
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
      </header>

      <main className="p-4 md:p-6 h-[calc(100vh-4rem)]">{children}</main>
      <NavDrawer
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        onLogout={handleLogout}
        unreadCount={unreadCount}
      />
    </div>
  );
}
