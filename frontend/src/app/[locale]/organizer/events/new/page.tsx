"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { createEventValidationSchema, type CreateEventInput } from "@/validation";
import { GABON_CITIES, UserRole, type CategoryDTO, type EventDTO } from "@/types";
import { RequireAuth } from "@/components/RequireAuth";
import { ImageUploadField } from "@/components/organizer/ImageUploadField";
import { useMyOrganizer } from "@/lib/useMyOrganizer";
import { apiGet, apiPost, ApiRequestError } from "@/lib/api";
import { formatXaf } from "@/lib/format";
import { useRouter } from "@/i18n/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/States";
import { Stepper } from "@/components/ui/Stepper";

const emptyTicketType = {
  name: "",
  description: "",
  priceXaf: 0,
  quantity: 100,
  salesStartAt: new Date().toISOString().slice(0, 16),
  salesEndAt: "",
  active: true,
};

function NewEventForm() {
  const t = useTranslations("eventWizard");
  const locale = useLocale();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const WIZARD_STEPS = [
    { label: t("stepDetails"), fields: ["title", "summary", "description", "categoryId"] },
    { label: t("stepLocation"), fields: ["city", "venue.name", "venue.address", "startAt", "endAt", "salesStartAt", "salesEndAt"] },
    { label: t("stepTickets"), fields: ["ticketTypes"] },
    { label: t("stepReview"), fields: [] },
  ] as const;

  const tValidation = useTranslations("validation");
  const createEventSchema = useMemo(() => createEventValidationSchema(tValidation), [tValidation]);

  const { data: categories } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => (await apiGet<CategoryDTO[]>("/categories")).data,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
    // react-hook-form's generics don't cleanly infer through the nested
    // ticketTypes field array + zod date coercion; typed loosely here and
    // validated at submit time by zodResolver(createEventSchema).
  } = useForm<any>({
    resolver: zodResolver(createEventSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      categoryId: "",
      coverImage: "",
      gallery: [],
      city: "Libreville",
      venue: { name: "", address: "", city: "Libreville", country: "Gabon" },
      startAt: "",
      endAt: "",
      salesStartAt: new Date().toISOString().slice(0, 16),
      salesEndAt: "",
      visibility: "PUBLIC",
      ticketTypes: [emptyTicketType],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "ticketTypes" });
  const values = watch();

  async function handleNext() {
    const stepFields = WIZARD_STEPS[step].fields;
    const valid = stepFields.length === 0 || (await trigger(stepFields as never));
    if (valid) setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(values: CreateEventInput) {
    setServerError(null);
    try {
      const { data } = await apiPost<EventDTO>("/organizers/events", values);
      router.push(`/organizer/events/${data.id}`);
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : t("genericError"));
    }
  }

  const categoryName = categories?.find((c) => c.id === values.categoryId)?.name;
  const isLastStep = step === WIZARD_STEPS.length - 1;

  function formatReviewDate(value?: string) {
    if (!value) return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>

      <div className="mt-6">
        <Stepper steps={WIZARD_STEPS} activeIndex={step} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
        {step === 0 && (
          <Card>
            <CardBody className="space-y-4">
              <h2 className="font-semibold text-ink">{t("generalInfo")}</h2>
              <div>
                <Label htmlFor="title" required>{t("eventTitle")}</Label>
                <Input id="title" {...register("title")} />
                <FieldError message={errors.title?.message as string} />
              </div>
              <div>
                <Label htmlFor="summary" required>{t("shortSummary")}</Label>
                <Input id="summary" {...register("summary")} placeholder={t("shortSummaryPlaceholder")} />
                <FieldError message={errors.summary?.message as string} />
              </div>
              <div>
                <Label htmlFor="description" required>{t("fullDescription")}</Label>
                <Textarea id="description" rows={6} {...register("description")} />
                <FieldError message={errors.description?.message as string} />
              </div>
              <div>
                <Label htmlFor="categoryId" required>{t("category")}</Label>
                <Select id="categoryId" {...register("categoryId")}>
                  <option value="">{t("selectPlaceholder")}</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <FieldError message={errors.categoryId?.message as string} />
              </div>
              <Controller
                control={control}
                name="coverImage"
                render={({ field }) => (
                  <ImageUploadField label={t("coverImage")} value={values.coverImage} onChange={field.onChange} />
                )}
              />
            </CardBody>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardBody className="space-y-4">
              <h2 className="font-semibold text-ink">{t("locationAndDate")}</h2>
              <div>
                <Label htmlFor="city" required>{t("city")}</Label>
                <Select
                  id="city"
                  {...register("city")}
                  onChange={(e) => {
                    setValue("city", e.target.value);
                    setValue("venue.city", e.target.value);
                  }}
                >
                  {GABON_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="venue.name" required>{t("venueName")}</Label>
                <Input id="venue.name" {...register("venue.name")} />
                <FieldError message={(errors.venue as never as Record<string, { message?: string }>)?.name?.message} />
              </div>
              <div>
                <Label htmlFor="venue.address" required>{t("address")}</Label>
                <Input id="venue.address" {...register("venue.address")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="startAt" required>{t("start")}</Label>
                  <Input id="startAt" type="datetime-local" {...register("startAt")} />
                  <FieldError message={errors.startAt?.message as string} />
                </div>
                <div>
                  <Label htmlFor="endAt" required>{t("end")}</Label>
                  <Input id="endAt" type="datetime-local" {...register("endAt")} />
                  <FieldError message={errors.endAt?.message as string} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="salesStartAt" required>{t("salesStart")}</Label>
                  <Input id="salesStartAt" type="datetime-local" {...register("salesStartAt")} />
                </div>
                <div>
                  <Label htmlFor="salesEndAt" required>{t("salesEnd")}</Label>
                  <Input id="salesEndAt" type="datetime-local" {...register("salesEndAt")} />
                  <FieldError message={errors.salesEndAt?.message as string} />
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-ink">{t("ticketTypes")}</h2>
                <Button type="button" variant="outline" size="sm" onClick={() => append(emptyTicketType)}>
                  <Plus className="h-3.5 w-3.5" /> {t("add")}
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-3 rounded-xl border border-ink/10 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">{t("ticketNumber", { number: index + 1 })}</p>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                        <Trash2 className="h-3.5 w-3.5" /> {t("delete")}
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label required>{t("name")}</Label>
                      <Input {...register(`ticketTypes.${index}.name`)} placeholder={t("namePlaceholder")} />
                    </div>
                    <div>
                      <Label required>{t("price")}</Label>
                      <Input type="number" min={0} {...register(`ticketTypes.${index}.priceXaf`, { valueAsNumber: true })} />
                    </div>
                    <div>
                      <Label required>{t("quantity")}</Label>
                      <Input type="number" min={1} {...register(`ticketTypes.${index}.quantity`, { valueAsNumber: true })} />
                    </div>
                    <div>
                      <Label required>{t("salesEnd")}</Label>
                      <Input type="datetime-local" {...register(`ticketTypes.${index}.salesEndAt`)} />
                    </div>
                  </div>
                </div>
              ))}
              <FieldError message={(errors.ticketTypes as { message?: string } | undefined)?.message} />
            </CardBody>
          </Card>
        )}

        {isLastStep && (
          <Card>
            <CardBody className="space-y-4">
              <h2 className="font-semibold text-ink">{t("review")}</h2>
              <p className="text-sm text-ink/60">{t.rich("reviewDescription", { strong: (chunks) => <strong>{chunks}</strong> })}</p>
              <dl className="grid gap-3 rounded-xl border border-ink/10 bg-ivory/60 p-4 text-sm sm:grid-cols-2">
                <ReviewRow label={t("eventTitle")} value={values.title} />
                <ReviewRow label={t("category")} value={categoryName} />
                <ReviewRow label={t("city")} value={values.city} />
                <ReviewRow label={t("venueName")} value={values.venue?.name} />
                <ReviewRow label={t("start")} value={formatReviewDate(values.startAt)} />
                <ReviewRow label={t("end")} value={formatReviewDate(values.endAt)} />
              </dl>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-ink/40">{t("ticketTypes")}</p>
                <div className="space-y-2">
                  {values.ticketTypes?.map((tt: { name?: string; priceXaf?: number; quantity?: number }, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-ink/10 px-3 py-2 text-sm">
                      <span className="text-ink">{tt.name || t("ticketNumber", { number: i + 1 })}</span>
                      <span className="text-ink/60">
                        {formatXaf(Number(tt.priceXaf) || 0)} · {t("available", { count: tt.quantity ?? 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {serverError && <p className="text-sm text-danger">{serverError}</p>}
            </CardBody>
          </Card>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={handleBack} disabled={step === 0}>
            {t("back")}
          </Button>
          {isLastStep ? (
            <Button type="submit" size="lg" loading={isSubmitting}>
              {t("submitDraft")}
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={handleNext}>
              {t("continue")}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-ink/40">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value || "—"}</dd>
    </div>
  );
}

function Guard() {
  const { data: organizer, isLoading } = useMyOrganizer();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !organizer) router.replace("/organizer");
  }, [isLoading, organizer, router]);

  if (isLoading || !organizer) return <LoadingState />;
  return <NewEventForm />;
}

export default function NewEventPage() {
  return (
    <RequireAuth roles={[UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <Guard />
    </RequireAuth>
  );
}
