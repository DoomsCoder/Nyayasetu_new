import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, MessageSquare, Clock, CheckCircle2, AlertCircle, FileText, User, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ticketAPI } from "@/services/api";

const TrackGrievance = () => {
    const { toast } = useToast();
    const [ticketId, setTicketId] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [ticketData, setTicketData] = useState(null);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        if (!ticketId.trim()) {
            toast({
                title: "Error",
                description: "Please enter a Ticket ID",
                variant: "destructive"
            });
            return;
        }

        setIsSearching(true);
        setError(null);
        setTicketData(null);

        try {
            const response = await ticketAPI.trackByTicketId(ticketId.trim().toUpperCase());
            if (response.success) {
                setTicketData(response.data);
            }
        } catch (err) {
            console.error('Track error:', err);
            const errorMessage = err.response?.data?.message || "Failed to find ticket. Please check the ID and try again.";
            setError(errorMessage);
            toast({
                title: "Ticket Not Found",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setIsSearching(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            open: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "Open" },
            under_review: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Under Review" },
            resolved: { color: "bg-green-500/20 text-green-400 border-green-500/30", label: "Resolved" },
            closed: { color: "bg-gray-500/20 text-gray-400 border-gray-500/30", label: "Closed" }
        };
        const config = statusConfig[status] || statusConfig.open;
        return <Badge className={`${config.color} border`}>{config.label}</Badge>;
    };

    const getCategoryLabel = (category) => {
        const categories = {
            delay: "Delay in Processing",
            verification: "Verification Issues",
            disbursement: "Disbursement Problems",
            technical: "Technical Support",
            document: "Document Related",
            other: "Other"
        };
        return categories[category] || category;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <div className="flex-1 bg-gradient-dashboard">
                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-3xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mb-4">
                                <Search className="h-8 w-8 text-accent-foreground" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-4">
                                Track Your Grievance
                            </h1>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Enter your Ticket ID to check the status of your grievance
                            </p>
                        </div>

                        {/* Search Form */}
                        <Card className="p-6 mb-8 shadow-card">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <Label htmlFor="ticketId" className="sr-only">Ticket ID</Label>
                                    <Input
                                        id="ticketId"
                                        placeholder="Enter Ticket ID (e.g., GRV-2024-0001)"
                                        value={ticketId}
                                        onChange={(e) => setTicketId(e.target.value.toUpperCase())}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="h-12 text-lg"
                                    />
                                </div>
                                <Button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="h-12 px-8 bg-accent hover:bg-accent-hover"
                                >
                                    {isSearching ? "Searching..." : (
                                        <>
                                            <Search className="mr-2 h-4 w-4" />
                                            Track
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Card>

                        {/* Error State */}
                        {error && !ticketData && (
                            <Card className="p-8 text-center shadow-card">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                                    <AlertCircle className="h-8 w-8 text-red-500" />
                                </div>
                                <h2 className="text-xl font-bold mb-2">Ticket Not Found</h2>
                                <p className="text-muted-foreground mb-4">{error}</p>
                                <p className="text-sm text-muted-foreground">
                                    Make sure you entered the correct Ticket ID. Format: GRV-2024-0001
                                </p>
                            </Card>
                        )}

                        {/* Ticket Details */}
                        {ticketData && (
                            <div className="space-y-6">
                                {/* Status Card */}
                                <Card className="p-6 shadow-card">
                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Ticket ID</p>
                                            <p className="text-2xl font-bold text-accent">{ticketData.ticketId}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground mb-1">Status</p>
                                            {getStatusBadge(ticketData.status)}
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Case ID</p>
                                                <p className="font-medium">{ticketData.caseId}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                            <MessageSquare className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Category</p>
                                                <p className="font-medium">{getCategoryLabel(ticketData.category)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                            <Calendar className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Submitted On</p>
                                                <p className="font-medium">{formatDate(ticketData.createdAt)}</p>
                                            </div>
                                        </div>
                                        {ticketData.resolvedAt && (
                                            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Resolved On</p>
                                                    <p className="font-medium text-green-400">{formatDate(ticketData.resolvedAt)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* Subject & Description */}
                                <Card className="p-6 shadow-card">
                                    <h3 className="font-semibold mb-4">Your Grievance</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Subject</p>
                                            <p className="font-medium">{ticketData.subject}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Description</p>
                                            <p className="text-muted-foreground whitespace-pre-wrap">{ticketData.description}</p>
                                        </div>
                                    </div>
                                </Card>

                                {/* Responses Timeline */}
                                {ticketData.responses && ticketData.responses.length > 0 && (
                                    <Card className="p-6 shadow-card">
                                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                                            <Clock className="h-5 w-5" />
                                            Response Timeline
                                        </h3>
                                        <div className="space-y-4">
                                            {ticketData.responses.map((response, index) => (
                                                <div key={index} className="relative pl-6 pb-4 border-l-2 border-accent/30 last:pb-0">
                                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-accent" />
                                                    <div className="bg-muted p-4 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium text-sm">
                                                                {response.respondedBy?.name || 'Officer'}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                • {formatDate(response.respondedAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm whitespace-pre-wrap">{response.message}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}

                                {/* No Responses Yet */}
                                {(!ticketData.responses || ticketData.responses.length === 0) && (
                                    <Card className="p-6 shadow-card bg-muted/50">
                                        <div className="text-center py-4">
                                            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                            <p className="font-medium">Awaiting Response</p>
                                            <p className="text-sm text-muted-foreground">
                                                An officer will review your grievance and respond within 48 hours.
                                            </p>
                                        </div>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Empty State */}
                        {!ticketData && !error && !isSearching && (
                            <Card className="p-8 text-center shadow-card bg-muted/50">
                                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h2 className="text-xl font-semibold mb-2">Enter Your Ticket ID</h2>
                                <p className="text-muted-foreground">
                                    Your Ticket ID was provided when you submitted your grievance.
                                    <br />
                                    It looks like: <span className="font-mono text-accent">GRV-2024-0001</span>
                                </p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default TrackGrievance;
