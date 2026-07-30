import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../src/lib/supabase";
import { User as UserEntity } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage = location.state?.message || "";

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email Address is required.";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
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

      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setServerError(authError.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      const authUser = authData?.user;

      if (!authUser) {
        setServerError("Login failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      // 2. Retrieve user record from public users table
      let fetchedUser = null;
      try {
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        fetchedUser = userData;
      } catch (dbErr) {
        console.log("Could not query users table:", dbErr);
      }

      // 3. Store authenticated session state
      await UserEntity.updateMyUserData({
        id: authUser.id,
        email: authUser.email,
        full_name: fetchedUser?.full_name || authUser.user_metadata?.full_name || "Safe Streets User",
        phone: fetchedUser?.phone || ""
      });

      // 4. Redirect to Protected Dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setServerError("An unexpected error occurred during sign in.");
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
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-white/40 bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden">
          <CardHeader className="text-center pt-8 pb-4 space-y-2 bg-gradient-to-b from-slate-900/5 to-transparent border-b border-slate-100">
            <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20 mb-2">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight text-slate-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-sm font-medium text-slate-600">
              Sign in to your Safe Streets account to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-6">
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 text-sm font-medium"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>{successMessage}</div>
              </motion.div>
            )}

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
                    placeholder="Enter your password"
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-900/25 mt-6 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In to Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center text-sm font-medium text-slate-600">
              Don't have an account yet?{" "}
              <Link to="/signup" className="text-emerald-600 font-bold hover:underline">
                Create Account
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
