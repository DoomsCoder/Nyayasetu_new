import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validation
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    newPassword: password
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                console.log('✅ Password reset successful');
                setSuccess(true);

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(data.message || 'Failed to reset password');
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
                            <h2 className="text-2xl font-bold mb-2">Create New Password</h2>
                            <p className="text-muted-foreground text-sm">
                                Enter your new password below
                            </p>
                        </div>

                        {!success ? (
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter new password (min 6 characters)"
                                        className="transition-base"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        minLength={6}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Confirm new password"
                                        className="transition-base"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <Button
                                    className="w-full bg-primary hover:opacity-90 transition-base"
                                    disabled={loading}
                                >
                                    {loading ? 'Resetting Password...' : 'Reset Password'}
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center py-4">
                                <div className="mb-6">
                                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                </div>
                                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800 font-medium">
                                        ✅  Password reset successful!
                                    </p>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Your password has been reset successfully.
                                    Redirecting to login page...
                                </p>
                                <Link to="/login">
                                    <Button variant="outline" className="mt-2">
                                        Go to Login Now
                                    </Button>
                                </Link>
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
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
