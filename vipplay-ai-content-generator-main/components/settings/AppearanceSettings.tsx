"use client";

import { useTheme } from "@/contexts/ThemeContext";

export default function AppearanceSettings() {
  const { effectiveTheme, theme, setTheme } = useTheme();

  const themeOptions = [
    {
      id: "light",
      icon: "☀️",
      label: "Light",
      description: "Bright and clean interface",
    },
    {
      id: "dark",
      icon: "🌙",
      label: "Dark",
      description: "Easy on the eyes in low light",
    },
    {
      id: "system",
      icon: "💻",
      label: "System",
      description: "Adapts to your device settings",
    },
  ] as const;

  return (
    <div
      className={`rounded-xl border p-6 max-w-2xl ${
        effectiveTheme === "dark"
          ? "bg-gray-800/50 border-gray-700"
          : "bg-white border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="mb-6">
        <h2
          className={`text-xl font-alliance-semibold mb-1 ${
            effectiveTheme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          Theme
        </h2>
        <p
          className={`text-sm font-alliance ${
            effectiveTheme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Choose how VIPContentAI looks to you
        </p>
      </div>

      {/* Theme Options */}
      <div className="space-y-3">
        {themeOptions.map((option) => {
          const isSelected = theme === option.id;
          return (
            <label
              key={option.id}
              className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? effectiveTheme === "dark"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-blue-500 bg-blue-50"
                  : effectiveTheme === "dark"
                    ? "border-gray-700 hover:border-gray-600 bg-gray-800/30"
                    : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              {/* Radio dot */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected
                    ? "border-blue-500"
                    : effectiveTheme === "dark"
                      ? "border-gray-600"
                      : "border-gray-300"
                }`}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                )}
              </div>

              {/* Icon */}
              <span className="text-xl">{option.icon}</span>

              {/* Label + description */}
              <div className="flex-1">
                <div
                  className={`text-sm font-alliance-semibold ${
                    effectiveTheme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {option.label}
                </div>
                <div
                  className={`text-xs font-alliance ${
                    effectiveTheme === "dark"
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
                >
                  {option.description}
                </div>
              </div>

              {/* Hidden real radio input */}
              <input
                type="radio"
                name="theme"
                value={option.id}
                checked={isSelected}
                onChange={() => setTheme(option.id)}
                className="sr-only"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
