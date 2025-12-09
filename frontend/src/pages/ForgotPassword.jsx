import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

const ForgotPassword = () => {
    const [emailOrId, setEmailOrId] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: emailOrId }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                console.log('✅ Password reset email sent');
                setSubmitted(true);
            } else {
                setError(data.message || 'Failed to send reset email');
            }
        } catch (error) {
            console.error('❌ Connection error:', error);
            setError('Unable to connect to server. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-dashboard flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center px-4">
                <div className="w-full max-w-md">
                    <Card className="p-8 shadow-elevated">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Shield className="h-8 w-8 text-primary-foreground" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Reset Your Password</h2>
                            <p className="text-muted-foreground text-sm">
                                Enter your email or user ID to receive a password reset link
                            </p>
                        </div>

                        {!submitted ? (
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="emailOrId">Email / User ID</Label>
                                    <Input
                                        id="emailOrId"
                                        type="text"
                                        placeholder="Enter your email or user ID"
                                        className="transition-base"
                                        value={emailOrId}
                                        onChange={(e) => setEmailOrId(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <Button
                                    className="w-full bg-primary hover:opacity-90 transition-base"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center py-4">
                                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800 font-medium">
                                        ✅  Password reset email sent successfully!
                                    </p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    If the email exists in our system, you will receive a password reset link shortly.
                                    Please check your inbox and spam folder.
                                </p>
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t text-center">
                            <Link to="/login">
                                <Button variant="ghost" size="sm" className="text-muted-foreground">
                                    ← Back to Login
                                </Button>
                            </Link>
                        </div>
                    </Card>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Need help? Call our 24/7 helpline:{" "}
                            <span className="font-semibold text-foreground">18002021989</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
