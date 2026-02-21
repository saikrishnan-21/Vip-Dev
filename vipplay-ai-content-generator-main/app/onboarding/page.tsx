"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GradientButton } from "@/components/ui/GradientButton";
import { GradientInput } from "@/components/ui/GradientInput";
import { cn } from "@/lib/utils";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { individualAPI, organizationAPI, authAPI } from "@/api/api.service";
import {
  Briefcase,
  Smile,
  Sparkles,
  Heart,
  Zap,
  BookOpen,
  GraduationCap,
  Compass,
  Lightbulb,
  Cpu,
  ShoppingBag,
  Palette,
  Car,
  Users,
} from "lucide-react";

type Step = 1 | 2 | 4;

/* ================= CONSTANTS ================= */

const COLORS = [
  "#1F2054",
  "#1943B5",
  "#EF4444",
  "#EC4899",
  "#F97316",
  "#84CC16",
  "#06B6D4",
  "#6366F1",
  "#A855F7",
  "#E11D48",
];

/* ================= ROLE BADGE COMPONENT ================= */
const RoleBadge = ({ isDark }: { isDark: boolean }) => {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full border-2",
        "bg-blue-500/20 border-blue-400/50",
      )}
    >
      <Users className="w-4 h-4 text-blue-400" />
      <span className="text-sm font-bold text-blue-400">Admin</span>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */

export default function Onboarding() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { effectiveTheme, theme, setTheme } = useTheme();

  const isDark = effectiveTheme === "dark";

  const accountType =
    user?.accountType ||
    (typeof window !== "undefined"
      ? localStorage.getItem("accountType")
      : null) ||
    "individual";
  const userRole = "admin";

  const [step, setStep] = useState<Step>(1);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>("");

  const [profile, setProfile] = useState({
    brandName: "",
    website: "",
    industry: "",
    primaryColor: "#1943B5",
    secondaryColor: "#0EEDCD",
    tone: "",
    personality: "",
    contentTypes: [] as string[],
  });

  const totalSteps = 2;

  const getProgressStep = () => {
    if (step === 4) return totalSteps;
    return step;
  };

  const getProgressPercentage = () => {
    return (getProgressStep() / totalSteps) * 100;
  };

  /* ── shared card class ── */
  const cardActive = isDark
    ? "border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/20"
    : "border-cyan-500 bg-cyan-50 shadow-lg shadow-cyan-200/40";

  const cardIdle = isDark
    ? "border-white/10 bg-white/[0.03] hover:border-cyan-400/50 hover:bg-cyan-500/[0.08]"
    : "border-gray-200 bg-white hover:border-cyan-400/50 hover:bg-cyan-50";

  return (
    <div
      className={`h-screen relative overflow-hidden flex flex-col font-alliance antialiased transition-colors duration-300 ${
        isDark ? "bg-[#05070f]" : "bg-slate-50"
      }`}
    >
      {/* Grid pattern */}
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

      {/* Soft glow */}
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[120px] ${
          isDark ? "bg-cyan-500/10" : "bg-cyan-400/10"
        }`}
      />

      {/* Navbar */}
      <nav className="relative z-10 flex-shrink-0">
        <div className="flex items-center justify-between px-6 lg:px-12 py-2">
          <div className="flex items-center gap-4">
            <img
              src={isDark ? "/assets/logo-white.png" : "/assets/logo-dark.png"}
              alt="VIP AI"
              className="h-16 w-auto object-contain"
            />
            <RoleBadge isDark={isDark} />
          </div>

          <div className="flex items-center gap-4">
            {/* Step counter */}
            {step !== 4 && (
              <div
                className={`flex items-center gap-3 text-sm font-semibold ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <span className="hidden sm:inline">
                  Step {getProgressStep()} of {totalSteps}
                </span>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors duration-300",
                        i < getProgressStep()
                          ? "bg-cyan-400"
                          : isDark
                            ? "bg-white/20"
                            : "bg-gray-300",
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

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
        </div>

        {/* Progress Bar */}
        {step !== 4 && (
          <div
            className={`w-full h-1 relative overflow-hidden ${
              isDark ? "bg-white/10" : "bg-gray-200"
            }`}
          >
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out relative"
              style={{ width: `${getProgressPercentage()}%` }}
            >
              <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-r from-transparent via-blue-400/50 to-blue-400 blur-md" />
              <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-r from-transparent to-blue-400" />
            </div>
          </div>
        )}
      </nav>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        <div
          className="w-[55%] px-16 py-8 pb-16 overflow-y-auto custom-scrollbar"
          style={{ maxHeight: "calc(100vh - 73px)" }}
        >
          {/* ================= STEP 1 ================= */}
          {step === 1 && (
            <div className="max-w-xl space-y-6 animate-fade-in">
              <div className="space-y-2">
                <h1
                  className={`text-4xl font-semibold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Define Your Brand
                </h1>
                <p
                  className={`font-normal text-sm ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Tell us about your brand so your AI avatar can represent it
                  authentically.
                </p>
              </div>

              <GradientInput
                label="Brand Name"
                value={profile.brandName}
                placeholder="Enter your Brand Name"
                onChange={(e) =>
                  setProfile({ ...profile, brandName: e.target.value })
                }
              />

              <GradientInput
                label="Website (optional)"
                value={profile.website}
                placeholder="Enter Website URL"
                onChange={(e) =>
                  setProfile({ ...profile, website: e.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-8">
                <ColorBlock
                  title="Primary Color"
                  value={profile.primaryColor}
                  ring="ring-cyan-400"
                  isDark={isDark}
                  onChange={(v) => setProfile({ ...profile, primaryColor: v })}
                />
                <ColorBlock
                  title="Secondary Color"
                  value={profile.secondaryColor}
                  ring="ring-blue-400"
                  isDark={isDark}
                  onChange={(v) =>
                    setProfile({ ...profile, secondaryColor: v })
                  }
                />
              </div>

              <div>
                <h3
                  className={`text-sm font-semibold mb-4 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Industry
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      id: "Technology",
                      title: "Technology",
                      desc: "Software, SaaS, IT",
                      icon: Cpu,
                    },
                    {
                      id: "Business Services",
                      title: "Business Services",
                      desc: "Consulting, Finance",
                      icon: Briefcase,
                    },
                    {
                      id: "E-Commerce",
                      title: "E-Commerce",
                      desc: "Retail, Marketplace",
                      icon: ShoppingBag,
                    },
                    {
                      id: "Healthcare",
                      title: "Healthcare",
                      desc: "Medical, Wellness",
                      icon: Heart,
                    },
                    {
                      id: "Education",
                      title: "Education",
                      desc: "EdTech, Training",
                      icon: GraduationCap,
                    },
                    {
                      id: "Creative",
                      title: "Creative",
                      desc: "Design, Media, Arts",
                      icon: Palette,
                    },
                    {
                      id: "Automotive",
                      title: "Automotive",
                      desc: "Auto, Dealerships, Parts",
                      icon: Car,
                    },
                  ].map((i) => {
                    const active = profile.industry === i.id;
                    const IconComponent = i.icon;
                    return (
                      <button
                        key={i.id}
                        onClick={() =>
                          setProfile({ ...profile, industry: i.id })
                        }
                        className={cn(
                          "px-4 py-2 rounded-xl border-2 text-left transition-all duration-200",
                          active ? cardActive : cardIdle,
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <IconComponent
                            className="w-5 h-5 flex-shrink-0 mt-0.5 text-cyan-400"
                            strokeWidth={2}
                          />
                          <div>
                            <div
                              className={`font-semibold mb-1 ${
                                isDark ? "text-white" : "text-black"
                              }`}
                            >
                              {i.title}
                            </div>
                            <p
                              className={`text-sm font-normal ${
                                isDark ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {i.desc}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <GradientButton
                disabled={!profile.brandName || !profile.industry}
                onClick={() => setStep(2)}
                className="font-bold w-full"
              >
                Continue →
              </GradientButton>
            </div>
          )}

          {/* ================= STEP 2 ================= */}
          {step === 2 && (
            <div className="max-w-4xl space-y-12 animate-fade-in">
              <div>
                <h1
                  className={`text-4xl font-bold mb-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Shape Your Voice
                </h1>
                <p
                  className={`font-normal text-base ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Define how your AI avatar communicates. This shapes all
                  content it creates.
                </p>
              </div>

              {/* Communication Tone */}
              <div>
                <h3
                  className={`text-sm font-semibold mb-4 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Communication Tone
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      id: "Professional",
                      title: "Professional",
                      desc: "Formal, authoritative, trustworthy",
                      icon: Briefcase,
                    },
                    {
                      id: "Friendly",
                      title: "Friendly",
                      desc: "Warm, approachable, conversational",
                      icon: Smile,
                    },
                    {
                      id: "Innovative",
                      title: "Innovative",
                      desc: "Bold, forward-thinking, creative",
                      icon: Sparkles,
                    },
                    {
                      id: "Empathetic",
                      title: "Empathetic",
                      desc: "Understanding, supportive, caring",
                      icon: Heart,
                    },
                    {
                      id: "Energetic",
                      title: "Energetic",
                      desc: "Dynamic, enthusiastic, motivating",
                      icon: Zap,
                    },
                    {
                      id: "Educational",
                      title: "Educational",
                      desc: "Informative, clear, helpful",
                      icon: BookOpen,
                    },
                  ].map((t) => {
                    const active = profile.tone === t.id;
                    const IconComponent = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setProfile({ ...profile, tone: t.id })}
                        className={cn(
                          "p-4 rounded-2xl border-2 text-left transition-all duration-200",
                          active ? cardActive : cardIdle,
                        )}
                      >
                        <div className="flex flex-col items-center text-center gap-3">
                          <IconComponent
                            className={cn(
                              "w-8 h-8",
                              active ? "text-cyan-400" : "text-purple-400",
                            )}
                            strokeWidth={2}
                          />
                          <div>
                            <div
                              className={`font-semibold mb-1 ${
                                isDark ? "text-white" : "text-black"
                              }`}
                            >
                              {t.title}
                            </div>
                            <p
                              className={`text-sm font-normal ${
                                isDark ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {t.desc}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Avatar Personality */}
              <div>
                <h3
                  className={`text-sm font-semibold mb-4 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Avatar Personality
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      id: "Expert",
                      title: "The Expert",
                      desc: "Deep knowledge, thought leadership",
                      icon: GraduationCap,
                    },
                    {
                      id: "Guide",
                      title: "The Guide",
                      desc: "Helpful, step-by-step assistance",
                      icon: Compass,
                    },
                    {
                      id: "Innovator",
                      title: "The Innovator",
                      desc: "Cutting-edge, trendsetting ideas",
                      icon: Lightbulb,
                    },
                    {
                      id: "Storyteller",
                      title: "The Storyteller",
                      desc: "Engaging narratives, memorable content",
                      icon: BookOpen,
                    },
                  ].map((p) => {
                    const active = profile.personality === p.id;
                    const IconComponent = p.icon;
                    return (
                      <button
                        key={p.id}
                        onClick={() =>
                          setProfile({ ...profile, personality: p.id })
                        }
                        className={cn(
                          "p-4 rounded-2xl border-2 text-left transition-all duration-200",
                          active ? cardActive : cardIdle,
                        )}
                      >
                        <div className="flex flex-col items-center text-center gap-3">
                          <IconComponent
                            className={cn(
                              "w-8 h-8",
                              active ? "text-cyan-400" : "text-purple-400",
                            )}
                            strokeWidth={2}
                          />
                          <div>
                            <div
                              className={`font-semibold mb-1 ${
                                isDark ? "text-white" : "text-black"
                              }`}
                            >
                              {p.title}
                            </div>
                            <p
                              className={`text-sm font-normal ${
                                isDark ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {p.desc}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(1)}
                  className={`font-semibold transition-colors ${
                    isDark
                      ? "text-white hover:text-cyan-400"
                      : "text-black hover:text-cyan-500"
                  }`}
                >
                  ← Back
                </button>
                <GradientButton
                  disabled={!profile.tone || !profile.personality}
                  onClick={() => setStep(4)}
                  className="font-bold"
                >
                  Complete Setup →
                </GradientButton>
              </div>
            </div>
          )}

          {/* ================= STEP 4 ================= */}
          {step === 4 && (
            <div
              className={`fixed inset-0 z-[100] overflow-y-auto ${
                isDark ? "bg-[#05070f]" : "bg-slate-50"
              }`}
            >
              <div className="mx-auto min-h-screen max-w-5xl flex flex-col items-center text-center pb-24">
                <div className="pt-20" />

                <img
                  src="/assets/robot-avatar.png"
                  className="h-60 animate-float drop-shadow-[0_0_50px_rgba(0,200,255,0.35)]"
                  alt="AI Avatar"
                />

                <h1
                  className={`mt-4 text-5xl font-semibold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Review Your Brand
                </h1>

                <div
                  className={`mt-6 w-full border-2 rounded-2xl px-6 py-4 text-left ${
                    isDark
                      ? "bg-white/[0.03] border-white/10"
                      : "bg-white border-gray-200 shadow-sm"
                  }`}
                >
                  <h3
                    className={`mb-4 font-bold text-lg ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Avatar Profile
                  </h3>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    {[
                      { label: "Brand", value: profile.brandName },
                      { label: "Website", value: profile.website || "—" },
                      { label: "Industry", value: profile.industry },
                      { label: "Tone", value: profile.tone },
                      { label: "Personality", value: profile.personality },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div
                          className={`font-normal mb-1 ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {label}
                        </div>
                        <div
                          className={`font-semibold ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {value}
                        </div>
                      </div>
                    ))}

                    <div>
                      <div
                        className={`font-normal mb-1 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Colors
                      </div>
                      <div className="flex gap-2 mt-1">
                        <span
                          className="w-5 h-5 rounded-full border-2 border-white/20"
                          style={{ backgroundColor: profile.primaryColor }}
                        />
                        <span
                          className="w-5 h-5 rounded-full border-2 border-white/20"
                          style={{ backgroundColor: profile.secondaryColor }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <GradientButton
                    className="h-14 text-lg px-10 font-bold"
                    onClick={() => setShowLaunchModal(true)}
                  >
                    Launch FuzeBox AI Suite
                  </GradientButton>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel — Avatar */}
        {step !== 4 && (
          <div
            className={`w-[45%] flex items-center justify-center relative overflow-hidden ${
              isDark ? "bg-[#05070f]" : "bg-slate-50"
            }`}
            style={{
              height: "calc(100vh - 73px)",
              position: "fixed",
              right: 0,
              top: "76px",
            }}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-t ${
                isDark
                  ? "from-cyan-500/10 via-transparent to-transparent"
                  : "from-cyan-400/5 via-transparent to-transparent"
              }`}
            />
            <div className="relative">
              <img
                src="/assets/robot-avatar.png"
                className="relative z-10 w-auto h-[70vh] object-contain"
                style={{
                  filter: "drop-shadow(0 0 40px rgba(34, 211, 238, 0.4))",
                }}
                alt="AI Avatar"
              />
            </div>
          </div>
        )}
      </div>

      {/* ================= SUCCESS POPUP ================= */}
      {showLaunchModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div
            className={`w-full max-w-md rounded-2xl border-2 border-cyan-400/50 backdrop-blur-sm p-8 shadow-2xl shadow-cyan-500/20 animate-fade-in text-center ${
              isDark ? "bg-white/[0.05]" : "bg-white"
            }`}
          >
            <img
              src="/assets/robot-avatar.png"
              className="mx-auto w-24 h-24 drop-shadow-[0_0_30px_rgba(0,200,255,0.35)]"
              alt="AI Avatar"
            />

            <h2
              className={`mt-6 text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Brand Created Successfully
            </h2>

            <p
              className={`mt-3 text-sm font-normal ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Your FuzeBox AI avatar has been successfully created and is ready
              to use.
            </p>

            {saveError && (
              <p className="mt-4 text-sm text-red-400 font-semibold">
                {saveError}
              </p>
            )}

            <div className="mt-6 flex justify-center">
              <GradientButton
                className="font-bold"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  setSaveError("");

                  try {
                    if (accountType === "organization") {
                      if (!user?.organizationId) {
                        try {
                          const orgResponse = await organizationAPI.create({
                            name: profile.brandName || "My Organization",
                            domain: profile.website || "",
                            plan: "free",
                          });

                          await refreshUser();
                          await new Promise((resolve) =>
                            setTimeout(resolve, 500),
                          );
                        } catch (orgError: any) {
                          if (
                            !orgError?.message?.includes(
                              "already has an organization",
                            )
                          ) {
                            throw new Error(
                              "Failed to create organization. Please try again.",
                            );
                          }
                        }
                      }

                      await organizationAPI.saveProfile({
                        brandName: profile.brandName,
                        website: profile.website,
                        primaryColor: profile.primaryColor,
                        secondaryColor: profile.secondaryColor,
                        industry: profile.industry,
                        personality: profile.personality
                          ? [profile.personality]
                          : [],
                        contentTypes: profile.contentTypes,
                        isOnboardingComplete: true,
                        completedAt: new Date().toISOString(),
                      });
                    } else {
                      await individualAPI.save({
                        fullName: user?.fullName || profile.brandName,
                        website: profile.website,
                        primaryColor: profile.primaryColor,
                        secondaryColor: profile.secondaryColor,
                        industry: profile.industry,
                        personality: profile.personality
                          ? [profile.personality]
                          : [],
                        contentTypes: profile.contentTypes,
                        isOnboardingComplete: true,
                        completedAt: new Date().toISOString(),
                      });
                    }

                    localStorage.setItem(
                      "userProfile",
                      JSON.stringify({ ...profile, userRole, accountType }),
                    );

                    setShowLaunchModal(false);
                    await refreshUser();

                    const freshUserData = await authAPI.getMe();
                    console.log("🎯 Final role:", freshUserData?.user?.role);
                    console.log(
                      "🎯 Org ID:",
                      freshUserData?.user?.organizationId,
                    );

                    router.replace("/dashboard");
                  } catch (e: any) {
                    setSaveError(e?.message || "Failed to save onboarding");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving..." : "Go to Dashboard"}
              </GradientButton>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.2) transparent; }
        .animate-fade-in { animation: fadeIn 0.5s ease-in; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

/* ================= COLOR BLOCK ================= */

const ColorBlock = ({
  title,
  value,
  onChange,
  ring,
  isDark,
}: {
  title: string;
  value: string;
  ring: string;
  isDark: boolean;
  onChange: (v: string) => void;
}) => (
  <div className="space-y-4">
    <h3
      className={`text-sm font-bold uppercase tracking-wider ${
        isDark ? "text-gray-400" : "text-gray-700"
      }`}
    >
      {title}
    </h3>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full h-12 px-5 rounded-xl border-2 font-bold focus:outline-none focus:border-cyan-400 transition-all ${
        isDark
          ? "bg-white/[0.05] border-white/10 text-white focus:bg-white/[0.08]"
          : "bg-white border-gray-200 text-gray-900 focus:bg-gray-50"
      }`}
    />
    <div className="flex flex-wrap gap-2.5">
      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={cn(
            "w-8 h-8 rounded-full border-2 border-white/20 transition-all hover:scale-125 hover:shadow-lg",
            value === c &&
              `ring-2 ring-offset-4 ${
                isDark ? "ring-offset-[#05070f]" : "ring-offset-slate-50"
              } ${ring}`,
          )}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  </div>
);
