import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { authService } from "@/lib/auth";
import { User, assert } from "@/lib/types";
import { logger } from "@/lib/api";
import { persistenceService } from "@/lib/persistence";

// Pages
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Navigation from "./components/Navigation";

// Import placeholder page components (to be implemented)
import JobManagement from "./pages/JobManagement";
import JobDetailsPage from "./pages/JobDetailsPage";
import ApplicationManagement from "./pages/ApplicationManagement";
import SearchPage from "./pages/SearchPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import NotificationsPage from "./pages/NotificationsPage";
import BillingPage from "./pages/BillingPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import InterviewsPage from "./pages/InterviewsPage";
import ScrapingPage from "./pages/ScrapingPage";
import ActivityFeedPage from "./pages/ActivityFeedPage";
import CandidateManagement from "./pages/CandidateManagement";
import JobPostingPage from "./pages/JobPostingPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({
  children,
  user,
  requireRole,
}: {
  children: React.ReactNode;
  user: User | null;
  requireRole?: "recruiter" | "applicant";
}) => {
  if (!user) {
    logger.warn("Unauthorized access attempt - no user");
    return <Navigate to="/" replace />;
  }

  if (requireRole && user.role !== requireRole) {
    logger.warn("Unauthorized access attempt - wrong role", {
      userRole: user.role,
      requiredRole: requireRole,
    });
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Placeholder Component for unimplemented pages
const PlaceholderPage = ({
  title,
  description,
  comingSoon = true,
}: {
  title: string;
  description: string;
  comingSoon?: boolean;
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">{title}</h1>
          <p className="text-xl text-muted-foreground mb-8">{description}</p>
          <div className="bg-white rounded-xl border p-8 shadow-sm">
            <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-brand/20 rounded-full animate-pulse"></div>
            </div>
            {comingSoon ? (
              <p className="text-muted-foreground">
                This feature is coming soon...
              </p>
            ) : (
              <p className="text-muted-foreground">
                This feature is being implemented...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      logger.info("Initializing authentication");

      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        logger.info("User authenticated", {
          userId: currentUser.id,
          role: currentUser.role,
        });
        setUser(currentUser);
      } else {
        logger.info("No authenticated user found");
      }
    } catch (error) {
      logger.error("Authentication initialization failed", { error });
      setUser(null);
    } finally {
      setIsLoading(false);
      setIsAuthInitialized(true);
    }
  };

  const handleLogout = async () => {
    try {
      const userId = user?.id;
      logger.info("Logging out user", { userId });

      // Clear persisted user data
      if (userId) {
        try {
          persistenceService.clearUserData(userId);
          logger.info("User data cleared on logout", { userId });
        } catch (error) {
          logger.error("Failed to clear user data", { userId, error });
        }
      }

      await authService.logout();
      setUser(null);
      logger.info("User logged out successfully");
    } catch (error) {
      logger.error("Logout failed", { error });
    }
  };

  const handleLogin = (newUser: User) => {
    assert(newUser !== null, "User must be provided for login");
    logger.info("User logged in", { userId: newUser.id, role: newUser.role });
    setUser(newUser);
  };

  // Show loading spinner while checking authentication
  if (isLoading || !isAuthInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Skillmatch...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen">
            <Routes>
              {/* Public routes */}
              <Route
                path="/"
                element={
                  user ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Index onLogin={handleLogin} />
                  )
                }
              />
              <Route
                path="/login"
                element={
                  user ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Index onLogin={handleLogin} />
                  )
                }
              />
              <Route
                path="/register"
                element={
                  user ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Index onLogin={handleLogin} />
                  )
                }
              />

              {/* Protected routes with navigation */}
              <Route
                path="/*"
                element={
                  <div>
                    <Navigation user={user} onLogout={handleLogout} />
                    <Routes>
                      {/* Main Dashboard */}
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute user={user}>
                            <Dashboard user={user!} />
                          </ProtectedRoute>
                        }
                      />

                      {/* Job Management Routes */}
                      <Route
                        path="/jobs"
                        element={
                          <ProtectedRoute user={user}>
                            <JobManagement user={user!} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/jobs/new"
                        element={
                          <ProtectedRoute user={user} requireRole="recruiter">
                            <JobPostingPage user={user!} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/jobs/:id"
                        element={
                          <ProtectedRoute user={user}>
                            <JobDetailsPage user={user!} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/jobs/:id/applications"
                        element={
                          <ProtectedRoute user={user} requireRole="recruiter">
                            <PlaceholderPage
                              title="Job Applications"
                              description="Review and manage applications for this job posting"
                            />
                          </ProtectedRoute>
                        }
                      />

                      {/* Application Management Routes */}
                      <Route
                        path="/applications"
                        element={
                          <ProtectedRoute user={user}>
                            <ApplicationManagement user={user!} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/applications/:id"
                        element={
                          <ProtectedRoute user={user}>
                            <PlaceholderPage
                              title="Application Details"
                              description="View detailed application information and AI analysis"
                            />
                          </ProtectedRoute>
                        }
                      />

                      {/* Candidate Management (Recruiters only) */}
                      <Route
                        path="/applicants"
                        element={
                          <ProtectedRoute user={user} requireRole="recruiter">
                            <CandidateManagement user={user!} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/applicants/:id"
                        element={
                          <ProtectedRoute user={user} requireRole="recruiter">
                            <PlaceholderPage
                              title="Candidate Profile"
                              description="View detailed candidate information and history"
                            />
                          </ProtectedRoute>
                        }
                      />

                      {/* Search & Discovery */}
                      <Route
                        path="/search"
                        element={
                          <ProtectedRoute user={user}>
                            <SearchPage user={user!} />
                          </ProtectedRoute>
                        }
                      />

                      {/* Profile & Settings */}
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute user={user}>
                            <ProfilePage user={user!} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute user={user}>
                            <SettingsPage user={user!} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings/ai"
                        element={
                          <ProtectedRoute user={user}>
                            <PlaceholderPage
                              title="AI Configuration"
                              description="Configure AI providers, models, and matching preferences"
                            />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings/team"
                        element={
                          <ProtectedRoute user={user} requireRole="recruiter">
                            <PlaceholderPage
                              title="Team Management"
                              description="Manage team members and permissions"
                            />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings/integrations"
                        element={
                          <ProtectedRoute user={user}>
                            <PlaceholderPage
                              title="Integrations"
                              description="Connect with third-party tools and platforms"
                            />
                          </ProtectedRoute>
                        }
                      />

                      {/* Analytics & Reporting */}
                      <Route
                        path="/analytics"
                        element={
                          <ProtectedRoute user={user}>
                            <AnalyticsPage user={user!} />
                          </ProtectedRoute>
                        }
                      />

                      {/* Billing & Subscription */}
                      <Route
                        path="/billing"
                        element={
                          <ProtectedRoute user={user}>
                            <BillingPage user={user!} />
                          </ProtectedRoute>
                        }
                      />

                      {/* Communication & Scheduling */}
                      <Route
                        path="/interviews"
                        element={
                          <ProtectedRoute user={user}>
                            <InterviewsPage user={user!} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/messages"
                        element={
                          <ProtectedRoute user={user}>
                            <PlaceholderPage
                              title="Messages"
                              description="Communicate with candidates and team members"
                            />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/calendar"
                        element={
                          <ProtectedRoute user={user}>
                            <PlaceholderPage
                              title="Calendar"
                              description="Manage interviews and important events"
                            />
                          </ProtectedRoute>
                        }
                      />

                      {/* AI & Automation Tools */}
                      <Route
                        path="/scraper"
                        element={
                          <ProtectedRoute user={user} requireRole="recruiter">
                            <ScrapingPage user={user!} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/ai-tools"
                        element={
                          <ProtectedRoute user={user}>
                            <PlaceholderPage
                              title="AI Tools"
                              description="Advanced AI tools for recruitment optimization"
                            />
                          </ProtectedRoute>
                        }
                      />

                      {/* File Management */}
                      <Route
                        path="/files"
                        element={
                          <ProtectedRoute user={user}>
                            <PlaceholderPage
                              title="File Management"
                              description="Manage uploaded resumes, documents, and media files"
                            />
                          </ProtectedRoute>
                        }
                      />

                      {/* Help & Support */}
                      <Route
                        path="/help"
                        element={
                          <ProtectedRoute user={user}>
                            <PlaceholderPage
                              title="Help Center"
                              description="Find answers, tutorials, and get support"
                            />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/support"
                        element={
                          <ProtectedRoute user={user}>
                            <PlaceholderPage
                              title="Contact Support"
                              description="Get help from our support team"
                            />
                          </ProtectedRoute>
                        }
                      />

                      {/* API Documentation */}
                      <Route
                        path="/api-docs"
                        element={
                          <ProtectedRoute user={user}>
                            <PlaceholderPage
                              title="API Documentation"
                              description="Integration guides and API reference documentation"
                            />
                          </ProtectedRoute>
                        }
                      />

                      {/* Admin Routes */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute user={user}>
                            <PlaceholderPage
                              title="Admin Dashboard"
                              description="System administration and monitoring"
                            />
                          </ProtectedRoute>
                        }
                      />

                      {/* Demo & Testing */}
                      <Route
                        path="/demo"
                        element={
                          <ProtectedRoute user={user}>
                            <PlaceholderPage
                              title="Demo Features"
                              description="Explore demo features and sample data"
                            />
                          </ProtectedRoute>
                        }
                      />

                      {/* Activity & Notifications */}
                      <Route
                        path="/activity"
                        element={
                          <ProtectedRoute user={user}>
                            <ActivityFeedPage user={user!} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/notifications"
                        element={
                          <ProtectedRoute user={user}>
                            <NotificationsPage user={user!} />
                          </ProtectedRoute>
                        }
                      />

                      {/* 404 Route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
