"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Receipt,
  Search,
  ShieldCheck,
  Ticket,
  UserRound,
} from "lucide-react";
import { UserRole } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/Sheet";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export function Header() {
  const t = useTranslations("nav");
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState("");

  const NAV_LINKS = [
    { href: "/events", label: t("discover") },
    { href: "/events?free=true", label: t("free") },
  ];

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/events?q=${encodeURIComponent(q.trim())}` : "/events");
    setMenuOpen(false);
  }

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-ivory/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="focus-ring flex items-center gap-2 font-display text-xl font-bold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-gold">N</span>
          Noma<span className="text-gold-dark">Events</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "focus-ring text-sm font-medium text-ink/70 transition-colors hover:text-ink",
                pathname === link.href.split("?")[0] && "text-ink",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="hidden max-w-sm flex-1 md:flex">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="focus-ring w-full rounded-l-full border border-ink/15 bg-white px-4 py-2 text-sm"
          />
          <button
            aria-label={t("search")}
            className="focus-ring flex items-center rounded-r-full bg-ink px-3.5 text-sm font-medium text-white hover:bg-black"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>

        <div className="hidden items-center gap-3 md:flex">
          <LocaleSwitcher />
          {loading ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus-ring flex items-center gap-2 rounded-full border border-ink/15 bg-white py-1.5 pl-1.5 pr-3.5 text-sm font-medium hover:border-ink/25">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink/8 text-xs font-semibold text-ink/70">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  {user.name.split(" ")[0]}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60">
                <AccountLinks role={user.role} />
                <DropdownMenuSeparator />
                <DropdownMenuItem danger onSelect={handleLogout}>
                  <LogOut className="h-4 w-4" /> {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login" className="focus-ring text-sm font-medium text-ink/70 hover:text-ink">
                {t("login")}
              </Link>
              <Button size="sm" onClick={() => router.push("/register")}>
                {t("register")}
              </Button>
            </>
          )}
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button className="focus-ring rounded-lg p-2 md:hidden" aria-label={t("openMenu")}>
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent className="p-5">
            <SheetTitle className="font-display text-lg font-bold text-ink">{t("menu")}</SheetTitle>
            <form onSubmit={handleSearch} className="mt-5 flex">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("searchShort")}
                className="focus-ring w-full rounded-l-full border border-ink/15 bg-white px-4 py-2 text-sm"
              />
              <button className="focus-ring rounded-r-full bg-ink px-3.5 text-sm font-medium text-white">
                <Search className="h-4 w-4" />
              </button>
            </form>
            <nav className="mt-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <SheetClose asChild key={link.href}>
                  <Link href={link.href} className="focus-ring rounded-lg px-2.5 py-2.5 text-sm font-medium text-ink/80 hover:bg-sand">
                    {link.label}
                  </Link>
                </SheetClose>
              ))}
              <div className="my-2 h-px bg-ink/8" />
              <LocaleSwitcher variant="mobile" />
              {user ? (
                <>
                  <div className="my-2 h-px bg-ink/8" />
                  <MobileAccountLinks role={user.role} />
                  <button
                    onClick={handleLogout}
                    className="focus-ring flex items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-sm font-medium text-danger hover:bg-danger-soft"
                  >
                    <LogOut className="h-4 w-4" /> {t("logout")}
                  </button>
                </>
              ) : (
                <>
                  <div className="my-2 h-px bg-ink/8" />
                  <SheetClose asChild>
                    <Link href="/login" className="focus-ring rounded-lg px-2.5 py-2.5 text-sm font-medium text-ink/80 hover:bg-sand">
                      {t("login")}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/register" className="focus-ring rounded-lg px-2.5 py-2.5 text-sm font-medium text-ink/80 hover:bg-sand">
                      {t("register")}
                    </Link>
                  </SheetClose>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function useRoleLinks(role: UserRole) {
  const t = useTranslations("nav");
  const links = [
    { href: "/account/tickets", label: t("myTickets"), icon: Ticket },
    { href: "/account/orders", label: t("myOrders"), icon: Receipt },
    { href: "/account", label: t("myProfile"), icon: UserRound },
  ];
  if (role === UserRole.ORGANIZER || role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
    links.push({ href: "/organizer", label: t("organizerSpace"), icon: LayoutDashboard });
  }
  if (role === UserRole.EVENT_STAFF || role === UserRole.ORGANIZER || role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
    links.push({ href: "/scanner", label: t("scanner"), icon: QrCode });
  }
  if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
    links.push({ href: "/admin", label: t("administration"), icon: ShieldCheck });
  }
  return links;
}

function AccountLinks({ role }: { role: UserRole }) {
  const links = useRoleLinks(role);
  return (
    <>
      {links.map((link) => (
        <DropdownMenuItem key={link.href} asChild>
          <Link href={link.href}>
            <link.icon className="h-4 w-4 text-ink/50" /> {link.label}
          </Link>
        </DropdownMenuItem>
      ))}
    </>
  );
}

function MobileAccountLinks({ role }: { role: UserRole }) {
  const links = useRoleLinks(role);
  return (
    <>
      {links.map((link) => (
        <SheetClose asChild key={link.href}>
          <Link href={link.href} className="focus-ring flex items-center gap-2 rounded-lg px-2.5 py-2.5 text-sm font-medium text-ink/80 hover:bg-sand">
            <link.icon className="h-4 w-4 text-ink/50" /> {link.label}
          </Link>
        </SheetClose>
      ))}
    </>
  );
}
