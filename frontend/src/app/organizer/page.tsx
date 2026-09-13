"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrganizerSchema, type CreateOrganizerInput } from "@/validation";
import { RequireAuth } from "@/components/RequireAuth";
import { OrganizerNav } from "@/components/organizer/OrganizerNav";
import { useMyOrganizer } from "@/lib/useMyOrganizer";
import { apiPost, ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

function CreateOrganizerForm() {
  const queryClient = useQueryClient();
  const { refresh } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrganizerInput>({ resolver: zodResolver(createOrganizerSchema) });

  async function onSubmit(values: CreateOrganizerInput) {
    setServerError(null);
    try {
      await apiPost("/organizers", values);
      await refresh();
      await queryClient.invalidateQueries({ queryKey: ["my-organizer"] });
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : "Une erreur est survenue");
    }
  }

  return (
    <div className="container-page max-w-xl py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Créez votre profil organisateur</h1>
      <p className="mt-1 text-sm text-ink/60">
        Donnez-vous une identité professionnelle sur Noma Events avant de publier votre premier événement.
      </p>
      <Card className="mt-6">
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name" required>Nom de l&apos;organisateur</Label>
              <Input id="name" error={errors.name?.message} {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} />
            </div>
            <div>
              <Label htmlFor="contactEmail">E-mail de contact</Label>
              <Input id="contactEmail" type="email" error={errors.contactEmail?.message} {...register("contactEmail")} />
              <FieldError message={errors.contactEmail?.message} />
            </div>
            <div>
              <Label htmlFor="contactPhone">Téléphone de contact</Label>
              <Input id="contactPhone" {...register("contactPhone")} />
            </div>
            {serverError && <p className="text-sm text-red-600">{serverError}</p>}
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Créer mon profil organisateur
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

function OrganizerOverview() {
  const { data: organizer, isLoading, isError, refetch } = useMyOrganizer();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Erreur de chargement" onRetry={() => refetch()} />;
  if (!organizer) return <CreateOrganizerForm />;

  return (
    <div>
      <OrganizerNav />
      <div className="container-page py-8">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-ink">{organizer.name}</h1>
          <Badge tone={organizer.verificationStatus === "VERIFIED" ? "teal" : "warning"}>
            {organizer.verificationStatus === "VERIFIED"
              ? "Vérifié"
              : organizer.verificationStatus === "REJECTED"
                ? "Rejeté"
                : "En attente de vérification"}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-ink/60">{organizer.description}</p>
        <div className="mt-6 flex gap-3">
          <Link href="/organizer/events" className="focus-ring rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">
            Gérer mes événements
          </Link>
          <Link href={`/organizers/${organizer.slug}`} className="focus-ring rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium hover:bg-white">
            Voir mon profil public
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrganizerPage() {
  return (
    <RequireAuth>
      <OrganizerOverview />
    </RequireAuth>
  );
}
