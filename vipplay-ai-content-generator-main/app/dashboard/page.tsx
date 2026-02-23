"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { dashboardAPI } from "@/api/api.service";

interface ProfileData {
  brandName: string;
  website: string;
  industry: string;
  primaryColor: string;
  secondaryColor: string;
  tone: string;
  personality: string;
  contentTypes: string[];
  userRole?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const userRole = user?.role ?? "user";

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      try {
        const resp = await dashboardAPI.getDashboard();
        const bp = resp?.data?.profile;
        if (bp && !cancelled) {
          const mapped: ProfileData = {
            brandName:
              bp.brandName || bp.fullName || user?.fullName || "My Brand",
            website: bp.website || "",
            industry: bp.industry || "Technology",
            primaryColor: bp.primaryColor || "#1389E9",
            secondaryColor: bp.secondaryColor || "#0EEDCD",
            tone: "Professional",
            personality: Array.isArray(bp.personality)
              ? bp.personality[0] || "Friendly"
              : bp.personality || "Friendly",
            contentTypes: Array.isArray(bp.contentTypes)
              ? bp.contentTypes
              : ["Social Media", "Blog Posts"],
            userRole,
          };
          setProfile(mapped);
          localStorage.setItem("userProfile", JSON.stringify(mapped));
          return;
        }
      } catch {}
      const saved = localStorage.getItem("userProfile");
      if (saved && !cancelled) {
        setProfile(JSON.parse(saved));
        return;
      }
      if (!cancelled) {
        const def: ProfileData = {
          brandName: user?.fullName || "My Brand",
          website: "",
          industry: "Technology",
          primaryColor: "#1389E9",
          secondaryColor: "#0EEDCD",
          tone: "Professional",
          personality: "Friendly",
          contentTypes: ["Social Media", "Blog Posts"],
          userRole,
        };
        setProfile(def);
        localStorage.setItem("userProfile", JSON.stringify(def));
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user, userRole]);

  if (!profile) return null;
  const isDark = effectiveTheme === "dark";
  const grad = `linear-gradient(to right, ${profile.primaryColor}, ${profile.secondaryColor})`;

  return (
    <main
      style={{
        flex: 1,
        overflow: "auto",
      }}
    >
      <header
        style={{
          borderBottom: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
          padding: "24px 32px",
          background: isDark ? "#0a0e1a" : "#ffffff",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: isDark ? "#ffffff" : "#111827",
            margin: 0,
            marginBottom: 4,
          }}
        >
          Dashboard
        </h1>
        <p style={{ color: isDark ? "#9ca3af" : "#6b7280", fontSize: 14 }}>
          Welcome back! Here's your content overview.
        </p>
      </header>

      <div style={{ padding: 32 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 24,
            marginBottom: 24,
          }}
        >
          {/* Generate New Content Card */}
          <div
            style={{
              borderRadius: 12,
              border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
              padding: 24,
              background: isDark ? "rgba(31,41,55,0.5)" : "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: isDark ? "#ffffff" : "#111827",
                    marginBottom: 6,
                  }}
                >
                  Generate New Content
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: isDark ? "#9ca3af" : "#6b7280",
                  }}
                >
                  Create AI-powered articles from trends and your knowledge base
                </p>
              </div>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1389E9"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <button
              onClick={() => router.push("/dashboard/generate")}
              style={{
                padding: "10px 22px",
                borderRadius: 8,
                border: "none",
                background: grad,
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 16 }}>+</span> Start Generating
            </button>
          </div>

          {/* Total Articles Card */}
          <div
            style={{
              borderRadius: 12,
              border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
              padding: 24,
              background: isDark ? "rgba(31,41,55,0.5)" : "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 12,
                    color: isDark ? "#9ca3af" : "#6b7280",
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Total Articles
                </p>
                <p
                  style={{
                    fontSize: 42,
                    fontWeight: 700,
                    color: isDark ? "#ffffff" : "#111827",
                    lineHeight: 1,
                  }}
                >
                  0
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: isDark ? "#6b7280" : "#9ca3af",
                    marginTop: 6,
                  }}
                >
                  Generated this month
                </p>
              </div>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1389E9"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div
          style={{
            borderRadius: 12,
            border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
            overflow: "hidden",
            background: isDark ? "rgba(31,41,55,0.5)" : "#ffffff",
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              borderBottom: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: isDark ? "#ffffff" : "#111827",
              }}
            >
              Recent Activity
            </h2>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "64px 24px",
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isDark ? "#374151" : "#d1d5db"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginBottom: 16 }}
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <p
              style={{
                fontSize: 14,
                color: isDark ? "#9ca3af" : "#6b7280",
                marginBottom: 20,
              }}
            >
              No articles generated yet
            </p>
            <button
              onClick={() => router.push("/dashboard/generate")}
              style={{
                padding: "10px 22px",
                borderRadius: 8,
                border: "none",
                background: grad,
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Generate Your First Article
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}