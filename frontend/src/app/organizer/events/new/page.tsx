"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { createEventSchema, type CreateEventInput } from "@/validation";
import { GABON_CITIES, UserRole, type CategoryDTO, type EventDTO } from "@/types";
import { RequireAuth } from "@/components/RequireAuth";
import { OrganizerNav } from "@/components/organizer/OrganizerNav";
import { ImageUploadField } from "@/components/organizer/ImageUploadField";
import { useMyOrganizer } from "@/lib/useMyOrganizer";
import { apiGet, apiPost, ApiRequestError } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/States";

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
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => (await apiGet<CategoryDTO[]>("/categories")).data,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    // react-hook-form's generics don't cleanly infer through the nested
    // ticketTypes field array + zod date coercion; typed loosely here and
    // validated at submit time by zodResolver(createEventSchema).
  } = useForm<any>({
    resolver: zodResolver(createEventSchema),
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
  const coverImage = watch("coverImage");

  async function onSubmit(values: CreateEventInput) {
    setServerError(null);
    try {
      const { data } = await apiPost<EventDTO>("/organizers/events", values);
      router.push(`/organizer/events/${data.id}`);
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : "Une erreur est survenue");
    }
  }

  return (
    <div>
      <OrganizerNav />
      <div className="container-page max-w-3xl py-8">
        <h1 className="font-display text-2xl font-bold text-ink">Créer un événement</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <h2 className="font-semibold text-ink">Informations générales</h2>
              <div>
                <Label htmlFor="title" required>Titre</Label>
                <Input id="title" {...register("title")} />
                <FieldError message={errors.title?.message as string} />
              </div>
              <div>
                <Label htmlFor="summary" required>Résumé court</Label>
                <Input id="summary" {...register("summary")} placeholder="Une phrase accrocheuse" />
                <FieldError message={errors.summary?.message as string} />
              </div>
              <div>
                <Label htmlFor="description" required>Description complète</Label>
                <Textarea id="description" rows={6} {...register("description")} />
                <FieldError message={errors.description?.message as string} />
              </div>
              <div>
                <Label htmlFor="categoryId" required>Catégorie</Label>
                <Select id="categoryId" {...register("categoryId")}>
                  <option value="">Sélectionner...</option>
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
                  <ImageUploadField label="Image de couverture" value={coverImage} onChange={field.onChange} />
                )}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <h2 className="font-semibold text-ink">Lieu et date</h2>
              <div>
                <Label htmlFor="city" required>Ville</Label>
                <Select id="city" {...register("city")}>
                  {GABON_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="venue.name" required>Nom du lieu</Label>
                <Input id="venue.name" {...register("venue.name")} />
                <FieldError message={(errors.venue as never as Record<string, { message?: string }>)?.name?.message} />
              </div>
              <div>
                <Label htmlFor="venue.address" required>Adresse</Label>
                <Input id="venue.address" {...register("venue.address")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="startAt" required>Début</Label>
                  <Input id="startAt" type="datetime-local" {...register("startAt")} />
                  <FieldError message={errors.startAt?.message as string} />
                </div>
                <div>
                  <Label htmlFor="endAt" required>Fin</Label>
                  <Input id="endAt" type="datetime-local" {...register("endAt")} />
                  <FieldError message={errors.endAt?.message as string} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="salesStartAt" required>Début des ventes</Label>
                  <Input id="salesStartAt" type="datetime-local" {...register("salesStartAt")} />
                </div>
                <div>
                  <Label htmlFor="salesEndAt" required>Fin des ventes</Label>
                  <Input id="salesEndAt" type="datetime-local" {...register("salesEndAt")} />
                  <FieldError message={errors.salesEndAt?.message as string} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-ink">Types de billets</h2>
                <Button type="button" variant="outline" size="sm" onClick={() => append(emptyTicketType)}>
                  + Ajouter
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-3 rounded-xl border border-ink/10 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">Billet #{index + 1}</p>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)} className="focus-ring text-xs text-red-600 hover:underline">
                        Supprimer
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label required>Nom</Label>
                      <Input {...register(`ticketTypes.${index}.name`)} placeholder="Standard" />
                    </div>
                    <div>
                      <Label required>Prix (XAF)</Label>
                      <Input type="number" min={0} {...register(`ticketTypes.${index}.priceXaf`, { valueAsNumber: true })} />
                    </div>
                    <div>
                      <Label required>Quantité disponible</Label>
                      <Input type="number" min={1} {...register(`ticketTypes.${index}.quantity`, { valueAsNumber: true })} />
                    </div>
                    <div>
                      <Label required>Fin des ventes</Label>
                      <Input type="datetime-local" {...register(`ticketTypes.${index}.salesEndAt`)} />
                    </div>
                  </div>
                </div>
              ))}
              <FieldError message={(errors.ticketTypes as { message?: string } | undefined)?.message} />
            </CardBody>
          </Card>

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <div className="flex justify-end gap-3">
            <Button type="submit" size="lg" loading={isSubmitting}>
              Créer l&apos;événement (brouillon)
            </Button>
          </div>
        </form>
      </div>
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
