"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Member";
  status: "Active" | "Invited";
  permissions: number;
}

interface ProfileData {
  brandName: string;
  website: string;
  industry: string;
  primaryColor: string;
  secondaryColor: string;
  tone: string;
  personality: string;
  contentTypes: string[];
}

const inputCls = (isDark: boolean) =>
  `w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none focus:ring-2 focus:ring-[#1389E9]/30 ${
    isDark
      ? "bg-[#0a0e1a] border-[#1f2937] text-white placeholder-gray-500 focus:border-[#1389E9]"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#1389E9]"
  }`;

const labelCls = (isDark: boolean) =>
  `block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-500" : "text-gray-500"}`;

const PERSONALITY_LABELS: Record<string, string> = {
  Expert:      "The Expert",
  Guide:       "The Guide",
  Innovator:   "The Innovator",
  Storyteller: "The Storyteller",
};

const normalizeTone = (raw: string): string => {
  if (!raw) return "Professional";
  const lower = raw.toLowerCase().trim();

  const exact: Record<string, string> = {
    "professional":                   "Professional",
    "friendly":                       "Friendly",
    "innovative":                     "Innovative",
    "empathetic":                     "Empathetic",
    "energetic":                      "Energetic",
    "educational":                    "Educational",
    "professional & informative":     "Professional",
    "friendly & conversational":      "Friendly",
    "innovative & forward-thinking":  "Innovative",
    "empathetic & supportive":        "Empathetic",
    "energetic & motivating":         "Energetic",
    "educational & insightful":       "Educational",
  };

  if (exact[lower]) return exact[lower];

  const firstWord = lower.split(/[\s&]/)[0];
  const fallback: Record<string, string> = {
    professional: "Professional",
    friendly:     "Friendly",
    innovative:   "Innovative",
    empathetic:   "Empathetic",
    energetic:    "Energetic",
    educational:  "Educational",
  };

  return fallback[firstWord] ?? "Professional";
};

const normalizePersonality = (raw: string): string => {
  if (!raw) return "Expert";
  const stripped = raw.replace(/^The\s+/i, "").trim();
  const valid = ["Expert", "Guide", "Innovator", "Storyteller"];
  return valid.includes(stripped) ? stripped : "Expert";
};

export default function UserManagement() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  const [isEditing, setIsEditing]     = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [profile, setProfile] = useState<ProfileData>({
    brandName:      "",
    website:        "",
    industry:       "Technology",
    primaryColor:   "#1389E9",
    secondaryColor: "#0EEDCD",
    tone:           "Professional",
    personality:    "Expert",
    contentTypes:   [],
  });

  const [editProfile, setEditProfile] = useState<ProfileData>(profile);

  useEffect(() => {
    const saved = localStorage.getItem("userProfile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const loaded: ProfileData = {
          brandName:      parsed.brandName      || "",
          website:        parsed.website        || "",
          industry:       parsed.industry       || "Technology",
          primaryColor:   parsed.primaryColor   || "#1389E9",
          secondaryColor: parsed.secondaryColor || "#0EEDCD",
          tone:           normalizeTone(parsed.tone || ""),
          personality:    normalizePersonality(parsed.personality || ""),
          contentTypes:   parsed.contentTypes   || [],
        };
        setProfile(loaded);
        setEditProfile(loaded);
      } catch {
        // corrupted localStorage — use defaults
      }
    }
  }, []);

  const handleSave = () => {
    setProfile({ ...editProfile });
    localStorage.setItem("userProfile", JSON.stringify(editProfile));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditProfile({ ...profile });
    setIsEditing(false);
  };

  const handleEditStart = () => {
    setEditProfile({ ...profile });
    setIsEditing(true);
  };

  const [teamMembers] = useState<TeamMember[]>([
    { id: "1", name: "TeamFB", email: "team@fuzebox.com", role: "Admin", status: "Active", permissions: 10 },
  ]);

  const filteredMembers = teamMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cardCls = `rounded-xl border p-6 ${isDark ? "bg-[#0a0e1a] border-[#1f2937]" : "bg-white border-gray-200"}`;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div />

        {!isEditing ? (
          <button
            onClick={handleEditStart}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#1389E9] to-[#0EEDCD] text-black text-[13px] font-semibold transition-opacity hover:opacity-90"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit Profile
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCancel}
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold border transition-colors ${
                isDark
                  ? "border-[#1f2937] text-gray-400 hover:text-white hover:border-[#374151]"
                  : "border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#1389E9] to-[#0EEDCD] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Brand Identity + Voice & Personality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Brand Identity */}
        <div className={cardCls}>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#0a0e1a] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1389E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <h3 className={`text-[15px] font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Brand Identity</h3>
            {isEditing && (
              <span className="ml-auto text-[11px] px-2.5 py-1 rounded-full bg-[#1389E9]/10 text-[#1389E9] border border-[#1389E9]/20 font-semibold">
                Editing
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Brand Name */}
            <div>
              <label className={labelCls(isDark)}>Brand Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editProfile.brandName}
                  onChange={(e) => setEditProfile({ ...editProfile, brandName: e.target.value })}
                  placeholder="e.g. FuzeBox"
                  className={inputCls(isDark)}
                />
              ) : (
                <p className={`text-[13px] font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                  {profile.brandName || <span className="text-gray-500">—</span>}
                </p>
              )}
            </div>

            {/* Website */}
            <div>
              <label className={labelCls(isDark)}>Website</label>
              {isEditing ? (
                <input
                  type="url"
                  value={editProfile.website}
                  onChange={(e) => setEditProfile({ ...editProfile, website: e.target.value })}
                  placeholder="https://yoursite.com"
                  className={inputCls(isDark)}
                />
              ) : (
                <p className="text-[13px] font-medium text-[#1389E9]">
                  {profile.website || <span className="text-gray-500">—</span>}
                </p>
              )}
            </div>

            {/* Industry */}
            <div>
              <label className={labelCls(isDark)}>Industry</label>
              {isEditing ? (
                <select
                  value={editProfile.industry}
                  onChange={(e) => setEditProfile({ ...editProfile, industry: e.target.value })}
                  className={inputCls(isDark)}
                >
                  <option value="Technology">Technology</option>
                  <option value="Business Services">Business Services</option>
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Creative">Creative</option>
                  <option value="Automotive">Automotive</option>
                </select>
              ) : (
                <p className={`text-[13px] font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                  {profile.industry || <span className="text-gray-500">—</span>}
                </p>
              )}
            </div>

            {/* Brand Colors */}
            <div>
              <label className={labelCls(isDark)}>Brand Colors</label>
              {isEditing ? (
                <div className="flex gap-6">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={editProfile.primaryColor}
                      onChange={(e) => setEditProfile({ ...editProfile, primaryColor: e.target.value })}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0.5 bg-transparent"
                    />
                    <div>
                      <p className={`text-[12px] font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Primary</p>
                      <p className="text-[11px] text-gray-500">{editProfile.primaryColor}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={editProfile.secondaryColor}
                      onChange={(e) => setEditProfile({ ...editProfile, secondaryColor: e.target.value })}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0.5 bg-transparent"
                    />
                    <div>
                      <p className={`text-[12px] font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Secondary</p>
                      <p className="text-[11px] text-gray-500">{editProfile.secondaryColor}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg border border-white/10 shadow-sm" style={{ backgroundColor: profile.primaryColor }} />
                    <div>
                      <p className={`text-[12px] font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Primary</p>
                      <p className="text-[11px] text-gray-500">{profile.primaryColor}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg border border-white/10 shadow-sm" style={{ backgroundColor: profile.secondaryColor }} />
                    <div>
                      <p className={`text-[12px] font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Secondary</p>
                      <p className="text-[11px] text-gray-500">{profile.secondaryColor}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Voice & Personality */}
        <div className={cardCls}>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#0a0e1a]/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0EEDCD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 0 2 2z"/>
              </svg>
            </div>
            <h3 className={`text-[15px] font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Voice &amp; Personality</h3>
            {isEditing && (
              <span className="ml-auto text-[11px] px-2.5 py-1 rounded-full bg-[#0EEDCD]/10 text-[#0EEDCD] border border-[#0EEDCD]/20 font-semibold">
                Editing
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Communication Tone */}
            <div>
              <label className={labelCls(isDark)}>Communication Tone</label>
              {isEditing ? (
                <select
                  value={editProfile.tone}
                  onChange={(e) => setEditProfile({ ...editProfile, tone: e.target.value })}
                  className={inputCls(isDark)}
                >
                  <option value="Professional">Professional</option>
                  <option value="Friendly">Friendly</option>
                  <option value="Innovative">Innovative</option>
                  <option value="Empathetic">Empathetic</option>
                  <option value="Energetic">Energetic</option>
                  <option value="Educational">Educational</option>
                </select>
              ) : (
                <p className={`text-[13px] font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                  {profile.tone || <span className="text-gray-500">—</span>}
                </p>
              )}
            </div>

            {/* Avatar Personality */}
            <div>
              <label className={labelCls(isDark)}>Avatar Personality</label>
              {isEditing ? (
                <select
                  value={editProfile.personality}
                  onChange={(e) => setEditProfile({ ...editProfile, personality: e.target.value })}
                  className={inputCls(isDark)}
                >
                  <option value="Expert">The Expert</option>
                  <option value="Guide">The Guide</option>
                  <option value="Innovator">The Innovator</option>
                  <option value="Storyteller">The Storyteller</option>
                </select>
              ) : (
                <p className={`text-[13px] font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                  {profile.personality
                    ? (PERSONALITY_LABELS[profile.personality] ?? profile.personality)
                    : <span className="text-gray-500">—</span>}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}