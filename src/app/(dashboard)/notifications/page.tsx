"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Trash2,
  Check,
  FileText,
  AlertCircle,
  TestTube
} from "lucide-react";
import {
  getNotificationHistory,
  clearNotificationHistory,
  markNotificationAsRead,
  NotificationItem,
} from "@/services/notifications";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    setNotifications(getNotificationHistory());
  }, []);

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
    setNotifications(getNotificationHistory());
  };

  const handleClearAll = () => {
    clearNotificationHistory();
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_BRIEFS":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "HALF_FULL_BRIEF":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "TEST_NOTIFICATION":
        return <TestTube className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationTitle = (notification: NotificationItem) => {
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
  };

  const getNotificationDescription = (notification: NotificationItem) => {
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
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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
                {notifications.length} notification{notifications.length !== 1 ? "s" : ""} total
                {unreadCount > 0 && ` (${unreadCount} unread)`}
              </CardDescription>
            </div>
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
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
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg space-y-2 transition-colors ${
                    notification.read ? "bg-muted/30" : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="space-y-1">
                        <p className="font-semibold">
                          {getNotificationTitle(notification)}
                          {!notification.read && (
                            <Badge variant="default" className="ml-2 text-xs bg-blue-500">
                              New
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getNotificationDescription(notification)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
