import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Notification, User } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Bell,
  Check,
  CheckCheck,
  Archive,
  Trash2,
  MoreVertical,
  Settings,
  Filter,
  Briefcase,
  Calendar,
  TrendingUp,
  Eye,
  MessageSquare,
  AlertCircle,
  CreditCard,
  Users,
  Bot,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationsPageProps {
  user: User;
}

interface NotificationFilters {
  read?: boolean;
  type?: string;
  priority?: string;
}

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

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export default function NotificationsPage({ user }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [activeTab, setActiveTab] = useState("all");

  const fetchNotifications = async (newFilters?: NotificationFilters) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      const currentFilters = { ...filters, ...newFilters };

      if (currentFilters.read !== undefined) {
        queryParams.append("read", currentFilters.read.toString());
      }
      if (currentFilters.type) {
        queryParams.append("type", currentFilters.type);
      }
      if (currentFilters.priority) {
        queryParams.append("priority", currentFilters.priority);
      }

      const response = await fetch(`/api/notifications?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      } else {
        throw new Error(data.message || "Failed to fetch notifications");
      }
    } catch (error) {
      toast.error("Failed to load notifications", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
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
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, read: true, readAt: new Date().toISOString() }
              : n,
          ),
        );
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
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            read: true,
            readAt: new Date().toISOString(),
          })),
        );
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const archiveNotification = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/archive`,
        {
          method: "PUT",
        },
      );
      const data = await response.json();

      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        toast.success("Notification archived");
      }
    } catch (error) {
      toast.error("Failed to archive notification");
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        toast.success("Notification deleted");
      }
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const newFilters: NotificationFilters = {};

    switch (tab) {
      case "unread":
        newFilters.read = false;
        break;
      case "read":
        newFilters.read = true;
        break;
      case "all":
      default:
        // No filter for "all"
        break;
    }

    setFilters(newFilters);
    fetchNotifications(newFilters);
  };

  const filterByType = (type: string) => {
    const newFilters = { ...filters, type };
    setFilters(newFilters);
    fetchNotifications(newFilters);
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

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "unread" && notification.read) return false;
    if (activeTab === "read" && !notification.read) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Notifications
              </h1>
              <div className="flex items-center space-x-2">
                <p className="text-muted-foreground">
                  Stay up to date with your activity
                </p>
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount} unread</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNotifications()}
              disabled={loading}
            >
              <RefreshCw
                className={cn("w-4 h-4 mr-2", loading && "animate-spin")}
              />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter by Type
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => setFilters({}) || fetchNotifications({})}
              >
                All Types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => filterByType("job_application")}>
                Job Applications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => filterByType("job_match")}>
                Job Matches
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => filterByType("interview_scheduled")}
              >
                Interviews
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => filterByType("ai_insight")}>
                AI Insights
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => filterByType("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
            <TabsTrigger value="read">
              Read ({notifications.length - unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                  Loading notifications...
                </span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No notifications found
                  </h3>
                  <p className="text-muted-foreground text-center max-w-sm">
                    {activeTab === "unread"
                      ? "You're all caught up! No unread notifications."
                      : activeTab === "read"
                        ? "No read notifications yet."
                        : "You don't have any notifications yet. When you do, they'll appear here."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const IconComponent =
                    notificationIcons[notification.type] || AlertCircle;

                  return (
                    <Card
                      key={notification.id}
                      className={cn(
                        "transition-all hover:shadow-md",
                        !notification.read &&
                          "border-l-4 border-l-primary bg-primary/5",
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div
                              className={cn(
                                "p-2 rounded-lg",
                                notification.read
                                  ? "bg-muted"
                                  : "bg-primary/10",
                              )}
                            >
                              <IconComponent
                                className={cn(
                                  "w-5 h-5",
                                  notification.read
                                    ? "text-muted-foreground"
                                    : "text-primary",
                                )}
                              />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3
                                    className={cn(
                                      "text-sm font-medium",
                                      !notification.read && "font-semibold",
                                    )}
                                  >
                                    {notification.title}
                                  </h3>
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      "text-xs",
                                      priorityColors[notification.priority],
                                    )}
                                  >
                                    {notification.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center space-x-4">
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(notification.createdAt)}
                                  </span>
                                  {notification.actionUrl &&
                                    notification.actionLabel && (
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0"
                                        asChild
                                      >
                                        <Link to={notification.actionUrl}>
                                          {notification.actionLabel}
                                        </Link>
                                      </Button>
                                    )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {!notification.read && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          markAsRead(notification.id)
                                        }
                                      >
                                        <Check className="w-4 h-4 mr-2" />
                                        Mark as read
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() =>
                                        archiveNotification(notification.id)
                                      }
                                    >
                                      <Archive className="w-4 h-4 mr-2" />
                                      Archive
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        deleteNotification(notification.id)
                                      }
                                      className="text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
