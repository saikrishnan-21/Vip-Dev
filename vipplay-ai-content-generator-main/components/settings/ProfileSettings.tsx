"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function ProfileSettings() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    accountType: "individual",
    organizationId: "",
  });
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        accountType: user.accountType || "individual",
        organizationId: user.organizationId || "",
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Profile updated:", formData);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const inputCls = `w-full px-4 py-3 rounded-lg border font-alliance transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
    isDark
      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-600"
  }`;

  const labelCls = `block text-sm font-alliance-semibold mb-2 ${
    isDark ? "text-gray-300" : "text-gray-700"
  }`;

  const accountTypeLabel =
    formData.accountType.charAt(0).toUpperCase() +
    formData.accountType.slice(1);

  return (
    <>
      <div
        className={`rounded-xl border p-6 ${
          isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <h2
          className={`text-xl font-alliance-semibold mb-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Profile Information
        </h2>
        <p
          className={`text-sm font-alliance mb-6 ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Update your personal information and profile details
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Address */}
          <div>
            <label className={labelCls}>Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="you@example.com"
              className={inputCls}
            />
          </div>

          {/* Full Name */}
          <div>
            <label className={labelCls}>Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder="Your full name"
              className={inputCls}
            />
          </div>

          {/* Account Type — read-only */}
          <div>
            <label className={labelCls}>Account Type</label>
            <div
              className={`w-full px-4 py-3 rounded-lg border font-alliance flex items-center justify-between ${
                isDark
                  ? "bg-gray-700/50 border-gray-600 text-gray-400"
                  : "bg-gray-50 border-gray-200 text-gray-500"
              }`}
            >
              <span>{accountTypeLabel}</span>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-alliance-semibold rounded-lg hover:shadow-lg hover:opacity-90 transition-all"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border animate-fade-in ${
            isDark
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-white border-gray-200 text-gray-900"
          }`}
        >
          {/* Green check circle */}
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex-shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-green-500"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>

          {/* Text */}
          <div className="flex-1">
            <p className="text-sm font-alliance-semibold">Profile Updated</p>
            <p
              className={`text-xs font-alliance ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Your changes have been saved successfully.
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={() => setShowToast(false)}
            className={`ml-1 transition-colors ${
              isDark
                ? "text-gray-500 hover:text-gray-200"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}