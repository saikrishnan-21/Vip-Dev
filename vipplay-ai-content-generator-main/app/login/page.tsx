"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { GradientInput } from "@/components/ui/GradientInput";
import { IconBadge } from "@/components/ui/IconBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ParticlesBackground } from "@/components/ParticlesBackground";

const Login = () => {
  const router = useRouter();
  const { login } = useAuth();
  const { effectiveTheme, theme, setTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState({
    email: "",
    password: "",
    general: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    setError({ email: emailError, password: passwordError, general: "" });
    if (emailError || passwordError) return;

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        router.replace("/dashboard");
      } else {
        setError({
          email: "",
          password: "",
          general: result.error || "Invalid email or password",
        });
      }
    } catch (err: any) {
      setError({
        email: "",
        password: "",
        general: err.message || "Invalid email or password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen relative overflow-hidden flex flex-col font-sans antialiased transition-colors duration-300 ${
        isDark ? "bg-[#05070f]" : "bg-slate-50"
      }`}
    >
      <ParticlesBackground />

      {/* Background gradients */}
      <div
        className={`absolute inset-0 ${
          isDark
            ? "bg-gradient-radial from-cyan-500/10 via-transparent to-transparent"
            : "bg-gradient-radial from-cyan-400/5 via-transparent to-transparent"
        }`}
      />
      <div
        className={`absolute top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full blur-3xl ${
          isDark ? "bg-cyan-500/5" : "bg-cyan-400/10"
        }`}
      />
      <div
        className={`absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full blur-3xl ${
          isDark ? "bg-blue-500/5" : "bg-blue-400/10"
        }`}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isDark ? 0.05 : 0.04,
          backgroundImage: `
            linear-gradient(rgba(${isDark ? "255,255,255" : "0,0,0"},0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(${isDark ? "255,255,255" : "0,0,0"},0.15) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="h-16 flex items-center">
          <img
            src={isDark ? "/assets/logo-white.png" : "/assets/logo-dark.png"}
            alt="FuzeBox Logo"
            className="h-full w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const span = document.createElement("span");
              span.className = "text-xl font-black tracking-tight";
              span.innerText = "FuzeBox";
              e.currentTarget.parentElement?.appendChild(span);
            }}
          />
        </div>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all duration-300 cursor-pointer ${
            isDark
              ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-cyan-500/40 hover:text-cyan-300"
              : "bg-black/5 border-black/10 text-gray-600 hover:bg-black/10 hover:border-blue-500/40 hover:text-blue-600"
          }`}
        >
          {isDark ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{isDark ? "Dark" : "Light"}</span>
        </button>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-24">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <IconBadge icon={LogIn} size="lg" />
            </div>

            <h1
              className="text-4xl md:text-5xl font-bold mb-4 leading-tight tracking-tight px-4"
              style={{
                background: "linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Welcome Back
            </h1>
            <p
              className={`text-base font-normal ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Sign in to continue your AI journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <GradientInput
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error.email}
              />
            </div>

            <div>
              <div className="relative">
                <GradientInput
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={error.password}
                />
                <span
                  className={`absolute right-4 top-[22px] cursor-pointer transition-colors ${
                    isDark
                      ? "text-gray-400 hover:text-cyan-400"
                      : "text-gray-500 hover:text-cyan-500"
                  }`}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
            </div>

            {error.general && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-500 text-sm text-center font-medium">
                  {error.general}
                </p>
              </div>
            )}

            <GradientButton
              type="submit"
              className="w-full h-14 rounded-2xl text-lg font-bold tracking-wide mt-2"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </GradientButton>
          </form>

          <div className="mt-8 text-center">
            <p
              className={`text-sm font-normal ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors duration-200 hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/forgot-password"
              className={`text-sm font-normal transition-colors duration-200 hover:underline ${
                isDark
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
