"use client";

import Link from "next/link";
import { GradientButton } from "@/components/ui/GradientButton";
import { useTheme } from "@/contexts/ThemeContext";

const featurePills = [
  { title: "FuzeBoxStudio", subtitle: "Plan + Create" },
  { title: "FuzeBoxCast", subtitle: "Publish + Distribute" },
  { title: "FuzeBoxOptimize", subtitle: "Test + Improve" },
  { title: "FuzeBoxVision", subtitle: "Understand + Recommend" },
];

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const LandingPage = () => {
  const { effectiveTheme, theme, setTheme } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  const isDark = effectiveTheme === "dark";

  // Redirect authenticated users
  useEffect(() => {
    if (!loading && user) {
      if (!user.accountType) {
        router.replace("/account-type");
      } else if (!user.onboardingCompleted) {
        router.replace("/onboarding");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, router]);

  return (
    <>
      <div
        className={`relative min-h-screen overflow-y-auto antialiased flex flex-col transition-colors duration-300 ${
          isDark ? "bg-[#05070f] text-white" : "bg-slate-50 text-black"
        }`}
        style={{
          fontFamily:
            '"Poppins", -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        {/* Grid Background */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            opacity: isDark ? 0.05 : 0.04,
            backgroundImage: `
              linear-gradient(rgba(${isDark ? "255,255,255" : "0,0,0"},0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(${isDark ? "255,255,255" : "0,0,0"},0.15) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Ambient glow */}
        <div
          className={`fixed top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[120px] pointer-events-none ${
            isDark ? "bg-cyan-500/10" : "bg-cyan-400/8"
          }`}
        />

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-2">
          <div className="h-16 flex items-center">
            <img
              src={isDark ? "/assets/logo-white.png" : "/assets/logo-dark.png"}
              alt="FuzeBox"
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

          {/* Navbar Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className={`text-sm font-semibold transition-colors ${
                isDark
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              Log in
            </Link>

            {/* Theme Toggle */}
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
          </div>
        </nav>

        {/* Hero */}
        <section className="relative z-10 flex-1 flex items-center justify-center px-6 lg:px-12 py-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Avatar */}
            <div className="flex justify-center mb-4">
              <img
                src="/assets/logo-icon.png"
                alt="Crystal AI Avatar"
                className="w-32 xs:w-40 sm:w-48 md:w-56 lg:w-64 animate-float-rotate drop-shadow-[0_0_60px_rgba(34,211,238,0.45)]"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const div = document.createElement("div");
                  div.className =
                    "w-48 h-48 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center";
                  div.innerHTML =
                    '<span class="text-white text-5xl font-black">AI</span>';
                  e.currentTarget.parentElement?.appendChild(div);
                }}
              />
            </div>

            {/* Welcome badge */}
            <div className="mb-2">
              <span
                className={`inline-flex items-center gap-2 text-xs tracking-wide font-semibold ${
                  isDark ? "text-cyan-400" : "text-cyan-600"
                }`}
              >
                Welcome to FuzeBox Content Studio
              </span>
            </div>

            {/* Heading */}
            <h1
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-3 leading-tight px-4"
              style={{
                background: "linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: 600,
                letterSpacing: "-0.015em",
              }}
            >
              Let&apos;s Shape Your AI Avatar
            </h1>

            {/* Description */}
            <p
              className={`text-xs md:text-sm max-w-2xl mx-auto mb-6 leading-relaxed px-4 font-normal ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Your FuzeBox will evolve as you define your brand&apos;s voice,
              personality, and content focus. Together, we&apos;ll create an AI
              agent that truly represents your unique identity.
            </p>

            {/* Feature Pills */}
            <div className="mb-6 px-4">
              <div className="flex md:grid md:grid-cols-4 gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                {featurePills.map((pill) => (
                  <div
                    key={pill.title}
                    className={`flex-shrink-0 w-40 md:w-auto rounded-2xl backdrop-blur-md py-2.5 px-3 transition-all duration-300 border ${
                      isDark
                        ? "bg-white/[0.05] border-cyan-500/20 hover:bg-white/[0.08] hover:border-cyan-400/30"
                        : "bg-white border-cyan-200 hover:bg-cyan-50 hover:border-cyan-300 shadow-sm"
                    }`}
                  >
                    <div
                      className={`text-xs mb-0.5 font-semibold ${
                        isDark ? "text-white" : "text-black"
                      }`}
                    >
                      {pill.title}
                    </div>
                    <div
                      className={`text-[10px] ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {pill.subtitle}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex justify-center">
              <Link href="/register">
                <GradientButton
                  className="h-11 px-7 rounded-2xl text-sm"
                  style={{ fontWeight: 500 }}
                >
                  Begin Your Journey
                </GradientButton>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 text-center pb-3">
          <p
            className={`text-[10px] font-normal ${isDark ? "text-gray-400" : "text-gray-400"}`}
          >
            © 2024 FuzeBox Suite. All rights reserved.
          </p>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes floatRotate {
          0% {
            transform: translateY(0px) rotateY(0deg);
          }
          50% {
            transform: translateY(-12px) rotateY(180deg);
          }
          100% {
            transform: translateY(0px) rotateY(360deg);
          }
        }
        .animate-float-rotate {
          animation: floatRotate 12s ease-in-out infinite;
          transform-style: preserve-3d;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default LandingPage;
