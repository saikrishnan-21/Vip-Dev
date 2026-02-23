"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import AppLayout from "@/components/AppLayout";
import ProfileSettings from "@/components/settings/ProfileSettings";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import UserManagement from "@/components/settings/UserManagement";
import AdminDashboard from "@/components/settings/AdminDashboard";

type TabId = "profile" | "appearance" | "user-management" | "admin-dashboard";

const SETTINGS_TABS = [
  { id: "profile" as TabId, label: "Profile", icon: "👤" },
  { id: "appearance" as TabId, label: "Appearance", icon: "🎨" },
  { id: "user-management" as TabId, label: "User Management", icon: "👥" },
  { id: "admin-dashboard" as TabId, label: "Admin Dashboard", icon: "🔧" },
];

export default function Settings() {
  const { effectiveTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const isDark = effectiveTheme === "dark";

  return (
    <>
      {/* Header */}
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
          Settings
        </h1>
        <p
          style={{
            color: isDark ? "#9ca3af" : "#6b7280",
            fontSize: 14,
            margin: 0,
          }}
        >
          Manage your account settings and preferences
        </p>
      </header>

      {/* Body */}
      <div style={{ padding: 32 }}>
        {/* Tabs */}
        <div
          style={{
            borderBottom: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
            marginBottom: 32,
          }}
        >
          <div style={{ display: "flex", gap: 24, overflowX: "auto" }}>
            {SETTINGS_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 16px",
                    border: "none",
                    borderBottom: isActive
                      ? `2px solid ${isDark ? "#3b82f6" : "#2563eb"}`
                      : "2px solid transparent",
                    background: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontSize: 13,
                    fontWeight: 600,
                    color: isActive
                      ? isDark
                        ? "#ffffff"
                        : "#111827"
                      : isDark
                        ? "#9ca3af"
                        : "#6b7280",
                    transition: "color 0.15s, border-color 0.15s",
                    marginBottom: -1,
                    outline: "none",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "profile" && <ProfileSettings />}
          {activeTab === "appearance" && <AppearanceSettings />}
          {activeTab === "user-management" && <UserManagement />}
          {activeTab === "admin-dashboard" && <AdminDashboard />}
        </div>
      </div>
    </>
  );
}
