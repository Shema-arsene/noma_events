"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { UserRole } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";

const NAV_LINKS = [
  { href: "/events", label: "Découvrir" },
  { href: "/events?free=true", label: "Gratuit" },
];

export function Header() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [q, setQ] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/events?q=${encodeURIComponent(q.trim())}` : "/events");
    setMenuOpen(false);
  }

  async function handleLogout() {
    await logout();
    setAccountOpen(false);
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
            <Link key={link.href} href={link.href} className="focus-ring text-sm font-medium text-ink/70 hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="hidden max-w-sm flex-1 md:flex">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un événement, un organisateur..."
            className="focus-ring w-full rounded-l-full border border-ink/15 bg-white px-4 py-2 text-sm"
          />
          <button className="focus-ring rounded-r-full bg-ink px-4 py-2 text-sm font-medium text-white">Chercher</button>
        </form>

        <div className="hidden items-center gap-3 md:flex">
          {loading ? null : user ? (
            <div className="relative">
              <button
                onClick={() => setAccountOpen((v) => !v)}
                className="focus-ring flex items-center gap-2 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-sm font-medium"
              >
                {user.name.split(" ")[0]}
              </button>
              {accountOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-ink/10 bg-white p-1.5 shadow-card"
                  onMouseLeave={() => setAccountOpen(false)}
                >
                  <AccountLinks role={user.role} onNavigate={() => setAccountOpen(false)} />
                  <button
                    onClick={handleLogout}
                    className="focus-ring w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="focus-ring text-sm font-medium text-ink/70 hover:text-ink">
                Connexion
              </Link>
              <Button size="sm" onClick={() => router.push("/register")}>
                S&apos;inscrire
              </Button>
            </>
          )}
        </div>

        <button
          className="focus-ring rounded-lg p-2 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Ouvrir le menu"
        >
          <div className="space-y-1.5">
            <span className="block h-0.5 w-6 bg-ink" />
            <span className="block h-0.5 w-6 bg-ink" />
            <span className="block h-0.5 w-6 bg-ink" />
          </div>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-ink/10 bg-ivory px-4 pb-4 md:hidden">
          <form onSubmit={handleSearch} className="mt-3 flex">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher..."
              className="focus-ring w-full rounded-l-full border border-ink/15 bg-white px-4 py-2 text-sm"
            />
            <button className="focus-ring rounded-r-full bg-ink px-4 py-2 text-sm font-medium text-white">OK</button>
          </form>
          <nav className="mt-3 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="focus-ring rounded-lg px-2 py-2 text-sm font-medium text-ink/80 hover:bg-sand"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <AccountLinks role={user.role} onNavigate={() => setMenuOpen(false)} />
                <button
                  onClick={handleLogout}
                  className="focus-ring rounded-lg px-2 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Se déconnecter
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="focus-ring rounded-lg px-2 py-2 text-sm font-medium text-ink/80 hover:bg-sand">
                  Connexion
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="focus-ring rounded-lg px-2 py-2 text-sm font-medium text-ink/80 hover:bg-sand">
                  S&apos;inscrire
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function AccountLinks({ role, onNavigate }: { role: UserRole; onNavigate: () => void }) {
  const links = [
    { href: "/account/tickets", label: "Mes billets" },
    { href: "/account/orders", label: "Mes commandes" },
    { href: "/account", label: "Mon profil" },
  ];
  if (role === UserRole.ORGANIZER || role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
    links.push({ href: "/organizer", label: "Espace organisateur" });
  }
  if (role === UserRole.EVENT_STAFF || role === UserRole.ORGANIZER || role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
    links.push({ href: "/scanner", label: "Scanner" });
  }
  if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
    links.push({ href: "/admin", label: "Administration" });
  }

  return (
    <>
      {links.map((link) => (
        <Link key={link.href} href={link.href} onClick={onNavigate} className="focus-ring block rounded-lg px-3 py-2 text-sm text-ink/80 hover:bg-sand">
          {link.label}
        </Link>
      ))}
    </>
  );
}
