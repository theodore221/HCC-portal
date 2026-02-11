import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Optimize package imports to reduce bundle size
    // lucide-react is imported across 57+ files — without this, full barrel export may be bundled (~200KB)
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-popover",
      "@radix-ui/react-tabs",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-switch",
      "@radix-ui/react-label",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-navigation-menu",
    ],
  },
};

export default nextConfig;
