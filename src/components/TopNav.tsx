"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileStack, User } from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, text: "Dashboard" },
  { href: "/documents", icon: FileStack, text: "Documents" },
  { href: "/profile", icon: User, text: "Profile" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="flex-shrink-0 border-b border-earth-200 bg-earth-50">
      <nav className="flex items-center gap-1 px-4 sm:px-6 lg:px-8 h-14">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 focus-visible:ring-offset-2 ${
                isActive
                  ? "bg-clay-50 text-clay-700"
                  : "text-earth-600 hover:bg-earth-100 hover:text-earth-900"
              }`}
            >
              <Icon size={16} strokeWidth={isActive ? 2.25 : 1.75} />
              {item.text}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
