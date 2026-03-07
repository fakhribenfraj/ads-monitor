"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import {
  Bell,
  Trash2,
  Check,
  FileText,
  AlertCircle,
  TestTube,
  Loader2,
} from "lucide-react";
import {
  getNotificationHistory,
  clearNotificationHistory,
  markNotificationAsRead,
  NotificationItem,
} from "@/services/notifications";

interface DbNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  briefId: string | null;
  brief?: {
    campaignName: string;
  } | null;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [dbNotifications, setDbNotifications] = useState<DbNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setNotifications(getNotificationHistory());
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchDbNotifications();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchDbNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/notifications?userId=${session?.user?.id}`,
      );
      const data = await response.json();
      if (data.response) {
        setDbNotifications(data.response);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
    setNotifications(getNotificationHistory());
  };

  const handleMarkDbNotificationAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: true }),
      });
      setDbNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleClearAll = () => {
    clearNotificationHistory();
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_BRIEF":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "BRIEF_STATUS_CHANGED":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "TEST_NOTIFICATION":
        return <TestTube className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationTitle = (
    notification: NotificationItem | DbNotification,
  ) => {
    if ("count" in notification) {
      switch (notification.type) {
        case "NEW_BRIEFS":
          return notification.count === 1
            ? "New Brief Available!"
            : `${notification.count} New Briefs Available!`;
        case "HALF_FULL_BRIEF":
          return "Brief Half Full!";
        case "TEST_NOTIFICATION":
          return "Test Notification";
        default:
          return "Notification";
      }
    }
    return notification.title;
  };

  const getNotificationDescription = (
    notification: NotificationItem | DbNotification,
  ) => {
    if ("count" in notification) {
      switch (notification.type) {
        case "NEW_BRIEFS":
          return notification.count === 1
            ? `Brief ID: ${notification.briefIds?.[0] || notification.briefId || "N/A"}`
            : `${notification.count} new briefs found`;
        case "HALF_FULL_BRIEF":
          return `Brief ID: ${notification.briefId || "N/A"}`;
        case "TEST_NOTIFICATION":
          return "Test notification sent";
        default:
          return "";
      }
    }
    return notification.message;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const localUnreadCount = notifications.filter((n) => !n.read).length;
  const dbUnreadCount = dbNotifications.filter((n) => !n.read).length;
  const totalUnread = localUnreadCount + dbUnreadCount;

  const isDbNotification = (
    n: NotificationItem | DbNotification,
  ): n is DbNotification => {
    return "createdAt" in n && !("count" in n);
  };

  const allNotifications: (NotificationItem | DbNotification)[] = [
    ...dbNotifications.map((n) => ({ ...n, read: n.read })),
    ...notifications,
  ].sort((a, b) => {
    const dateA = isDbNotification(a)
      ? new Date(a.createdAt).getTime()
      : new Date(a.timestamp).getTime();
    const dateB = isDbNotification(b)
      ? new Date(b.createdAt).getTime()
      : new Date(b.timestamp).getTime();
    return dateB - dateA;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification History
              </CardTitle>
              <CardDescription>
                {allNotifications.length} notification
                {allNotifications.length !== 1 ? "s" : ""} total
                {totalUnread > 0 && ` (${totalUnread} unread)`}
              </CardDescription>
            </div>
            {allNotifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : allNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Notifications will appear here when new briefs are detected
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allNotifications.map((notification) => {
                const isDb = isDbNotification(notification);
                const id = isDb ? notification.id : notification.id;
                const read = isDb ? notification.read : notification.read;

                return (
                  <div
                    key={`${isDb ? "db-" : "local-"}${id}`}
                    className={`p-4 border rounded-lg space-y-2 transition-colors ${
                      read ? "bg-muted/30" : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {isDb
                          ? getNotificationIcon(
                              (notification as DbNotification).type,
                            )
                          : getNotificationIcon(
                              (notification as NotificationItem).type,
                            )}
                        <div className="space-y-1">
                          <span className="font-semibold">
                            {getNotificationTitle(notification)}
                            {!read && (
                              <Badge
                                variant="default"
                                className="ml-2 text-xs bg-blue-500"
                              >
                                New
                              </Badge>
                            )}
                          </span>
                          <p className="text-sm text-muted-foreground">
                            {getNotificationDescription(notification)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isDb
                              ? formatDate(
                                  (notification as DbNotification).createdAt,
                                )
                              : formatDate(
                                  (notification as NotificationItem).timestamp,
                                )}
                          </p>
                        </div>
                      </div>
                      {!read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            isDb
                              ? handleMarkDbNotificationAsRead(id)
                              : handleMarkAsRead(id)
                          }
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
