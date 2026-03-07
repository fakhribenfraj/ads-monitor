"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Bell,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  unreadCount?: number;
}

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Briefs",
    href: "/briefs",
    icon: FileText,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
];

const bottomNavItems = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function NavDrawer({ isOpen, onClose, onLogout, unreadCount = 0 }: NavDrawerProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-background border-r transform transition-transform duration-200 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-4 h-16 ">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-muted md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

          <nav className="p-4 space-y-2">
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              const showBadge = item.href === "/notifications" && unreadCount > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                  {showBadge && (
                    <Badge variant="destructive" className="ml-auto">
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t space-y-1">
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              );
            })}

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}

export function MobileNavToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-md hover:bg-muted md:hidden"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
}
