"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { EventDTO, OrderDTO } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { apiGet, apiPost, ApiRequestError } from "@/lib/api";
import { formatXaf, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";

type Step = "review" | "paying" | "success";

function CheckoutInner() {
  const { eventId } = useParams<{ eventId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<EventDTO | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("review");
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const [attendee, setAttendee] = useState({ name: "", email: "", phone: "" });
  // Prefill the attendee form once the authenticated user becomes available,
  // without clobbering anything the user has already typed on re-renders.
  // Adjusting state during render (rather than in an effect) avoids an extra
  // render pass — see https://react.dev/learn/you-might-not-need-an-effect
  const [prefilledForUserId, setPrefilledForUserId] = useState<string | null>(null);
  if (user && user.id !== prefilledForUserId) {
    setPrefilledForUserId(user.id);
    setAttendee({ name: user.name, email: user.email, phone: user.phone ?? "" });
  }

  const requestedItems = useMemo(() => {
    const items: Array<{ ticketTypeId: string; quantity: number }> = [];
    searchParams.forEach((value, key) => {
      if (key.startsWith("qty_")) {
        const qty = Number(value);
        if (qty > 0) items.push({ ticketTypeId: key.replace("qty_", ""), quantity: qty });
      }
    });
    return items;
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    apiGet<EventDTO>(`/events/${eventId}`)
      .then(({ data }) => setEvent(data))
      .catch((err) => setLoadError(err instanceof ApiRequestError ? err.message : "Erreur de chargement"));
  }, [eventId]);

  const selection = useMemo(() => {
    if (!event?.ticketTypes) return [];
    return requestedItems
      .map((item) => {
        const tt = event.ticketTypes?.find((t) => t.id === item.ticketTypeId);
        if (!tt) return null;
        return { ticketType: tt, quantity: item.quantity };
      })
      .filter((x): x is { ticketType: NonNullable<typeof event.ticketTypes>[number]; quantity: number } => x !== null);
  }, [event, requestedItems]);

  const totalXaf = selection.reduce((sum, s) => sum + s.ticketType.priceXaf * s.quantity, 0);

  async function handleCreateOrder() {
    if (!event) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { data } = await apiPost<OrderDTO>("/orders", {
        eventId: event.id,
        items: requestedItems,
        attendee,
      });
      setOrder(data);
      setStep("paying");
      await startPayment(data.id);
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  }

  async function startPayment(orderId: string) {
    try {
      const { data } = await apiPost<{ reference: string }>("/payments/mock/initialize", { orderId });
      setPaymentReference(data.reference);
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : "Impossible d'initialiser le paiement");
    }
  }

  async function handleOutcome(outcome: "SUCCESS" | "FAILED") {
    if (!paymentReference) return;
    setPaying(true);
    setSubmitError(null);
    try {
      await apiPost("/payments/mock/simulate", { reference: paymentReference, outcome });
      if (outcome === "SUCCESS") {
        setStep("success");
      } else {
        setSubmitError("Le paiement a échoué. Vous pouvez réessayer.");
        setPaymentReference(null);
      }
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : "Une erreur est survenue");
    } finally {
      setPaying(false);
    }
  }

  if (authLoading || !user) return <LoadingState />;
  if (loadError) return <ErrorState message={loadError} />;
  if (!event) return <LoadingState />;

  if (requestedItems.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-ink/60">Aucun billet sélectionné.</p>
        <Button className="mt-4" onClick={() => router.push(`/events/${event.slug}`)}>
          Retour à l&apos;événement
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Finaliser votre commande</h1>
      <p className="mt-1 text-sm text-ink/60">
        {event.title} — {formatDateTime(event.startAt)}
      </p>

      <Card className="mt-6">
        <CardBody>
          <h2 className="font-semibold text-ink">Récapitulatif</h2>
          <div className="mt-3 space-y-2 text-sm">
            {selection.map((s) => (
              <div key={s.ticketType.id} className="flex justify-between">
                <span className="text-ink/70">
                  {s.quantity} × {s.ticketType.name}
                </span>
                <span className="font-medium text-ink">{formatXaf(s.ticketType.priceXaf * s.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 font-semibold">
            <span>Total</span>
            <span className="text-gold-dark">{formatXaf(totalXaf)}</span>
          </div>
        </CardBody>
      </Card>

      {step === "review" && (
        <Card className="mt-4">
          <CardBody>
            <h2 className="font-semibold text-ink">Informations du titulaire</h2>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="name" required>Nom complet</Label>
                <Input id="name" value={attendee.name} onChange={(e) => setAttendee((a) => ({ ...a, name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="email" required>E-mail</Label>
                <Input id="email" type="email" value={attendee.email} onChange={(e) => setAttendee((a) => ({ ...a, email: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" type="tel" value={attendee.phone} onChange={(e) => setAttendee((a) => ({ ...a, phone: e.target.value }))} />
              </div>
            </div>
            {submitError && <FieldError message={submitError} />}
            <Button className="mt-5 w-full" size="lg" loading={submitting} onClick={handleCreateOrder}>
              Continuer vers le paiement
            </Button>
          </CardBody>
        </Card>
      )}

      {step === "paying" && order && (
        <Card className="mt-4">
          <CardBody>
            <h2 className="font-semibold text-ink">Paiement (mode démo)</h2>
            <p className="mt-2 text-sm text-ink/60">
              Aucun fournisseur de paiement réel n&apos;est connecté pour le moment. Utilisez les boutons ci-dessous pour
              simuler le résultat du paiement, exactement comme le ferait un vrai webhook Airtel Money / Moov Money.
            </p>
            {paymentReference ? (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" loading={paying} onClick={() => handleOutcome("SUCCESS")}>
                  Simuler paiement réussi
                </Button>
                <Button variant="outline" className="flex-1" loading={paying} onClick={() => handleOutcome("FAILED")}>
                  Simuler échec
                </Button>
              </div>
            ) : (
              <LoadingState label="Initialisation du paiement..." />
            )}
            {submitError && <p className="mt-3 text-sm text-red-600">{submitError}</p>}
          </CardBody>
        </Card>
      )}

      {step === "success" && (
        <Card className="mt-4 border-teal/30 bg-teal/5">
          <CardBody className="text-center">
            <p className="font-display text-xl font-bold text-ink">Votre billet est confirmé</p>
            <p className="mt-2 text-sm text-ink/60">Vos billets sont disponibles dans votre compte.</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button onClick={() => router.push("/account/tickets")}>Voir mes billets</Button>
              <Button variant="outline" onClick={() => router.push("/events")}>
                Continuer à explorer
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CheckoutInner />
    </Suspense>
  );
}
