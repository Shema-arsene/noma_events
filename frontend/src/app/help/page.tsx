import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aide & FAQ",
  description: "Questions fréquentes sur l'achat de billets, les remboursements et l'utilisation de Noma Events.",
};

const FAQS = [
  {
    q: "Comment acheter un billet ?",
    a: "Trouvez un événement, choisissez votre type de billet et la quantité, puis suivez les étapes de paiement. Votre billet numérique avec QR code sera disponible immédiatement dans votre compte après confirmation du paiement.",
  },
  {
    q: "Comment recevoir mon billet ?",
    a: "Vos billets sont disponibles dans « Mes billets » depuis votre compte, avec un QR code unique à présenter à l'entrée.",
  },
  {
    id: "refund",
    q: "Puis-je être remboursé ?",
    a: "Les billets ne sont pas remboursables sauf en cas d'annulation de l'événement par l'organisateur. Dans ce cas, vous serez automatiquement notifié.",
  },
  {
    q: "Que se passe-t-il si un événement est annulé ?",
    a: "Vos billets pour un événement annulé sont automatiquement invalidés et vous recevez une notification.",
  },
  {
    q: "Comment devenir organisateur sur Noma Events ?",
    a: "Créez un compte, puis rendez-vous dans l'espace organisateur pour créer votre profil et publier votre premier événement.",
  },
  {
    q: "Quels moyens de paiement sont acceptés ?",
    a: "Nous travaillons à intégrer les principaux moyens de paiement mobile et bancaire au Gabon. En phase de test, un mode de paiement démo est utilisé.",
  },
];

export default function HelpPage() {
  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="font-display text-3xl font-bold text-ink">Aide &amp; FAQ</h1>
      <div className="mt-8 space-y-6">
        {FAQS.map((item) => (
          <div key={item.q} id={item.id} className="border-b border-ink/10 pb-6">
            <h2 className="font-semibold text-ink">{item.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
