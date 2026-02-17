# Phase 1: Project Setup & Foundation

## Overview

Initialize the Next.js admin app with all dependencies, brand theming, and project structure. After this phase, you'll have a running Next.js app with Tailwind CSS, shadcn/ui, and all required libraries installed.

---

## 1. Initialize Next.js Project

Run from the project root (`truckers-routine-admin-webapp/`):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Options when prompted:
- TypeScript: **Yes**
- ESLint: **Yes**
- Tailwind CSS: **Yes**
- `src/` directory: **No** (files go directly in `app/`, `lib/`, `components/`)
- App Router: **Yes**
- Import alias: **@/***

---

## 2. Install Dependencies

### Core UI & State Management

```bash
npm install @tanstack/react-query zustand
```

| Package | Purpose |
|---------|---------|
| `@tanstack/react-query` | Server state management, data fetching, caching, mutations |
| `zustand` | Lightweight client state for auth (user, tokens) |

### Forms & Validation

```bash
npm install react-hook-form @hookform/resolvers zod
```

| Package | Purpose |
|---------|---------|
| `react-hook-form` | Performant form management with minimal re-renders |
| `@hookform/resolvers` | Connects zod schemas to react-hook-form |
| `zod` | TypeScript-first schema validation for form data + API payloads |

### Icons & Utilities

```bash
npm install lucide-react date-fns clsx tailwind-merge
```

| Package | Purpose |
|---------|---------|
| `lucide-react` | Icon library (consistent with landing page) |
| `date-fns` | Date formatting/manipulation for calendars, scheduled dates |
| `clsx` | Conditional CSS class joining |
| `tailwind-merge` | Merge Tailwind classes without conflicts |

### Drag & Drop (for exercise ordering in blueprints)

```bash
npm install @hello-pangea/dnd
```

| Package | Purpose |
|---------|---------|
| `@hello-pangea/dnd` | Drag-and-drop for reordering exercises in blueprint/reset forms |

---

## 3. Initialize shadcn/ui

```bash
npx shadcn@latest init
```

When prompted:
- Style: **New York**
- Base color: **Slate**
- CSS variables: **Yes**

### Install All Required Components

Run each command (or combine them):

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add alert-dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add select
npx shadcn@latest add badge
npx shadcn@latest add tabs
npx shadcn@latest add toast
npx shadcn@latest add sonner
npx shadcn@latest add sheet
npx shadcn@latest add separator
npx shadcn@latest add skeleton
npx shadcn@latest add avatar
npx shadcn@latest add textarea
npx shadcn@latest add checkbox
npx shadcn@latest add switch
npx shadcn@latest add popover
npx shadcn@latest add command
npx shadcn@latest add calendar
npx shadcn@latest add tooltip
npx shadcn@latest add scroll-area
npx shadcn@latest add form
npx shadcn@latest add radio-group
npx shadcn@latest add slider
npx shadcn@latest add collapsible
```

**Why each component:**

| Component | Used For |
|-----------|----------|
| `button` | All CTAs, actions, form submits |
| `input` | Text fields across all forms |
| `label` | Form field labels |
| `card` | Stats cards, content cards on dashboard |
| `table` | Data tables for all list pages |
| `dialog` | Create/edit modals (quotes, templates, etc.) |
| `alert-dialog` | Destructive confirmations (delete, demote, revoke) |
| `dropdown-menu` | Row actions menus, user dropdown |
| `select` | Filter dropdowns, form selects (type, category, difficulty) |
| `badge` | Status badges (active/inactive), tier badges, tag display |
| `tabs` | Tab views on detail pages, calendar/list toggle |
| `toast` / `sonner` | Success/error notifications |
| `sheet` | Mobile sidebar, exercise detail side panel |
| `separator` | Visual section dividers |
| `skeleton` | Loading placeholders in tables and cards |
| `avatar` | User avatar in header |
| `textarea` | Long text fields (descriptions, content, instructions) |
| `checkbox` | Multi-select options, bulk actions |
| `switch` | Activate/deactivate toggles, featured toggles |
| `popover` | Exercise picker popover, date picker |
| `command` | Combobox/searchable select for exercise search |
| `calendar` | Date pickers for tips, workouts, scheduling |
| `tooltip` | Help text on hover |
| `scroll-area` | Scrollable lists (exercise picker results) |
| `form` | Form wrapper with react-hook-form integration |
| `radio-group` | Mutually exclusive options (exercise type: reps/timer) |
| `slider` | Round count selector, energy level range |
| `collapsible` | Sidebar section collapse |

---

## 4. Brand Theme Configuration

### 4.1 Tailwind CSS Theme

Update `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        navy: {
          DEFAULT: "#31407F",
          dark: "#1C2342",
          light: "#3A4EA3",
        },
        orange: {
          DEFAULT: "#FF670E",
          light: "#FFE6D7", // Peach tint
        },
        cream: "#FFFDEE",
        lavender: "#DDDFEE",
        "warm-gray": "#55544F",

        // Semantic Colors (shadcn/ui compatible)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        // Status Colors
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",

        // Category Colors (for tips/badges)
        category: {
          nutrition: "#4CAF50",
          exercise: "#4CAF50",
          hygiene: "#2196F3",
          hydration: "#2196F3",
          "mental-health": "#9C27B0",
          sleep: "#3F51B5",
          safety: "#F44336",
          stress: "#00BCD4",
          social: "#FF9800",
          cabin: "#795548",
        },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 4.2 CSS Variables — `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Brand-mapped shadcn variables */
    --background: 0 0% 100%;          /* white */
    --foreground: 222 47% 18%;        /* dark navy #1C2342 */

    --card: 0 0% 100%;
    --card-foreground: 222 47% 18%;

    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 18%;

    --primary: 226 41% 35%;           /* navy #31407F */
    --primary-foreground: 47 100% 97%; /* cream #FFFDEE */

    --secondary: 226 29% 90%;         /* lavender #DDDFEE */
    --secondary-foreground: 226 41% 35%;

    --muted: 226 29% 90%;
    --muted-foreground: 30 5% 32%;    /* warm gray #55544F */

    --accent: 22 100% 53%;            /* orange #FF670E */
    --accent-foreground: 0 0% 100%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;

    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 226 41% 35%;              /* navy for focus rings */

    --radius: 0.75rem;

    /* Sidebar */
    --sidebar-background: 222 47% 18%;      /* dark navy */
    --sidebar-foreground: 47 100% 97%;       /* cream */
    --sidebar-primary: 22 100% 53%;          /* orange */
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 226 41% 35%;           /* navy */
    --sidebar-accent-foreground: 47 100% 97%;
    --sidebar-border: 226 37% 28%;
    --sidebar-ring: 22 100% 53%;

    /* Chart colors */
    --chart-1: 226 41% 35%;   /* navy */
    --chart-2: 22 100% 53%;   /* orange */
    --chart-3: 160 60% 45%;   /* green */
    --chart-4: 38 92% 50%;    /* yellow */
    --chart-5: 262 52% 47%;   /* purple */
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-montserrat), ui-sans-serif, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

/* Focus visible for accessibility */
*:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}
```

### 4.3 Font Setup — `app/layout.tsx`

```typescript
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Trucker's Routine Admin",
  description: "Admin dashboard for Trucker's Routine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  );
}
```

---

## 5. Copy Logo Assets

Copy these files into `public/images/`:

| Source | Destination | Description |
|--------|-------------|-------------|
| `truckers-routine-webapp/public/images/newlogo.png` | `public/images/logo.png` | Main logo (header) |
| `truckers-routine-webapp/public/images/trlogo-2.png` | `public/images/logo-alt.png` | Alt logo (sidebar) |
| `truckers-routine-webapp/app/favicon.ico` | `app/favicon.ico` | Favicon |
| `truckers-routine-webapp/app/icon.png` | `app/icon.png` | Web app icon |
| `truckers-routine-webapp/app/apple-icon.png` | `app/apple-icon.png` | Apple touch icon |

```bash
mkdir -p public/images
cp "../truckers-routine-webapp/public/images/newlogo.png" public/images/logo.png
cp "../truckers-routine-webapp/public/images/trlogo-2.png" public/images/logo-alt.png
cp "../truckers-routine-webapp/app/favicon.ico" app/favicon.ico
cp "../truckers-routine-webapp/app/icon.png" app/icon.png
cp "../truckers-routine-webapp/app/apple-icon.png" app/apple-icon.png
```

---

## 6. Utility Function — `lib/utils.ts`

shadcn/ui creates this automatically, but ensure it contains:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 7. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-api.railway.app/api/v1
```

Create `.env.example` (for version control):

```env
NEXT_PUBLIC_API_URL=https://your-api.railway.app/api/v1
```

Add to `.gitignore`:

```
.env.local
.env*.local
```

---

## 8. next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
```

---

## 9. Project Structure After Phase 1

```
truckers-routine-admin-webapp/
├── app/
│   ├── globals.css              # Brand theme CSS variables
│   ├── layout.tsx               # Root layout with Montserrat font
│   ├── page.tsx                 # Default page (will become dashboard redirect)
│   ├── favicon.ico              # Copied from landing page
│   ├── icon.png                 # Web app icon
│   └── apple-icon.png           # Apple touch icon
├── components/
│   └── ui/                      # shadcn/ui components (auto-generated)
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       ├── table.tsx
│       ├── dialog.tsx
│       ├── ...                  # All other shadcn components
├── lib/
│   └── utils.ts                 # cn() utility
├── public/
│   └── images/
│       ├── logo.png             # Main logo
│       └── logo-alt.png         # Alt logo for sidebar
├── docs/
│   ├── ADMIN_APP_GUIDE.md       # Original API guide
│   ├── PHASE-1-PROJECT-SETUP.md # This document
│   └── ...                      # Other phase docs
├── .env.local                   # Environment variables
├── .env.example                 # Template for env vars
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind with brand colors
├── tsconfig.json                # TypeScript config
├── package.json                 # Dependencies
└── components.json              # shadcn/ui config
```

---

## Verification Checklist

- [ ] `npm run dev` starts without errors
- [ ] Page loads at `http://localhost:3000`
- [ ] Montserrat font renders correctly
- [ ] Logo images load from `/images/logo.png`
- [ ] shadcn/ui components import correctly (e.g., `import { Button } from "@/components/ui/button"`)
- [ ] Brand colors are accessible via Tailwind classes (e.g., `bg-navy`, `text-orange`)
- [ ] No TypeScript errors: `npx tsc --noEmit`
