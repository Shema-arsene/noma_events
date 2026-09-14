// Zod schemas shared shape-for-shape with backend/src/validation.ts, but
// duplicated rather than imported from a workspace package so the frontend
// deploys as a fully independent project. Keep the two copies in sync by
// hand when request shapes change.
import { z } from "zod";

// A handful of schemas below carry user-facing validation messages. Since this
// module is imported outside of React (e.g. for type inference via z.infer)
// as well as inside client components, the messages are produced by factory
// functions that accept a translator (pass `useTranslations("validation")`
// from the component using the schema with zodResolver). DEFAULT_MESSAGES
// backs the module-level schema instances used purely for `z.infer` typing.
const DEFAULT_MESSAGES: Record<string, string> = {
  nameMinLength: "Le nom doit contenir au moins 2 caractères",
  invalidEmail: "Adresse e-mail invalide",
  invalidPhone: "Numéro de téléphone invalide",
  passwordMinLength: "Le mot de passe doit contenir au moins 8 caractères",
  passwordRequired: "Mot de passe requis",
  salesEndAfterStart: "La date de fin des ventes doit être après la date de début",
  categoryRequired: "Catégorie requise",
  endAfterStart: "La date de fin doit être après la date de début",
  atLeastOneTicketType: "Au moins un type de billet est requis",
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** Translator function shape accepted by the schema factories below — pass `useTranslations("validation")`. */
type Translate = (key: string) => string;

const registerSchema = createRegisterSchema((key) => DEFAULT_MESSAGES[key]);
export type RegisterInput = z.infer<typeof registerSchema>;

export function createRegisterSchema(t: Translate) {
  return z.object({
    name: z.string().trim().min(2, t("nameMinLength")).max(120),
    email: z.string().trim().toLowerCase().email(t("invalidEmail")),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s-]{6,20}$/u, t("invalidPhone"))
      .optional()
      .or(z.literal("")),
    password: z.string().min(8, t("passwordMinLength")).max(128),
  });
}

const loginSchema = createLoginSchema((key) => DEFAULT_MESSAGES[key]);
export type LoginInput = z.infer<typeof loginSchema>;

export function createLoginSchema(t: Translate) {
  return z.object({
    email: z.string().trim().toLowerCase().email(t("invalidEmail")),
    password: z.string().min(1, t("passwordRequired")),
  });
}

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Jeton de rafraîchissement requis"),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// ---------------------------------------------------------------------------
// Organizer
// ---------------------------------------------------------------------------

export const createOrganizerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  coverUrl: z.string().url().optional().or(z.literal("")),
  contactEmail: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
});
export type CreateOrganizerInput = z.infer<typeof createOrganizerSchema>;

export const updateOrganizerSchema = createOrganizerSchema.partial();
export type UpdateOrganizerInput = z.infer<typeof updateOrganizerSchema>;

// ---------------------------------------------------------------------------
// Venue
// ---------------------------------------------------------------------------

export const venueSchema = z.object({
  name: z.string().trim().min(2).max(160),
  address: z.string().trim().min(2).max(300),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80).default("Gabon"),
  coordinates: z
    .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
    .optional(),
  capacity: z.number().int().positive().optional(),
});
export type VenueInput = z.infer<typeof venueSchema>;

// ---------------------------------------------------------------------------
// Ticket types
// ---------------------------------------------------------------------------

const ticketTypeObjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  priceXaf: z.number().int().min(0),
  quantity: z.number().int().positive(),
  salesStartAt: z.coerce.date(),
  salesEndAt: z.coerce.date(),
  active: z.boolean().default(true),
});

const ticketTypeSchema = createTicketTypeSchema((key) => DEFAULT_MESSAGES[key]);
export type TicketTypeInput = z.infer<typeof ticketTypeSchema>;

export function createTicketTypeSchema(t: Translate) {
  return ticketTypeObjectSchema.refine((data) => data.salesEndAt > data.salesStartAt, {
    message: t("salesEndAfterStart"),
    path: ["salesEndAt"],
  });
}

const updateTicketTypeSchema = createUpdateTicketTypeSchema((key) => DEFAULT_MESSAGES[key]);
export type UpdateTicketTypeInput = z.infer<typeof updateTicketTypeSchema>;

export function createUpdateTicketTypeSchema(t: Translate) {
  return ticketTypeObjectSchema.partial().refine(
    (data) => !data.salesStartAt || !data.salesEndAt || data.salesEndAt > data.salesStartAt,
    { message: t("salesEndAfterStart"), path: ["salesEndAt"] },
  );
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

const createEventSchema = createEventValidationSchema((key) => DEFAULT_MESSAGES[key]);
export type CreateEventInput = z.infer<typeof createEventSchema>;

export function createEventValidationSchema(t: Translate) {
  return z
    .object({
      title: z.string().trim().min(3).max(160),
      summary: z.string().trim().min(3).max(300),
      description: z.string().trim().min(3).max(10000),
      categoryId: z.string().trim().min(1, t("categoryRequired")),
      venue: venueSchema,
      coverImage: z.string().url().optional().or(z.literal("")),
      gallery: z.array(z.string().url()).max(12).default([]),
      city: z.string().trim().min(2).max(80),
      startAt: z.coerce.date(),
      endAt: z.coerce.date(),
      salesStartAt: z.coerce.date(),
      salesEndAt: z.coerce.date(),
      visibility: z.enum(["PUBLIC", "UNLISTED"]).default("PUBLIC"),
      ticketTypes: z.array(createTicketTypeSchema(t)).min(1, t("atLeastOneTicketType")),
    })
    .refine((data) => data.endAt > data.startAt, {
      message: t("endAfterStart"),
      path: ["endAt"],
    })
    .refine((data) => data.salesEndAt > data.salesStartAt, {
      message: t("salesEndAfterStart"),
      path: ["salesEndAt"],
    });
}

export const updateEventSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  summary: z.string().trim().min(3).max(300).optional(),
  description: z.string().trim().min(3).max(10000).optional(),
  categoryId: z.string().trim().min(1).optional(),
  venue: venueSchema.optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  gallery: z.array(z.string().url()).max(12).optional(),
  city: z.string().trim().min(2).max(80).optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  salesStartAt: z.coerce.date().optional(),
  salesEndAt: z.coerce.date().optional(),
  visibility: z.enum(["PUBLIC", "UNLISTED"]).optional(),
});
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const eventQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  city: z.string().trim().max(80).optional(),
  category: z.string().trim().max(80).optional(),
  organizer: z.string().trim().max(120).optional(),
  free: z.enum(["true", "false"]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["date", "newest", "popularity"]).default("date"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});
export type EventQueryInput = z.infer<typeof eventQuerySchema>;

// ---------------------------------------------------------------------------
// Orders / checkout
// ---------------------------------------------------------------------------

export const createOrderSchema = z.object({
  eventId: z.string().trim().min(1),
  items: z
    .array(
      z.object({
        ticketTypeId: z.string().trim().min(1),
        quantity: z.number().int().positive().max(20),
      }),
    )
    .min(1, "Sélectionnez au moins un billet"),
  attendee: z.object({
    name: z.string().trim().min(2).max(160),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
  }),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export const initializePaymentSchema = z.object({
  orderId: z.string().trim().min(1),
});
export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>;

// ---------------------------------------------------------------------------
// Check-in / scanning
// ---------------------------------------------------------------------------

export const scanTicketSchema = z.object({
  eventId: z.string().trim().min(1),
  qrToken: z.string().trim().min(1),
  deviceReference: z.string().trim().max(120).optional(),
});
export type ScanTicketInput = z.infer<typeof scanTicketSchema>;

export const assignStaffSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  permissions: z.array(z.enum(["SCAN"])).default(["SCAN"]),
});
export type AssignStaffInput = z.infer<typeof assignStaffSchema>;

// ---------------------------------------------------------------------------
// Categories (admin)
// ---------------------------------------------------------------------------

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  active: z.boolean().default(true),
});
export type CategoryInput = z.infer<typeof categorySchema>;

// ---------------------------------------------------------------------------
// Admin moderation
// ---------------------------------------------------------------------------

export const moderateOrganizerSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED", "PENDING"]),
  reason: z.string().trim().max(500).optional(),
});
export type ModerateOrganizerInput = z.infer<typeof moderateOrganizerSchema>;

export const suspendUserSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
  reason: z.string().trim().max(500).optional(),
});
export type SuspendUserInput = z.infer<typeof suspendUserSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type PaginationInput = z.infer<typeof paginationSchema>;
