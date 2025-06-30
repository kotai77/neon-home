import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Notification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Bell,
  Check,
  CheckCheck,
  Briefcase,
  Calendar,
  TrendingUp,
  Eye,
  MessageSquare,
  AlertCircle,
  CreditCard,
  Users,
  Bot,
  Archive,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const notificationIcons = {
  job_application: Briefcase,
  application_status: CheckCheck,
  interview_scheduled: Calendar,
  interview_reminder: Calendar,
  job_match: TrendingUp,
  profile_view: Eye,
  message: MessageSquare,
  system: AlertCircle,
  billing: CreditCard,
  team_invite: Users,
  ai_insight: Bot,
};

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Only fetch unread notifications for the dropdown
      const response = await fetch("/api/notifications?read=false&limit=5");
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
        },
      );
      const data = await response.json();

      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PUT",
      });
      const data = await response.json();

      if (data.success) {
        setNotifications([]);
        setUnreadCount(0);
        toast.success("All notifications marked as read");
        setIsOpen(false);
      }
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" sideOffset={5}>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-1 text-xs"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Bell className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No new notifications
            </p>
            <p className="text-xs text-muted-foreground">
              You're all caught up!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-1">
              {notifications.map((notification) => {
                const IconComponent =
                  notificationIcons[notification.type] || AlertCircle;

                return (
                  <div
                    key={notification.id}
                    className="group relative p-3 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-b-0"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="p-1.5 bg-primary/10 rounded-full">
                          <IconComponent className="w-3 h-3 text-primary" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatTime(notification.createdAt)}
                              </span>
                              {notification.actionUrl &&
                                notification.actionLabel && (
                                  <Link
                                    to={notification.actionUrl}
                                    className="text-xs text-primary hover:underline"
                                    onClick={() => {
                                      markAsRead(notification.id);
                                      setIsOpen(false);
                                    }}
                                  >
                                    {notification.actionLabel}
                                  </Link>
                                )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <DropdownMenuSeparator />
        <div className="p-2 space-y-1">
          <DropdownMenuItem asChild>
            <Link
              to="/notifications"
              className="w-full flex items-center justify-center text-sm"
              onClick={() => setIsOpen(false)}
            >
              <Archive className="w-4 h-4 mr-2" />
              View all notifications
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              to="/settings"
              className="w-full flex items-center justify-center text-sm"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Notification settings
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
