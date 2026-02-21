"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Eye,
  EyeOff,
  Sparkles,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { GradientInput } from "@/components/ui/GradientInput";
import { IconBadge } from "@/components/ui/IconBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ParticlesBackground } from "@/components/ParticlesBackground";

const Signup = () => {
  const router = useRouter();
  const { register } = useAuth();
  const { effectiveTheme, theme, setTheme } = useTheme();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    general: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isDark = effectiveTheme === "dark";

  const validateEmail = (value: string) =>
    value.endsWith(".com") ? "" : "Email must end with .com";

  const validatePassword = (value: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W_]).{8,}$/.test(value)
      ? ""
      : "Password must be 8+ chars, include uppercase, lowercase & special character";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const fullNameError = fullName.length < 2 ? "Name is too short" : "";
    const confirmError =
      password !== confirmPassword ? "Passwords do not match" : "";

    setErrors({
      email: emailError,
      password: passwordError,
      fullName: fullNameError,
      confirmPassword: confirmError,
      general: "",
    });

    if (emailError || passwordError || fullNameError || confirmError) return;

    setIsLoading(true);
    try {
      const result = await register(fullName, email, password);
      if (result.success) {
        router.replace("/account-type");
      } else {
        setErrors((prev) => ({
          ...prev,
          general: result.error || "Registration failed",
        }));
      }
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        general: err.message || "An unexpected error occurred",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen relative overflow-hidden flex flex-col font-outfit antialiased transition-colors duration-300 ${
        isDark ? "bg-[#05070f]" : "bg-slate-50"
      }`}
    >
      <ParticlesBackground />

      <div
        className={`absolute inset-0 ${isDark ? "bg-gradient-radial from-cyan-500/10 via-transparent to-transparent" : "bg-gradient-radial from-cyan-400/5 via-transparent to-transparent"}`}
      />

      <nav className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-16 flex items-center">
            <img
              src={isDark ? "/assets/logo-white.png" : "/assets/logo-dark.png"}
              alt="FuzeBox Logo"
              className="h-full w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const container = e.currentTarget.parentElement;
                if (container) {
                  container.classList.add("flex", "items-center", "gap-2");
                  const icon = document.createElement("div");
                  icon.className =
                    "w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl";
                  icon.innerText = "F";
                  const text = document.createElement("span");
                  text.className = `text-xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`;
                  text.innerText = "FuzeBox";
                  container.appendChild(icon);
                  container.appendChild(text);
                }
              }}
            />
          </div>
        </div>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all duration-300 cursor-pointer ${
            isDark
              ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              : "bg-black/5 border-black/10 text-gray-600 hover:bg-black/10"
          }`}
        >
          {isDark ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{isDark ? "Dark" : "Light"}</span>
        </button>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-24">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <IconBadge icon={UserPlus} size="lg" />
            </div>

            <h1
              className="text-3xl md:text-4xl font-pjs font-bold mb-4 leading-tight tracking-tight"
              style={{
                background: "linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Join FuzeBox AI
            </h1>
            <p
              className={`text-base font-normal ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Create your account and start your journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <GradientInput
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
              )}
            </div>

            <div>
              <GradientInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <GradientInput
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />
                <span
                  className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-colors ${
                    isDark
                      ? "text-gray-400 hover:text-cyan-400"
                      : "text-gray-500 hover:text-cyan-500"
                  }`}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <GradientInput
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                />
                <span
                  className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-colors ${
                    isDark
                      ? "text-gray-400 hover:text-cyan-400"
                      : "text-gray-500 hover:text-cyan-500"
                  }`}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </span>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {errors.general && (
              <p className="text-red-500 text-sm text-center font-medium bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                {errors.general}
              </p>
            )}

            <GradientButton
              type="submit"
              className="w-full h-14 rounded-2xl text-lg font-bold tracking-wide mt-2"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </GradientButton>
          </form>

          <div className="mt-8 text-center">
            <p
              className={`text-sm font-normal ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors duration-200 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <p
              className={`text-xs font-normal ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              By creating an account, you agree to our{" "}
              <Link
                href="/terms"
                className={`transition-colors duration-200 hover:underline ${
                  isDark
                    ? "text-gray-400 hover:text-gray-300"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className={`transition-colors duration-200 hover:underline ${
                  isDark
                    ? "text-gray-400 hover:text-gray-300"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
