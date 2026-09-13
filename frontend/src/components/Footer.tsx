import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-ink/10 bg-ink text-ivory">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-ink">N</span>
            Noma Events
          </div>
          <p className="mt-3 text-sm text-ivory/60">Découvrir. Réserver. Vivre le Gabon.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gold">Découvrir</h4>
          <ul className="mt-3 space-y-2 text-sm text-ivory/70">
            <li><Link href="/events" className="hover:text-white">Tous les événements</Link></li>
            <li><Link href="/events?free=true" className="hover:text-white">Événements gratuits</Link></li>
            <li><Link href="/cities/libreville" className="hover:text-white">Libreville</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gold">Organisateurs</h4>
          <ul className="mt-3 space-y-2 text-sm text-ivory/70">
            <li><Link href="/organizer" className="hover:text-white">Créer un événement</Link></li>
            <li><Link href="/register" className="hover:text-white">Devenir organisateur</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gold">Support</h4>
          <ul className="mt-3 space-y-2 text-sm text-ivory/70">
            <li><Link href="/help" className="hover:text-white">Aide &amp; FAQ</Link></li>
            <li><Link href="/help#refund" className="hover:text-white">Remboursements</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-ivory/50">
        © {new Date().getFullYear()} Noma Events — Gabon. Tous droits réservés.
      </div>
    </footer>
  );
}
