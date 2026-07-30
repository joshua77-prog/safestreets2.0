import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../src/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight,
  AlertCircle,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

export default function SignUp() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // 1. Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full Name cannot be empty.";
    }

    // 2. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email Address is required.";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    // 3. Mobile Number validation (exactly 10 digits)
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (!formData.phone.trim()) {
      newErrors.phone = "Mobile Number is required.";
    } else if (phoneDigits.length !== 10) {
      newErrors.phone = "Mobile Number must contain exactly 10 digits.";
    }

    // 4. Password validation (at least 8 characters)
    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must contain at least 8 characters.";
    }

    // 5. Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    if (serverError) setServerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setServerError("");

    try {
      const email = formData.email.trim();
      const password = formData.password;
      const fullName = formData.fullName.trim();
      const phone = formData.phone.replace(/\D/g, "");

      // 1. Create Supabase Auth Account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setServerError(authError.message || "Failed to create account.");
        setLoading(false);
        return;
      }

      const authUser = authData?.user;

      if (!authUser) {
        setServerError("Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // 2. Automatically insert record into public users table
      const { error: dbError } = await supabase.from("users").insert({
        id: authUser.id,
        full_name: fullName,
        email: email,
        phone: phone,
        password: password,
      });

      if (dbError) {
        console.error("Database insert error into users table:", dbError);
      }

      // 3. Step 2 Redirect to Login Page with success notification
      navigate("/login", {
        state: { message: "Account created successfully! Please log in with your credentials." }
      });
    } catch (err) {
      console.error("Sign up error:", err);
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-6 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="shadow-2xl border-white/40 bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden">
          <CardHeader className="text-center pt-8 pb-4 space-y-2 bg-gradient-to-b from-emerald-500/10 to-transparent border-b border-slate-100">
            <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-2">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight text-slate-900">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-sm font-medium text-slate-600">
              Join Safe Streets to protect your safety and navigate with confidence
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-6">
            {serverError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm font-medium"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>{serverError}</div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    className={`pl-11 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 ${
                      errors.fullName ? "border-red-500 focus:ring-red-200" : "focus:ring-emerald-500/20"
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`pl-11 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 ${
                      errors.email ? "border-red-500 focus:ring-red-200" : "focus:ring-emerald-500/20"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                  </p>
                )}
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Mobile Number <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210 (10 digits)"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={`pl-11 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 ${
                      errors.phone ? "border-red-500 focus:ring-red-200" : "focus:ring-emerald-500/20"
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.phone}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`pl-11 pr-11 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 ${
                      errors.password ? "border-red-500 focus:ring-red-200" : "focus:ring-emerald-500/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className={`pl-11 pr-11 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 ${
                      errors.confirmPassword ? "border-red-500 focus:ring-red-200" : "focus:ring-emerald-500/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-600/25 mt-6 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account & Continue to Login
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center text-sm font-medium text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="text-emerald-600 font-bold hover:underline">
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
