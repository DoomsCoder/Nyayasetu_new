import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Upload, Send, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ticketAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const Grievances = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();


  const [formData, setFormData] = useState({
    caseId: "",
    category: "",
    subject: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submittedTicketId, setSubmittedTicketId] = useState(null);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.caseId.trim()) {
      newErrors.caseId = "Case ID is required";
    }
    if (!formData.category) {
      newErrors.category = "Please select a category";
    }
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = "Subject must be at least 5 characters";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user is logged in
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to submit a grievance.",
        variant: "destructive"
      });
      navigate('/login/victim');
      return;
    }

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await ticketAPI.create({
        caseId: formData.caseId.trim(),
        category: formData.category,
        subject: formData.subject.trim(),
        description: formData.description.trim()
      });

      if (response.success) {
        setSubmittedTicketId(response.data.ticketId);
        toast({
          title: "Grievance Submitted Successfully!",
          description: `Your Ticket ID is: ${response.data.ticketId}. Save this for tracking.`,
        });
        setFormData({ caseId: "", category: "", subject: "", description: "" });
        setErrors({});
      }
    } catch (error) {
      console.error('Submit error:', error);
      const errorMessage = error.response?.data?.message || "Failed to submit grievance. Please try again.";
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state after submission
  if (submittedTicketId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 bg-gradient-dashboard flex items-center justify-center">
          <Card className="max-w-md w-full mx-4 p-8 text-center shadow-card">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Grievance Submitted!</h2>
            <p className="text-muted-foreground mb-4">
              Your complaint has been registered successfully.
            </p>
            <div className="bg-muted p-4 rounded-lg mb-6">
              <p className="text-sm text-muted-foreground mb-1">Your Ticket ID</p>
              <p className="text-xl font-bold text-accent">{submittedTicketId}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Save this ID to track your grievance status
              </p>
            </div>
            <div className="space-y-3">
              <Button
                className="w-full bg-accent hover:bg-accent-hover"
                onClick={() => navigate(`/track-grievance?ticketId=${submittedTicketId}`)}
              >
                <Search className="mr-2 h-4 w-4" />
                Track Status
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSubmittedTicketId(null)}
              >
                Submit Another Grievance
              </Button>
            </div>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 bg-gradient-dashboard">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mb-4">
                <MessageSquare className="h-8 w-8 text-accent-foreground" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                File a Grievance
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Having issues with your relief case? Submit a complaint and we'll help resolve it.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Form */}
              <Card className="lg:col-span-2 p-8 shadow-card">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="caseId" className="flex items-center gap-1">
                      Case ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="caseId"
                      placeholder="Enter your relief case ID (e.g., JWD-2024-001)"
                      value={formData.caseId}
                      onChange={(e) => {
                        setFormData({ ...formData, caseId: e.target.value });
                        if (errors.caseId) setErrors({ ...errors, caseId: null });
                      }}
                      className={errors.caseId ? "border-red-500" : ""}
                    />
                    {errors.caseId && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.caseId}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      This is the Case ID from your relief application
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="flex items-center gap-1">
                      Grievance Category <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => {
                        setFormData({ ...formData, category: value });
                        if (errors.category) setErrors({ ...errors, category: null });
                      }}
                    >
                      <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delay">Delay in Processing</SelectItem>
                        <SelectItem value="verification">Verification Issues</SelectItem>
                        <SelectItem value="disbursement">Disbursement Problems</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="document">Document Related</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.category}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="flex items-center gap-1">
                      Subject <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="subject"
                      placeholder="Brief description of your issue"
                      value={formData.subject}
                      onChange={(e) => {
                        setFormData({ ...formData, subject: e.target.value });
                        if (errors.subject) setErrors({ ...errors, subject: null });
                      }}
                      className={errors.subject ? "border-red-500" : ""}
                    />
                    {errors.subject && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.subject}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="flex items-center gap-1">
                      Detailed Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Please provide detailed information about your grievance"
                      rows={6}
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({ ...formData, description: e.target.value });
                        if (errors.description) setErrors({ ...errors, description: null });
                      }}
                      className={errors.description ? "border-red-500" : ""}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formData.description.length}/20 minimum characters
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-accent hover:bg-accent-hover"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>Submitting...</>
                    ) : (
                      <>
                        Submit Grievance
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  {!isAuthenticated && (
                    <p className="text-sm text-center text-muted-foreground">
                      You need to{" "}
                      <Link to="/login/victim" className="text-accent hover:underline">
                        login
                      </Link>{" "}
                      to submit a grievance
                    </p>
                  )}
                </form>
              </Card>

              {/* Support Info */}
              <div className="space-y-6">
                <Card className="p-6 shadow-card">
                  <h3 className="font-semibold mb-4">Need Immediate Help?</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-medium mb-1">Helpline (24/7)</div>
                      <div className="text-muted-foreground">18002021989</div>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Email Support</div>
                      <div className="text-muted-foreground">support@dbt-pcr.gov.in</div>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Response Time</div>
                      <div className="text-muted-foreground">Within 48 hours</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 shadow-card bg-muted">
                  <h3 className="font-semibold mb-3">Track Your Grievance</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Already submitted a grievance? Track its status using your Ticket ID.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/track-grievance')}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Check Status
                  </Button>
                </Card>

                <Card className="p-6 shadow-card">
                  <h3 className="font-semibold mb-3">Common Issues</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Document verification delays</li>
                    <li>• Fund disbursement queries</li>
                    <li>• Case status updates</li>
                    <li>• Technical login issues</li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Grievances;
