"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { authAPI, organizationAPI } from "@/api/api.service";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const AccountType = () => {
  const router = useRouter();
  const { updateUser, refreshUser } = useAuth();
  const { effectiveTheme, theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isDark = effectiveTheme === "dark";

  const handleSelect = async (type: "individual" | "organization") => {
    setIsLoading(true);
    setError("");

    try {
      // Step 1: Update account type
      const response = await authAPI.updateAccountType(type);

      if (!response.success) {
        setError(response.message || "Failed to update account type");
        return;
      }

      // Step 2: Set role based on selected account type
      const role = type === "organization" ? "org_admin" : "user";

      try {
        await authAPI.setRoleSelection(role);
        if (typeof window !== "undefined") {
          localStorage.setItem("userRole", role);
        }
      } catch (e) {
        console.error("Failed to set role:", e);
      }

      // Update local state immediately so UI reflects correctly
      if (typeof window !== "undefined") {
        localStorage.setItem("accountType", type);
      }
      updateUser({ accountType: type, role: role as any });

      // Step 3: If organization, create org record
      if (type === "organization") {
        try {
          const orgResponse = await organizationAPI.create({
            name: "My Organization",
            domain: "",
            plan: "free",
          });

          if (orgResponse?.organization?._id && typeof window !== "undefined") {
            localStorage.setItem(
              "organizationId",
              orgResponse.organization._id,
            );
          }
        } catch (orgError: any) {
          if (!orgError?.message?.includes("already has an organization")) {
            setError("Failed to create organization. Please try again.");
            return;
          }
        }
      }

      // Step 4: Refresh user from backend to sync all fields
      await refreshUser();

      router.push("/onboarding");
    } catch (err: any) {
      console.error("Account type update error:", err);
      setError(err.message || "Failed to update account type");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen relative overflow-hidden flex flex-col font-alliance antialiased transition-colors duration-300 ${
        isDark ? "bg-[#05070f]" : "bg-slate-50"
      }`}
    >
      {/* Soft Glow */}
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[120px] ${
          isDark ? "bg-cyan-500/10" : "bg-cyan-400/10"
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
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-2">
        <img
          src={isDark ? "/assets/logo-white.png" : "/assets/logo-dark.png"}
          alt="VIP AI"
          className="h-14 w-auto object-contain"
        />

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-300 cursor-pointer ${
            isDark
              ? "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-cyan-500/40 hover:text-cyan-300"
              : "bg-black/5 border-black/10 text-black hover:bg-black/10 hover:border-blue-500/40 hover:text-blue-600"
          }`}
        >
          {isDark ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
          <span>{isDark ? "Dark" : "Light"}</span>
        </button>
      </nav>

      {/* Centered Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-12">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-12 animate-fade-in">
            <h1
              className="text-3xl md:text-4xl font-bold mb-4 leading-tight tracking-tight"
              style={{
                background: "linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              How will you use FuzeBox AI?
            </h1>
            <p
              className={`text-sm font-normal ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              Choose the option that best fits your workflow
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-3 max-w-md mx-auto">
              <p className="text-red-400 text-sm text-center font-semibold">
                {error}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {/* ================= ORGANIZATION ================= */}
            <button
              onClick={() => handleSelect("organization")}
              disabled={isLoading}
              className={cn(
                "group text-left rounded-3xl border-2 backdrop-blur-xl p-6 lg:p-7 transition-all duration-300",
                "hover:scale-[1.02] active:scale-[0.98]",
                isDark
                  ? "border-white/10 bg-white/[0.03] hover:border-blue-400/50 hover:bg-blue-500/[0.08] hover:shadow-2xl hover:shadow-blue-500/20"
                  : "border-gray-200 bg-white hover:border-blue-400/50 hover:bg-blue-50 hover:shadow-2xl hover:shadow-blue-200/60",
                isLoading && "opacity-50 cursor-not-allowed",
              )}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                  isDark
                    ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 group-hover:from-blue-500/30 group-hover:to-purple-500/30"
                    : "bg-gradient-to-br from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200"
                }`}
              >
                <Building2 className="w-7 h-7 text-blue-400" />
              </div>

              <span className="text-xs tracking-widest text-blue-400 font-bold uppercase">
                For Teams
              </span>

              <h2
                className={`text-xl lg:text-2xl font-bold mt-2 mb-3 ${isDark ? "text-white" : "text-black"}`}
              >
                Organization
              </h2>

              <p
                className={`font-normal mb-4 leading-relaxed text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
              >
                Ideal for companies, agencies, and teams collaborating on
                projects and managing workflows together.
              </p>

              <ul
                className={`space-y-2 text-sm font-normal ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                {[
                  "Shared brand voice across teams",
                  "Centralized guidelines & assets",
                  "Multi-user workflows & roles",
                  "Scales with growing teams",
                ].map((item) => (
                  <li key={item} className="flex items-start">
                    <span className="text-blue-400 mr-3 mt-0.5 font-bold">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div
                className={`mt-6 pt-4 border-t ${isDark ? "border-white/10" : "border-gray-200"}`}
              >
                <span className="text-blue-400 text-sm font-semibold group-hover:text-blue-300 transition-colors">
                  {isLoading ? "Setting up..." : "Select Organization →"}
                </span>
              </div>
            </button>

            {/* ================= INDIVIDUAL ================= */}
            <button
              onClick={() => handleSelect("individual")}
              disabled={isLoading}
              className={cn(
                "group text-left rounded-3xl border-2 backdrop-blur-xl p-6 lg:p-7 transition-all duration-300",
                "hover:scale-[1.02] active:scale-[0.98]",
                isDark
                  ? "border-white/10 bg-white/[0.03] hover:border-cyan-400/50 hover:bg-cyan-500/[0.08] hover:shadow-2xl hover:shadow-cyan-500/20"
                  : "border-gray-200 bg-white hover:border-cyan-400/50 hover:bg-cyan-50 hover:shadow-2xl hover:shadow-cyan-200/60",
                isLoading && "opacity-50 cursor-not-allowed",
              )}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                  isDark
                    ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 group-hover:from-cyan-500/30 group-hover:to-blue-500/30"
                    : "bg-gradient-to-br from-cyan-100 to-blue-100 group-hover:from-cyan-200 group-hover:to-blue-200"
                }`}
              >
                <User className="w-7 h-7 text-cyan-400" />
              </div>

              <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">
                For Creators
              </span>

              <h2
                className={`text-xl lg:text-2xl font-bold mt-2 mb-3 ${isDark ? "text-white" : "text-black"}`}
              >
                Individual
              </h2>

              <p
                className={`font-normal mb-4 leading-relaxed text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
              >
                Perfect for freelancers, artists, and solo professionals
                building their personal brand and portfolio.
              </p>

              <ul
                className={`space-y-2 text-sm font-normal ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                {[
                  "Personal brand voice & tone setup",
                  "Audience-specific content preferences",
                  "Creator-focused workflows",
                  "AI outputs tailored to you",
                ].map((item) => (
                  <li key={item} className="flex items-start">
                    <span className="text-cyan-400 mr-3 mt-0.5 font-bold">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div
                className={`mt-6 pt-4 border-t ${isDark ? "border-white/10" : "border-gray-200"}`}
              >
                <span className="text-cyan-400 text-sm font-semibold group-hover:text-cyan-300 transition-colors">
                  {isLoading ? "Processing..." : "Select Individual →"}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountType;
