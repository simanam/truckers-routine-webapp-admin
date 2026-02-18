"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Layers,
  Dumbbell,
  RefreshCw,
  Lightbulb,
  Quote,
  Calendar,
  Shuffle,
  Users,
  Shield,
  Building,
  CreditCard,
  HelpCircle,
  Key,
  ChevronDown,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Content",
    items: [
      { label: "Blueprints", href: "/blueprints", icon: Layers },
      { label: "Exercises", href: "/exercises", icon: Dumbbell },
      { label: "Preset Resets", href: "/preset-resets", icon: RefreshCw },
      { label: "Tips", href: "/tips", icon: Lightbulb },
      { label: "Quotes", href: "/quotes", icon: Quote },
    ],
  },
  {
    title: "Workouts",
    items: [
      { label: "Daily Generation", href: "/workouts", icon: Calendar },
      { label: "Alternatives", href: "/workouts/alternatives", icon: Shuffle },
    ],
  },
  {
    title: "Users",
    items: [
      { label: "User Management", href: "/users", icon: Users },
      { label: "Admin Roles", href: "/users/admins", icon: Shield },
      { label: "Corporate", href: "/corporate", icon: Building },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Pricing", href: "/pricing", icon: CreditCard },
      { label: "Help Center", href: "/help-center", icon: HelpCircle },
      { label: "API Keys", href: "/api-keys", icon: Key },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <Image
          src="/images/logo-alt.png"
          alt="Trucker's Routine"
          width={150}
          height={40}
          className="brightness-0 invert"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Dashboard link */}
        <Link
          href="/"
          className={cn(
            "mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        {/* Sections */}
        {NAV_SECTIONS.map((section) => (
          <SidebarSection
            key={section.title}
            section={section}
            pathname={pathname}
          />
        ))}
      </nav>
    </aside>
  );
}

function SidebarSection({
  section,
  pathname,
}: {
  section: NavSection;
  pathname: string;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-1">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/70">
        {section.title}
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1">
          {section.items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
