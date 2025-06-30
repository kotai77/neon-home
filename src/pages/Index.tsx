import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  Users,
  Zap,
  Search,
  Shield,
  TrendingUp,
  CheckCircle,
  Star,
  ArrowRight,
  Play,
  Github,
  Linkedin,
  Globe,
  Brain,
  Target,
  Clock,
  CreditCard,
  Loader2,
} from "lucide-react";
import { authService, demoUsers } from "@/lib/auth";
import { User, assert } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/api";

interface IndexProps {
  onLogin: (user: User) => void;
}

export default function Index({ onLogin }: IndexProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "applicant" as "recruiter" | "applicant",
    company: "",
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          logger.info("User already authenticated, redirecting");
          onLogin(currentUser);
          navigate("/dashboard");
        }
      } catch (error) {
        // User not logged in, continue to landing page
        logger.info("No authenticated user, showing landing page");
      }
    };
    checkAuth();
  }, [navigate, onLogin]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDemoLogin = async (userType: "recruiter" | "applicant") => {
    assert(
      userType === "recruiter" || userType === "applicant",
      "Invalid user type",
    );

    setIsLoading(true);
    try {
      logger.info("Starting demo login", { userType });

      const credentials = demoUsers[userType];
      const { user: loggedInUser, token } = await authService.login(
        credentials.email,
        credentials.password,
      );

      // Store auth data
      localStorage.setItem("auth-token", token);
      localStorage.setItem("user-data", JSON.stringify(loggedInUser));

      toast({
        title: "Demo Login Successful",
        description: `Welcome to Skillmatch! You're logged in as a ${userType}.`,
      });

      logger.info("Demo login successful", {
        userId: loggedInUser.id,
        role: loggedInUser.role,
      });

      onLogin(loggedInUser);
      navigate("/dashboard");
    } catch (error) {
      logger.error("Demo login failed", { error, userType });
      toast({
        title: "Demo Login Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      logger.info("Attempting sign in", { email: formData.email });

      const { user: loggedInUser, token } = await authService.login(
        formData.email,
        formData.password,
      );

      // Store auth data
      localStorage.setItem("auth-token", token);
      localStorage.setItem("user-data", JSON.stringify(loggedInUser));

      toast({
        title: "Sign In Successful",
        description: `Welcome back, ${loggedInUser.firstName}!`,
      });

      logger.info("Sign in successful", {
        userId: loggedInUser.id,
        role: loggedInUser.role,
      });

      onLogin(loggedInUser);
      navigate("/dashboard");
    } catch (error) {
      logger.error("Sign in failed", { error, email: formData.email });
      toast({
        title: "Sign In Failed",
        description:
          "Invalid email or password. Try the demo accounts instead.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      logger.info("Attempting sign up", {
        email: formData.email,
        role: formData.role,
      });

      const { user: newUser, token } = await authService.register({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        company: formData.company || undefined,
      });

      // Store auth data
      localStorage.setItem("auth-token", token);
      localStorage.setItem("user-data", JSON.stringify(newUser));

      toast({
        title: "Account Created Successfully",
        description: `Welcome to Skillmatch, ${newUser.firstName}!`,
      });

      logger.info("Sign up successful", {
        userId: newUser.id,
        role: newUser.role,
      });

      onLogin(newUser);
      navigate("/dashboard");
    } catch (error) {
      logger.error("Sign up failed", { error, email: formData.email });
      toast({
        title: "Sign Up Failed",
        description: "Unable to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: string) => {
    setIsLoading(true);
    try {
      logger.info("Attempting OAuth login", { provider });

      const { user: loggedInUser, token } =
        await authService.loginWithOAuth(provider);

      // Store auth data
      localStorage.setItem("auth-token", token);
      localStorage.setItem("user-data", JSON.stringify(loggedInUser));

      toast({
        title: "OAuth Login Successful",
        description: `Welcome back, ${loggedInUser.firstName}!`,
      });

      logger.info("OAuth login successful", {
        userId: loggedInUser.id,
        provider,
      });

      onLogin(loggedInUser);
      navigate("/dashboard");
    } catch (error) {
      logger.error("OAuth login failed", { error, provider });
      toast({
        title: "OAuth Login Failed",
        description: "Please try again or use the demo accounts.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-brand rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gradient">
                  Skillmatch
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost">Features</Button>
              <Button variant="ghost">Pricing</Button>
              <Button variant="ghost">About</Button>
              <Button variant="outline" onClick={() => setAuthMode("signin")}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-brand/10 text-brand hover:bg-brand/20 border-brand/20">
                  <Zap className="w-3 h-3 mr-1" />
                  AI-Powered Recruitment
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  Find the perfect
                  <span className="text-gradient block">talent match</span>
                  with AI precision
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Skillmatch revolutionizes recruitment with intelligent
                  matching, automated screening, and seamless collaboration
                  between recruiters and candidates.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="shadow-brand group"
                  onClick={() => setAuthMode("signup")}
                  disabled={isLoading}
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" size="lg" className="group">
                  <Play className="w-4 h-4 mr-2" />
                  Watch Demo
                </Button>
              </div>

              {/* Demo Login Buttons */}
              <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <h3 className="font-semibold mb-4 text-foreground">
                  Try Demo Mode - Full Features Available
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleDemoLogin("recruiter")}
                    disabled={isLoading}
                    className="justify-start"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Briefcase className="w-4 h-4 mr-2" />
                    )}
                    Demo as Recruiter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDemoLogin("applicant")}
                    disabled={isLoading}
                    className="justify-start"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Users className="w-4 h-4 mr-2" />
                    )}
                    Demo as Applicant
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Experience all features with pre-loaded demo data. No
                  registration required.
                </p>
              </div>

              {/* Social Proof */}
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="font-medium">4.9/5</span>
                </div>
                <div>500+ companies</div>
                <div>10k+ hires made</div>
              </div>
            </div>

            {/* Right Column - Authentication */}
            <div className="lg:ml-8">
              <Card className="glass-card">
                <CardHeader className="text-center">
                  <CardTitle>Join Skillmatch</CardTitle>
                  <CardDescription>
                    Create your account to start recruiting or finding your
                    dream job
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={authMode}
                    onValueChange={(value) =>
                      setAuthMode(value as "signin" | "signup")
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="signin">Sign In</TabsTrigger>
                      <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="signin" className="space-y-4 mt-6">
                      <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signin-email">Email</Label>
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signin-password">Password</Label>
                          <Input
                            id="signin-password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) =>
                              handleInputChange("password", e.target.value)
                            }
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Signing In...
                            </>
                          ) : (
                            "Sign In"
                          )}
                        </Button>
                      </form>
                      <div className="text-center">
                        <Button variant="link" className="text-sm">
                          Forgot your password?
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="signup" className="space-y-4 mt-6">
                      <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              placeholder="John"
                              value={formData.firstName}
                              onChange={(e) =>
                                handleInputChange("firstName", e.target.value)
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              placeholder="Doe"
                              value={formData.lastName}
                              onChange={(e) =>
                                handleInputChange("lastName", e.target.value)
                              }
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) =>
                              handleInputChange("password", e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>I am a...</Label>
                          <Select
                            value={formData.role}
                            onValueChange={(value) =>
                              handleInputChange("role", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="applicant">
                                <div className="flex items-center">
                                  <Users className="w-4 h-4 mr-2" />
                                  Job Seeker
                                </div>
                              </SelectItem>
                              <SelectItem value="recruiter">
                                <div className="flex items-center">
                                  <Briefcase className="w-4 h-4 mr-2" />
                                  Recruiter
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {formData.role === "recruiter" && (
                          <div className="space-y-2">
                            <Label htmlFor="company">Company (Optional)</Label>
                            <Input
                              id="company"
                              placeholder="Your Company"
                              value={formData.company}
                              onChange={(e) =>
                                handleInputChange("company", e.target.value)
                              }
                            />
                          </div>
                        )}
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating Account...
                            </>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>

                  <div className="mt-6 text-center">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-muted" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOAuthLogin("github")}
                        disabled={isLoading}
                      >
                        <Github className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOAuthLogin("linkedin")}
                        disabled={isLoading}
                      >
                        <Linkedin className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOAuthLogin("google")}
                        disabled={isLoading}
                      >
                        <Globe className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Powered by Intelligent Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to streamline recruitment and find the perfect
              match
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI-Powered Matching",
                description:
                  "Advanced algorithms analyze skills, experience, and culture fit to recommend the best candidates.",
                color: "text-brand",
              },
              {
                icon: Search,
                title: "Smart Search & Filters",
                description:
                  "Find exactly what you need with intelligent search that understands context and intent.",
                color: "text-success",
              },
              {
                icon: Target,
                title: "Automated Screening",
                description:
                  "Save time with AI-driven initial screening and ranking of applications.",
                color: "text-warning",
              },
              {
                icon: Clock,
                title: "Real-time Collaboration",
                description:
                  "Seamless communication tools for teams to collaborate on hiring decisions.",
                color: "text-info",
              },
              {
                icon: Shield,
                title: "Data Security",
                description:
                  "Enterprise-grade security with SOC2 compliance and data encryption.",
                color: "text-destructive",
              },
              {
                icon: TrendingUp,
                title: "Analytics & Insights",
                description:
                  "Detailed reporting and analytics to optimize your recruitment process.",
                color: "text-primary",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg bg-current/10 flex items-center justify-center ${feature.color} mb-4`}
                  >
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your hiring needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$49",
                period: "/month",
                description: "Perfect for small teams and startups",
                features: [
                  "5 active job postings",
                  "100 candidate searches",
                  "Basic AI matching",
                  "Email support",
                  "Standard analytics",
                ],
                popular: false,
              },
              {
                name: "Professional",
                price: "$149",
                period: "/month",
                description: "Ideal for growing companies",
                features: [
                  "25 active job postings",
                  "Unlimited candidate searches",
                  "Advanced AI matching",
                  "Priority support",
                  "Advanced analytics",
                  "Team collaboration",
                  "Custom branding",
                ],
                popular: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                description: "For large organizations",
                features: [
                  "Unlimited job postings",
                  "Unlimited everything",
                  "Custom AI training",
                  "Dedicated support",
                  "Custom integrations",
                  "SSO & SAML",
                  "White-label solution",
                ],
                popular: false,
              },
            ].map((plan, index) => (
              <Card
                key={index}
                className={`relative ${plan.popular ? "ring-2 ring-brand shadow-brand-lg" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-brand text-brand-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold">
                    {plan.price}
                    <span className="text-base font-normal text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.popular ? "" : "variant-outline"}`}
                    onClick={() => setAuthMode("signup")}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {plan.price === "Custom"
                      ? "Contact Sales"
                      : "Start Free Trial"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Hiring Process?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of companies already using Skillmatch to find the
            best talent faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="shadow-lg"
              onClick={() => setAuthMode("signup")}
            >
              Start Your Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Skillmatch</span>
              </div>
              <p className="text-gray-400">
                The future of recruitment is here. Find better talent, faster.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>API</li>
                <li>Integrations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Documentation</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Skillmatch. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
