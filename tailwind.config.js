/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2F5233",
        "primary-light": "#4A7C4E",
        secondary: "#E8F5E9",
        accent: "#FF6B35",
        neutral: "#F8F9FA",
        text: "#1A1A1A",
        "text-light": "#6B7280",
        border: "#E5E7EB",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      spacing: {
        "unit-1": "4px",
        "unit-2": "8px",
        "unit-3": "12px",
        "unit-4": "16px",
        "unit-6": "24px",
        "unit-8": "32px",
        "unit-12": "48px",
        "unit-16": "64px",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};
