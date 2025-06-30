import { useState } from "react";
import { User } from "@/lib/types";
import { usePersistentBilling } from "@/hooks/usePersistentState";
import { logger } from "@/lib/api";
import jsPDF from "jspdf";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Crown,
  Zap,
  Users,
  BarChart3,
  Bot,
  Shield,
  Star,
  TrendingUp,
  Clock,
  DollarSign,
} from "lucide-react";

interface BillingPageProps {
  user: User;
}

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    yearlyPrice: 290,
    icon: Zap,
    features: [
      "Up to 5 job postings",
      "Basic AI matching",
      "Standard support",
      "Email notifications",
      "Basic analytics",
    ],
    limits: {
      jobs: 5,
      applications: 50,
      aiCredits: 100,
    },
  },
  {
    id: "professional",
    name: "Professional",
    price: 79,
    yearlyPrice: 790,
    icon: Crown,
    popular: true,
    features: [
      "Unlimited job postings",
      "Advanced AI matching",
      "Priority support",
      "Advanced analytics",
      "Custom branding",
      "Team collaboration",
      "API access",
    ],
    limits: {
      jobs: -1,
      applications: 500,
      aiCredits: 1000,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    yearlyPrice: 1990,
    icon: Shield,
    features: [
      "Everything in Professional",
      "Unlimited team members",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
      "Advanced security",
      "Custom AI models",
    ],
    limits: {
      jobs: -1,
      applications: -1,
      aiCredits: -1,
    },
  },
];

export default function BillingPage({ user }: BillingPageProps) {
  const { toast } = useToast();

  // Use persistent billing state
  const [billingData, setBillingData, isLoaded] = usePersistentBilling(user);

  // Local UI state (not persisted)
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Payment form state (reset after each use)
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardName: "",
    billingAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US",
    },
  });

  // Extract data from persistent state
  const currentPlan = billingData.currentPlan;
  const billingCycle = billingData.billingCycle as "monthly" | "yearly";
  const subscription = billingData.subscription;
  const usage = billingData.usage;
  const billingHistory = billingData.billingHistory;

  // Helper functions to update persistent state
  const setCurrentPlan = (plan: string) => {
    setBillingData((prev) => ({ ...prev, currentPlan: plan }));
  };

  const setBillingCycle = (cycle: "monthly" | "yearly") => {
    setBillingData((prev) => ({ ...prev, billingCycle: cycle }));
  };

  const setSubscription = (updater: any) => {
    setBillingData((prev) => ({
      ...prev,
      subscription:
        typeof updater === "function" ? updater(prev.subscription) : updater,
    }));
  };

  const setUsage = (updater: any) => {
    setBillingData((prev) => ({
      ...prev,
      usage: typeof updater === "function" ? updater(prev.usage) : updater,
    }));
  };

  const setBillingHistory = (updater: any) => {
    setBillingData((prev) => ({
      ...prev,
      billingHistory:
        typeof updater === "function" ? updater(prev.billingHistory) : updater,
    }));
  };

  // Don't render until data is loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Loading billing information...
          </p>
        </div>
      </div>
    );
  }

  const handleUpdatePayment = () => {
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async () => {
    try {
      // Basic validation
      if (
        !paymentForm.cardNumber ||
        !paymentForm.expiryMonth ||
        !paymentForm.expiryYear ||
        !paymentForm.cvv ||
        !paymentForm.cardName
      ) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required payment fields.",
          variant: "destructive",
        });
        return;
      }

      setIsUpdatingPayment(true);

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get card type from card number
      const cardNumber = paymentForm.cardNumber.replace(/\s/g, "");
      let cardType = "Card";
      if (cardNumber.startsWith("4")) {
        cardType = "Visa";
      } else if (cardNumber.startsWith("5") || cardNumber.startsWith("2")) {
        cardType = "Mastercard";
      } else if (cardNumber.startsWith("3")) {
        cardType = "American Express";
      }

      // Create masked card number
      const maskedCardNumber = `**** **** **** ${cardNumber.slice(-4)} (${cardType})`;

      // Update the subscription with new payment method
      setSubscription((prev) => ({
        ...prev,
        paymentMethod: maskedCardNumber,
      }));

      // Reset form and close modal
      setPaymentForm({
        cardNumber: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
        cardName: "",
        billingAddress: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "US",
        },
      });
      setShowPaymentModal(false);

      toast({
        title: "Payment Method Updated",
        description: `Payment method updated successfully.`,
      });

      console.log("Payment method updated successfully");
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update payment method. Please try again.",
        variant: "destructive",
      });
      console.error("Payment update failed:", error);
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setPaymentForm((prev) => ({ ...prev, cardNumber: formatted }));
  };

  const handleUpgradePlan = async (planId: string) => {
    try {
      // Simulate upgrade process
      const selectedPlan = plans.find((p) => p.id === planId);
      if (!selectedPlan) return;

      // Update current plan
      setCurrentPlan(planId);

      // Update subscription details
      setSubscription((prev) => ({
        ...prev,
        plan: planId,
        amount:
          billingCycle === "yearly"
            ? selectedPlan.yearlyPrice
            : selectedPlan.price,
      }));

      // Add billing history entry
      const newInvoice = {
        id: `inv_${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        amount:
          billingCycle === "yearly"
            ? selectedPlan.yearlyPrice
            : selectedPlan.price,
        status: "paid" as const,
        description: `${selectedPlan.name} Plan - ${billingCycle === "yearly" ? "Yearly" : "Monthly"}`,
        downloadUrl: "#",
      };

      setBillingHistory((prev) => [newInvoice, ...prev]);

      toast({
        title: "Plan Upgraded Successfully",
        description: `You are now on the ${selectedPlan.name} plan!`,
      });
    } catch (error) {
      toast({
        title: "Upgrade Failed",
        description: "Failed to upgrade plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelSubscription = async () => {
    try {
      // Update subscription to show it will be canceled
      setSubscription((prev) => ({
        ...prev,
        cancelAtPeriodEnd: true,
        status: "active", // Still active until period end
      }));

      // Add cancellation entry to billing history
      const cancellationEntry = {
        id: `cnl_${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        amount: 0,
        status: "refunded" as const,
        description: "Subscription Cancelled - Effective at period end",
        downloadUrl: "#",
      };

      setBillingHistory((prev) => [cancellationEntry, ...prev]);

      toast({
        title: "Subscription Cancelled",
        description: `Your subscription will remain active until ${formatDate(subscription.currentPeriodEnd)}. No further charges will occur.`,
      });
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      // Find the invoice data
      const invoice = billingHistory.find((inv) => inv.id === invoiceId);
      if (!invoice) {
        toast({
          title: "Invoice Not Found",
          description: "Could not find the requested invoice.",
          variant: "destructive",
        });
        return;
      }

      // Show loading state
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your invoice...",
      });

      // Generate PDF
      const pdf = await generateInvoicePDF(invoice);

      // Download the PDF
      pdf.save(`invoice-${invoiceId}-${invoice.date}.pdf`);

      toast({
        title: "Invoice Downloaded",
        description: `Invoice ${invoiceId} has been downloaded as PDF.`,
      });

      logger.info("Invoice PDF downloaded", { invoiceId, userId: user.id });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF invoice. Please try again.",
        variant: "destructive",
      });
      logger.error("Invoice PDF generation failed", { invoiceId, error });
    }
  };

  const generateInvoicePDF = async (invoice: any) => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 20;

    // Calculate VAT details
    const subtotal = invoice.subtotal || invoice.amount;
    const vatRate = invoice.vatRate || billingData.vatSettings?.vatRate || 21;
    const vatAmount = invoice.vatAmount || (subtotal * vatRate) / 100;
    const totalAmount = invoice.totalAmount || subtotal + vatAmount;

    // Header with company logo area and invoice details
    pdf.setFillColor(0, 123, 255);
    pdf.rect(0, 0, pageWidth, 25, "F");

    // Company name in header
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text("SkillMatch", margin, 17);

    // Invoice title (right side of header)
    pdf.setFontSize(18);
    pdf.text("INVOICE", pageWidth - margin - 35, 17);

    // Reset color for body content
    pdf.setTextColor(0, 0, 0);

    // Company details (left side)
    let yPos = 40;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text("SkillMatch B.V.", margin, yPos);
    yPos += 6;
    pdf.text("123 Innovation Drive", margin, yPos);
    yPos += 6;
    pdf.text("San Francisco, CA 94102", margin, yPos);
    yPos += 6;
    pdf.text("VAT: US123456789", margin, yPos);
    yPos += 6;
    pdf.text("Phone: (555) 123-4567", margin, yPos);
    yPos += 6;
    pdf.text("Email: billing@skillmatch.ai", margin, yPos);

    // Invoice details (right side)
    const rightStart = 120;
    yPos = 40;
    pdf.setFont("helvetica", "bold");
    pdf.text("Invoice Details:", rightStart, yPos);
    yPos += 8;

    pdf.setFont("helvetica", "normal");
    pdf.text(`Invoice #: ${invoice.id}`, rightStart, yPos);
    yPos += 6;
    pdf.text(`Date: ${formatDate(invoice.date)}`, rightStart, yPos);
    yPos += 6;
    pdf.text(`Due Date: ${formatDate(invoice.date)}`, rightStart, yPos);
    yPos += 6;

    // Status badge
    const statusColors = {
      paid: [40, 167, 69],
      pending: [255, 193, 7],
      overdue: [220, 53, 69],
    };
    const statusColor = statusColors[
      invoice.status as keyof typeof statusColors
    ] || [108, 117, 125];
    pdf.setFillColor(...statusColor);
    pdf.roundedRect(rightStart, yPos - 4, 25, 8, 2, 2, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text(invoice.status.toUpperCase(), rightStart + 2, yPos + 1);
    pdf.setTextColor(0, 0, 0);

    // Horizontal separator line
    yPos = 85;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);

    // Bill To section
    yPos += 15;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 123, 255);
    pdf.text("Bill To:", margin, yPos);

    yPos += 8;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${user.firstName} ${user.lastName}`, margin, yPos);
    yPos += 6;

    pdf.setFont("helvetica", "normal");
    const companyName =
      invoice.billingAddress?.companyName ||
      user.company ||
      "Individual Account";
    pdf.text(companyName, margin, yPos);
    yPos += 6;

    // Billing address if available
    if (billingData.vatSettings?.billingAddress) {
      const addr = billingData.vatSettings.billingAddress;
      pdf.text(addr.street || "", margin, yPos);
      yPos += 6;
      pdf.text(`${addr.postalCode || ""} ${addr.city || ""}`, margin, yPos);
      yPos += 6;
      pdf.text(addr.country || "", margin, yPos);
      yPos += 6;
    }

    pdf.text(user.email, margin, yPos);
    yPos += 6;

    // VAT number if available
    if (
      invoice.billingAddress?.vatNumber ||
      billingData.vatSettings?.vatNumber
    ) {
      pdf.text(
        `VAT: ${invoice.billingAddress?.vatNumber || billingData.vatSettings?.vatNumber}`,
        margin,
        yPos,
      );
      yPos += 6;
    }

    // Service details (right side)
    let serviceY = 110;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 123, 255);
    pdf.text("Service Period:", rightStart, serviceY);

    serviceY += 8;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Plan: ${plans.find((p) => p.id === currentPlan)?.name || "Professional"}`,
      rightStart,
      serviceY,
    );
    serviceY += 6;
    pdf.text(`Billing: ${billingCycle}`, rightStart, serviceY);
    serviceY += 6;
    pdf.text(
      `Period: ${formatDate(subscription.currentPeriodStart)}`,
      rightStart,
      serviceY,
    );
    serviceY += 6;
    pdf.text(
      `to ${formatDate(subscription.currentPeriodEnd)}`,
      rightStart,
      serviceY,
    );
    serviceY += 6;
    pdf.text(`Payment: ${subscription.paymentMethod}`, rightStart, serviceY);

    // Items table
    yPos = Math.max(yPos, serviceY) + 20;

    // Table header
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, yPos - 2, pageWidth - 2 * margin, 12, "F");

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");

    // Table headers
    pdf.text("Description", margin + 2, yPos + 5);
    pdf.text("Qty", 105, yPos + 5);
    pdf.text("Unit Price", 125, yPos + 5);
    pdf.text("Amount", 160, yPos + 5);

    // Table border
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(margin, yPos - 2, pageWidth - 2 * margin, 12);

    // Item row
    yPos += 15;
    pdf.setFont("helvetica", "normal");
    pdf.text(invoice.description, margin + 2, yPos);
    pdf.text("1", 105, yPos);
    pdf.text(`$${subtotal.toFixed(2)}`, 125, yPos);
    pdf.text(`$${subtotal.toFixed(2)}`, 160, yPos);

    // Table row border
    pdf.rect(margin, yPos - 7, pageWidth - 2 * margin, 12);

    // Totals section
    yPos += 25;
    const totalsX = 130;

    // Subtotal
    pdf.setFont("helvetica", "normal");
    pdf.text("Subtotal:", totalsX, yPos);
    pdf.text(`$${subtotal.toFixed(2)}`, 170, yPos);
    yPos += 8;

    // VAT line
    pdf.text(`VAT (${vatRate}%):`, totalsX, yPos);
    pdf.text(`$${vatAmount.toFixed(2)}`, 170, yPos);
    yPos += 8;

    // Total line with background
    pdf.setFillColor(240, 248, 255);
    pdf.rect(totalsX - 5, yPos - 5, 65, 12, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Total Amount:", totalsX, yPos + 2);
    pdf.text(`$${totalAmount.toFixed(2)}`, 170, yPos + 2);

    // Border around total
    pdf.setDrawColor(0, 123, 255);
    pdf.setLineWidth(1);
    pdf.rect(totalsX - 5, yPos - 5, 65, 12);

    // VAT notice
    yPos += 25;
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      "VAT will be charged according to your country of residence.",
      margin,
      yPos,
    );
    yPos += 5;
    pdf.text(
      "For EU customers: Reverse charge mechanism may apply for B2B transactions.",
      margin,
      yPos,
    );

    // Footer
    yPos = pageHeight - 40;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    const centerX = pageWidth / 2;
    pdf.text("Thank you for your business!", centerX, yPos, {
      align: "center",
    });

    yPos += 8;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    const currentDate = new Date().toLocaleDateString();
    pdf.text(
      `Generated on ${currentDate} | Questions? Contact support@skillmatch.ai`,
      centerX,
      yPos,
      { align: "center" },
    );

    yPos += 6;
    pdf.text(
      "SkillMatch - Connecting talent with opportunity through AI-powered matching",
      centerX,
      yPos,
      { align: "center" },
    );

    return pdf;
  };

  const handleViewAnalytics = () => {
    // Mock analytics view
    toast({
      title: "Analytics Loading",
      description: "Detailed analytics are being prepared...",
    });
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.round((used / limit) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Billing & Subscription
            </h1>
            <p className="text-muted-foreground">
              Manage your subscription, usage, and billing history
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              variant={
                subscription.status === "active" ? "default" : "destructive"
              }
            >
              {subscription.status === "active" ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              {subscription.status.charAt(0).toUpperCase() +
                subscription.status.slice(1)}
            </Badge>
            {subscription.cancelAtPeriodEnd && (
              <Badge variant="outline" className="text-orange-600">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Cancelling
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="vat">VAT Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Subscription */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                    Current Subscription
                  </CardTitle>
                  <CardDescription>
                    Your active plan and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {plans.find((p) => p.id === currentPlan)?.name} Plan
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        ${subscription.amount}/{billingCycle.slice(0, -2)}
                      </p>
                      {subscription.cancelAtPeriodEnd && (
                        <p className="text-sm text-orange-600 font-medium mt-1">
                          ⚠️ Cancelling at period end
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge
                        variant={
                          subscription.cancelAtPeriodEnd
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {subscription.cancelAtPeriodEnd
                          ? "Cancelling"
                          : "Active"}
                      </Badge>
                      {subscription.cancelAtPeriodEnd && (
                        <Badge variant="outline" className="text-xs">
                          Until {formatDate(subscription.currentPeriodEnd)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current period</span>
                      <span>
                        {formatDate(subscription.currentPeriodStart)} -{" "}
                        {formatDate(subscription.currentPeriodEnd)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Next billing date</span>
                      <span>{formatDate(subscription.currentPeriodEnd)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Payment method</span>
                      <span>{subscription.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleUpdatePayment}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Update Payment
                    </Button>
                    {!subscription.cancelAtPeriodEnd ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                          >
                            Cancel Plan
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Cancel subscription?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Your subscription will remain active until{" "}
                              {formatDate(subscription.currentPeriodEnd)}.
                              You'll lose access to all premium features after
                              that date.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              Keep subscription
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleCancelSubscription}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Cancel subscription
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled
                      >
                        Plan Cancelled
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Usage Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Usage Summary
                  </CardTitle>
                  <CardDescription>
                    Current month usage across all features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Job Postings</span>
                        <span>
                          {usage.jobs.used}
                          {usage.jobs.limit === -1
                            ? ""
                            : ` / ${usage.jobs.limit}`}
                        </span>
                      </div>
                      <Progress
                        value={getUsagePercentage(
                          usage.jobs.used,
                          usage.jobs.limit,
                        )}
                        className="h-2"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Applications Received</span>
                        <span>
                          {usage.applications.used}
                          {usage.applications.limit === -1
                            ? ""
                            : ` / ${usage.applications.limit}`}
                        </span>
                      </div>
                      <Progress
                        value={getUsagePercentage(
                          usage.applications.used,
                          usage.applications.limit,
                        )}
                        className="h-2"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>AI Credits</span>
                        <span>
                          {usage.aiCredits.used}
                          {usage.aiCredits.limit === -1
                            ? ""
                            : ` / ${usage.aiCredits.limit}`}
                        </span>
                      </div>
                      <Progress
                        value={getUsagePercentage(
                          usage.aiCredits.used,
                          usage.aiCredits.limit,
                        )}
                        className="h-2"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Team Members</span>
                        <span>
                          {usage.teamMembers.used}
                          {usage.teamMembers.limit === -1
                            ? ""
                            : ` / ${usage.teamMembers.limit}`}
                        </span>
                      </div>
                      <Progress
                        value={getUsagePercentage(
                          usage.teamMembers.used,
                          usage.teamMembers.limit,
                        )}
                        className="h-2"
                      />
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleViewAnalytics}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Detailed Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Recent Invoices
                </CardTitle>
                <CardDescription>
                  Your latest billing transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {billingHistory.slice(0, 3).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            invoice.status === "paid"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />
                        <div>
                          <p className="font-medium">{invoice.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(invoice.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">${invoice.amount}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            {/* Billing Cycle Toggle */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant={billingCycle === "monthly" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setBillingCycle("monthly")}
                  >
                    Monthly
                  </Button>
                  <div className="relative">
                    <div
                      className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                        billingCycle === "yearly" ? "bg-primary" : "bg-gray-300"
                      }`}
                      onClick={() =>
                        setBillingCycle(
                          billingCycle === "monthly" ? "yearly" : "monthly",
                        )
                      }
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          billingCycle === "yearly" ? "translate-x-6" : ""
                        }`}
                      />
                    </div>
                  </div>
                  <Button
                    variant={billingCycle === "yearly" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setBillingCycle("yearly")}
                  >
                    Yearly{" "}
                    <Badge variant="secondary" className="ml-1">
                      Save 17%
                    </Badge>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isCurrentPlan = plan.id === currentPlan;
                const price =
                  billingCycle === "yearly" ? plan.yearlyPrice : plan.price;
                const Icon = plan.icon;

                return (
                  <Card
                    key={plan.id}
                    className={`relative ${
                      plan.popular
                        ? "border-primary shadow-lg"
                        : isCurrentPlan
                          ? "border-green-500"
                          : ""
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">
                          <Star className="w-3 h-3 mr-1" />
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge variant="secondary">Current Plan</Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-4">
                      <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <div className="space-y-1">
                        <div className="text-3xl font-bold">
                          $
                          {billingCycle === "yearly"
                            ? plan.yearlyPrice
                            : plan.price}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          per {billingCycle === "yearly" ? "year" : "month"}
                        </div>
                        {billingCycle === "yearly" && (
                          <div className="text-sm text-green-600">
                            Save ${plan.price * 12 - plan.yearlyPrice} annually
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center text-sm"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>

                      <Button
                        className="w-full"
                        variant={isCurrentPlan ? "secondary" : "default"}
                        disabled={isCurrentPlan}
                        onClick={() => handleUpgradePlan(plan.id)}
                      >
                        {isCurrentPlan ? "Current Plan" : "Upgrade"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Job Postings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Job Postings
                  </CardTitle>
                  <CardDescription>
                    Current month job posting usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">
                        {usage.jobs.used}
                      </span>
                      <Badge variant="outline">
                        {usage.jobs.limit === -1
                          ? "Unlimited"
                          : `of ${usage.jobs.limit}`}
                      </Badge>
                    </div>
                    {usage.jobs.limit !== -1 && (
                      <Progress
                        value={getUsagePercentage(
                          usage.jobs.used,
                          usage.jobs.limit,
                        )}
                        className="h-2"
                      />
                    )}
                    <p className="text-sm text-muted-foreground">
                      Jobs posted this billing period
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Applications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Applications
                  </CardTitle>
                  <CardDescription>
                    Applications received this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">
                        {usage.applications.used}
                      </span>
                      <Badge variant="outline">
                        {usage.applications.limit === -1
                          ? "Unlimited"
                          : `of ${usage.applications.limit}`}
                      </Badge>
                    </div>
                    {usage.applications.limit !== -1 && (
                      <Progress
                        value={getUsagePercentage(
                          usage.applications.used,
                          usage.applications.limit,
                        )}
                        className="h-2"
                      />
                    )}
                    <p className="text-sm text-muted-foreground">
                      Total applications received
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* AI Credits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bot className="w-5 h-5 mr-2" />
                    AI Credits
                  </CardTitle>
                  <CardDescription>
                    AI processing credits used this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">
                        {usage.aiCredits.used}
                      </span>
                      <Badge variant="outline">
                        {usage.aiCredits.limit === -1
                          ? "Unlimited"
                          : `of ${usage.aiCredits.limit}`}
                      </Badge>
                    </div>
                    {usage.aiCredits.limit !== -1 && (
                      <Progress
                        value={getUsagePercentage(
                          usage.aiCredits.used,
                          usage.aiCredits.limit,
                        )}
                        className="h-2"
                      />
                    )}
                    <p className="text-sm text-muted-foreground">
                      Credits used for AI features
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Team Members */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Team Members
                  </CardTitle>
                  <CardDescription>
                    Active team members in your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">
                        {usage.teamMembers.used}
                      </span>
                      <Badge variant="outline">
                        {usage.teamMembers.limit === -1
                          ? "Unlimited"
                          : `of ${usage.teamMembers.limit}`}
                      </Badge>
                    </div>
                    {usage.teamMembers.limit !== -1 && (
                      <Progress
                        value={getUsagePercentage(
                          usage.teamMembers.used,
                          usage.teamMembers.limit,
                        )}
                        className="h-2"
                      />
                    )}
                    <p className="text-sm text-muted-foreground">
                      Team members with access
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Billing History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Billing History
                </CardTitle>
                <CardDescription>
                  Complete history of your payments and invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingHistory.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{formatDate(invoice.date)}</TableCell>
                        <TableCell>{invoice.description}</TableCell>
                        <TableCell>${invoice.amount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invoice.status === "paid"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {invoice.status === "paid" ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {invoice.status.charAt(0).toUpperCase() +
                              invoice.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice.id)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VAT Settings Tab */}
          <TabsContent value="vat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  VAT Configuration
                </CardTitle>
                <CardDescription>
                  Configure your VAT settings and billing address for invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* VAT Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">VAT Information</h3>

                    <div>
                      <Label htmlFor="vatCountry">Country</Label>
                      <Select
                        value={billingData.vatSettings?.country || "NL"}
                        onValueChange={(value) =>
                          setBillingData((prev) => ({
                            ...prev,
                            vatSettings: {
                              ...prev.vatSettings,
                              country: value,
                              vatRate:
                                value === "NL"
                                  ? 21
                                  : value === "DE"
                                    ? 19
                                    : value === "FR"
                                      ? 20
                                      : 0,
                            },
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NL">
                            Netherlands (21% VAT)
                          </SelectItem>
                          <SelectItem value="DE">Germany (19% VAT)</SelectItem>
                          <SelectItem value="FR">France (20% VAT)</SelectItem>
                          <SelectItem value="GB">
                            United Kingdom (20% VAT)
                          </SelectItem>
                          <SelectItem value="US">
                            United States (0% VAT)
                          </SelectItem>
                          <SelectItem value="CA">Canada (5% GST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="vatNumber">VAT Number</Label>
                      <Input
                        id="vatNumber"
                        placeholder="NL123456789B01"
                        value={billingData.vatSettings?.vatNumber || ""}
                        onChange={(e) =>
                          setBillingData((prev) => ({
                            ...prev,
                            vatSettings: {
                              ...prev.vatSettings,
                              vatNumber: e.target.value,
                            },
                          }))
                        }
                        className="mt-1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Enter your company's VAT registration number
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="vatRate">VAT Rate (%)</Label>
                      <Input
                        id="vatRate"
                        type="number"
                        min="0"
                        max="50"
                        step="0.1"
                        value={billingData.vatSettings?.vatRate || 21}
                        onChange={(e) =>
                          setBillingData((prev) => ({
                            ...prev,
                            vatSettings: {
                              ...prev.vatSettings,
                              vatRate: parseFloat(e.target.value) || 0,
                            },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="vatIncluded"
                        checked={billingData.vatSettings?.vatIncluded || false}
                        onCheckedChange={(checked) =>
                          setBillingData((prev) => ({
                            ...prev,
                            vatSettings: {
                              ...prev.vatSettings,
                              vatIncluded: !!checked,
                            },
                          }))
                        }
                      />
                      <Label htmlFor="vatIncluded">
                        VAT included in plan prices
                      </Label>
                    </div>
                  </div>

                  {/* Billing Address */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Billing Address</h3>

                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        placeholder="Your Company Ltd."
                        value={
                          billingData.vatSettings?.billingAddress
                            ?.companyName || ""
                        }
                        onChange={(e) =>
                          setBillingData((prev) => ({
                            ...prev,
                            vatSettings: {
                              ...prev.vatSettings,
                              billingAddress: {
                                ...prev.vatSettings?.billingAddress,
                                companyName: e.target.value,
                              },
                            },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        placeholder="123 Business Street"
                        value={
                          billingData.vatSettings?.billingAddress?.street || ""
                        }
                        onChange={(e) =>
                          setBillingData((prev) => ({
                            ...prev,
                            vatSettings: {
                              ...prev.vatSettings,
                              billingAddress: {
                                ...prev.vatSettings?.billingAddress,
                                street: e.target.value,
                              },
                            },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="Amsterdam"
                          value={
                            billingData.vatSettings?.billingAddress?.city || ""
                          }
                          onChange={(e) =>
                            setBillingData((prev) => ({
                              ...prev,
                              vatSettings: {
                                ...prev.vatSettings,
                                billingAddress: {
                                  ...prev.vatSettings?.billingAddress,
                                  city: e.target.value,
                                },
                              },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          placeholder="1015 CJ"
                          value={
                            billingData.vatSettings?.billingAddress
                              ?.postalCode || ""
                          }
                          onChange={(e) =>
                            setBillingData((prev) => ({
                              ...prev,
                              vatSettings: {
                                ...prev.vatSettings,
                                billingAddress: {
                                  ...prev.vatSettings?.billingAddress,
                                  postalCode: e.target.value,
                                },
                              },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="billingCountry">Country</Label>
                      <Select
                        value={
                          billingData.vatSettings?.billingAddress?.country ||
                          "Netherlands"
                        }
                        onValueChange={(value) =>
                          setBillingData((prev) => ({
                            ...prev,
                            vatSettings: {
                              ...prev.vatSettings,
                              billingAddress: {
                                ...prev.vatSettings?.billingAddress,
                                country: value,
                              },
                            },
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Netherlands">
                            Netherlands
                          </SelectItem>
                          <SelectItem value="Germany">Germany</SelectItem>
                          <SelectItem value="France">France</SelectItem>
                          <SelectItem value="United Kingdom">
                            United Kingdom
                          </SelectItem>
                          <SelectItem value="United States">
                            United States
                          </SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* VAT Preview */}
                <div className="mt-8 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Invoice Preview</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal (Professional Plan):</span>
                      <span>$79.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        VAT ({billingData.vatSettings?.vatRate || 21}%):
                      </span>
                      <span>
                        $
                        {(
                          (79 * (billingData.vatSettings?.vatRate || 21)) /
                          100
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium pt-1 border-t">
                      <span>Total Amount:</span>
                      <span>
                        $
                        {(
                          79 +
                          (79 * (billingData.vatSettings?.vatRate || 21)) / 100
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      toast({
                        title: "VAT Settings Saved",
                        description:
                          "Your VAT configuration has been updated successfully.",
                      });
                    }}
                  >
                    Save VAT Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payment Method Edit Modal */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Update Payment Method
              </DialogTitle>
              <DialogDescription>
                Enter your new payment information below. Your card details are
                encrypted and secure.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Card Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Card Information</h3>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number *</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={paymentForm.cardNumber}
                      onChange={handleCardNumberChange}
                      maxLength={19}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="expiryMonth">Month *</Label>
                      <Select
                        value={paymentForm.expiryMonth}
                        onValueChange={(value) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            expiryMonth: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem
                              key={i + 1}
                              value={String(i + 1).padStart(2, "0")}
                            >
                              {String(i + 1).padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="expiryYear">Year *</Label>
                      <Select
                        value={paymentForm.expiryYear}
                        onValueChange={(value) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            expiryYear: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="YYYY" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => {
                            const year = new Date().getFullYear() + i;
                            return (
                              <SelectItem key={year} value={String(year)}>
                                {year}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="cvv">CVV *</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={paymentForm.cvv}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                          }))
                        }
                        maxLength={4}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cardName">Cardholder Name *</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={paymentForm.cardName}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          cardName: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Billing Address</h3>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      placeholder="123 Main Street"
                      value={paymentForm.billingAddress.street}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          billingAddress: {
                            ...prev.billingAddress,
                            street: e.target.value,
                          },
                        }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="New York"
                        value={paymentForm.billingAddress.city}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            billingAddress: {
                              ...prev.billingAddress,
                              city: e.target.value,
                            },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        placeholder="NY"
                        value={paymentForm.billingAddress.state}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            billingAddress: {
                              ...prev.billingAddress,
                              state: e.target.value,
                            },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                      <Input
                        id="zipCode"
                        placeholder="10001"
                        value={paymentForm.billingAddress.zipCode}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            billingAddress: {
                              ...prev.billingAddress,
                              zipCode: e.target.value,
                            },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select
                        value={paymentForm.billingAddress.country}
                        onValueChange={(value) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            billingAddress: {
                              ...prev.billingAddress,
                              country: value,
                            },
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                          <SelectItem value="JP">Japan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                disabled={isUpdatingPayment}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitPayment}
                disabled={isUpdatingPayment}
              >
                {isUpdatingPayment ? "Processing..." : "Update Payment Method"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
