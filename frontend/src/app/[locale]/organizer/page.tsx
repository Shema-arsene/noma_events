"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrganizerSchema, type CreateOrganizerInput } from "@/validation";
import { RequireAuth } from "@/components/RequireAuth";
import { useMyOrganizer } from "@/lib/useMyOrganizer";
import { apiPost, ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";
import { Link } from "@/i18n/navigation";

function CreateOrganizerForm() {
  const t = useTranslations("organizerOverview");
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
      setServerError(err instanceof ApiRequestError ? err.message : t("genericError"));
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-bold text-ink">{t("createProfileTitle")}</h1>
      <p className="mt-1 text-sm text-ink/60">{t("createProfileSubtitle")}</p>
      <Card className="mt-6">
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name" required>{t("organizerName")}</Label>
              <Input id="name" error={errors.name?.message} {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea id="description" {...register("description")} />
            </div>
            <div>
              <Label htmlFor="contactEmail">{t("contactEmail")}</Label>
              <Input id="contactEmail" type="email" error={errors.contactEmail?.message} {...register("contactEmail")} />
              <FieldError message={errors.contactEmail?.message} />
            </div>
            <div>
              <Label htmlFor="contactPhone">{t("contactPhone")}</Label>
              <Input id="contactPhone" {...register("contactPhone")} />
            </div>
            {serverError && <p className="text-sm text-danger">{serverError}</p>}
            <Button type="submit" className="w-full" loading={isSubmitting}>
              {t("createProfileSubmit")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

function OrganizerOverview() {
  const t = useTranslations("organizerOverview");
  const { data: organizer, isLoading, isError, refetch } = useMyOrganizer();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={t("loadError")} onRetry={() => refetch()} />;
  if (!organizer) return <CreateOrganizerForm />;

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">{organizer.name}</h1>
        <Badge tone={organizer.verificationStatus === "VERIFIED" ? "teal" : "warning"}>
          {organizer.verificationStatus === "VERIFIED"
            ? t("verified")
            : organizer.verificationStatus === "REJECTED"
              ? t("rejected")
              : t("pendingVerification")}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-ink/60">{organizer.description}</p>
      <div className="mt-6 flex gap-3">
        <Link href="/organizer/events" className="focus-ring rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">
          {t("manageMyEvents")}
        </Link>
        <Link href={`/organizers/${organizer.slug}`} className="focus-ring rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium hover:bg-white">
          {t("viewPublicProfile")}
        </Link>
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
