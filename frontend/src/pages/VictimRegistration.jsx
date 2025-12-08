import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";

const VictimRegistration = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        // Mobile validation (basic length check)
        if (formData.mobile.length < 10) {
            newErrors.mobile = "Mobile number must be at least 10 digits";
        }

        // Password match validation
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        // Password length validation
        if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            try {
                // Call backend registration API
                const response = await fetch('http://localhost:5000/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        fullName: formData.fullName,
                        email: formData.email,
                        mobile: formData.mobile,
                        password: formData.password,
                        role: 'victim'
                    }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    console.log('✅ Registration successful:', data.user);
                    setSubmitted(true);
                } else {
                    console.error('❌ Registration failed:', data.message);
                    alert(data.message || 'Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('❌ Connection error:', error);
                alert('Unable to connect to server. Please make sure the backend is running.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-dashboard flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <Card className="p-8 shadow-elevated">
                        <div className="text-center mb-8">
                            <div className="bg-accent w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Users className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Register for Relief</h2>
                            <p className="text-muted-foreground text-sm">
                                Create your account to apply for relief assistance
                            </p>
                        </div>

                        {!submitted ? (
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        placeholder="Enter your full name"
                                        className="transition-base"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        className="transition-base"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-500">{errors.email}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="mobile">Mobile</Label>
                                    <Input
                                        id="mobile"
                                        name="mobile"
                                        type="tel"
                                        placeholder="Enter your mobile number"
                                        className="transition-base"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.mobile && (
                                        <p className="text-sm text-red-500">{errors.mobile}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="Create a password"
                                        className="transition-base"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-red-500">{errors.password}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="Confirm your password"
                                        className="transition-base"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.confirmPassword && (
                                        <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                                    )}
                                </div>

                                <div className="pt-4">
                                    <Button className="w-full bg-accent hover:opacity-90 transition-base">
                                        Register
                                    </Button>
                                    <div className="mt-4 text-center">
                                        <Link
                                            to="/login"
                                            className="text-sm text-primary hover:underline"
                                        >
                                            Back to Login
                                        </Link>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div className="text-center py-4">
                                    <p className="text-sm text-green-600 font-medium mb-2">
                                        Registration successful (demo). Please login.
                                    </p>
                                </div>
                                <Link to="/login">
                                    <Button className="w-full bg-accent hover:opacity-90 transition-base">
                                        Go to Login
                                    </Button>
                                </Link>
                            </div>
                        )}
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

export default VictimRegistration;
