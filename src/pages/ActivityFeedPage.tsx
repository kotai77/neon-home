import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePersistentActivities } from "@/hooks/usePersistentState";
import { User } from "@/lib/types";
import {
  Bell,
  Search,
  Filter,
  MoreHorizontal,
  Check,
  Trash2,
} from "lucide-react";

interface ActivityFeedPageProps {
  user: User;
}

const ActivityFeedPage: React.FC<ActivityFeedPageProps> = ({ user }) => {
  const [activities, setActivities, isLoaded] = usePersistentActivities();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const { toast } = useToast();

  const filteredActivities = useMemo(() => {
    if (!activities) return [];

    return activities.filter((activity) => {
      const matchesSearch =
        (activity.title || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (activity.message || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || (filterStatus === "unread" && !activity.read);
      const matchesType = filterType === "all" || activity.type === filterType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [activities, searchTerm, filterStatus, filterType]);

  const handleMarkAsRead = (activityId: string) => {
    if (!activities) return;

    try {
      const updatedActivities = activities.map((activity) =>
        activity.id === activityId ? { ...activity, read: true } : activity,
      );
      setActivities(updatedActivities);
      toast({ title: "Marked as Read" });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleMarkAllAsRead = () => {
    if (!activities) return;

    try {
      const updatedActivities = activities.map((activity) => ({
        ...activity,
        read: true,
      }));
      setActivities(updatedActivities);
      toast({ title: "All Activities Marked as Read" });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleDeleteActivity = (activityId: string) => {
    if (!activities) return;

    try {
      const updatedActivities = activities.filter(
        (activity) => activity.id !== activityId,
      );
      setActivities(updatedActivities);
      toast({ title: "Activity Deleted" });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading activities...</p>
        </div>
      </div>
    );
  }

  const unreadCount = activities?.filter((a) => !a.read).length || 0;
  const highPriorityCount =
    activities?.filter((a) => a.priority === "high").length || 0;

  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Activity Feed</h1>
          <p className="text-muted-foreground">
            Stay updated with your latest activities
          </p>
        </div>
        <Button onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
          <Check className="h-4 w-4 mr-2" />
          Mark All as Read
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{activities?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total Activities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">Unread</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{highPriorityCount}</div>
            <p className="text-xs text-muted-foreground">High Priority</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">High Priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="unread">Unread Only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="application_received">Applications</SelectItem>
            <SelectItem value="interview_scheduled">Interviews</SelectItem>
            <SelectItem value="job_published">Jobs</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setSearchTerm("");
            setFilterStatus("all");
            setFilterType("all");
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                No Activities Found
              </h3>
              <p className="text-muted-foreground">
                Your activities will appear here when they occur.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredActivities.map((activity) => (
            <Card
              key={activity.id}
              className={`transition-all hover:shadow-md ${!activity.read ? "border-primary" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedActivities.includes(activity.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedActivities([
                            ...selectedActivities,
                            activity.id,
                          ]);
                        } else {
                          setSelectedActivities(
                            selectedActivities.filter(
                              (id) => id !== activity.id,
                            ),
                          );
                        }
                      }}
                    />
                    {!activity.read && (
                      <div
                        className="w-2 h-2 bg-primary rounded-full"
                        data-testid="unread-indicator"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div data-testid={`icon-${activity.type.split("_")[0]}`}>
                        <Bell className="h-4 w-4" />
                      </div>
                      <h3 className="font-semibold text-sm">
                        {activity.title}
                      </h3>
                      <Badge
                        variant={
                          activity.priority === "high"
                            ? "destructive"
                            : activity.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {activity.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!activity.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(activity.id)}
                      >
                        Mark as Read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteActivity(activity.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Bulk Actions */}
      {selectedActivities.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4">
          <span className="text-sm font-medium">
            {selectedActivities.length} selected
          </span>
          <Button variant="outline" size="sm">
            Mark Selected as Read
          </Button>
          <Button variant="destructive" size="sm">
            Delete Selected
          </Button>
        </div>
      )}

      <div role="status" aria-live="polite" className="sr-only">
        Activity feed updated
      </div>
    </main>
  );
};

export default ActivityFeedPage;
