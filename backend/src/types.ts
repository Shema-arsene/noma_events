// ---------------------------------------------------------------------------
// Enums and DTO types describing the API's request/response shapes.
// This file has no runtime dependencies — types only.
//
// This is intentionally duplicated in frontend/src/types.ts rather than
// shared via a workspace package, so the backend and frontend can be
// deployed as fully independent projects (Render / Vercel). Keep the two
// copies in sync by hand when the API's shapes change.
// ---------------------------------------------------------------------------

export enum UserRole {
  ATTENDEE = "ATTENDEE",
  ORGANIZER = "ORGANIZER",
  EVENT_STAFF = "EVENT_STAFF",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

export enum OrganizerVerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export enum EventStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}

export enum EventVisibility {
  PUBLIC = "PUBLIC",
  UNLISTED = "UNLISTED",
}

export enum OrderStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
  EXPIRED = "EXPIRED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum TicketStatus {
  ACTIVE = "ACTIVE",
  USED = "USED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum CheckInResult {
  VALID = "VALID",
  ALREADY_USED = "ALREADY_USED",
  INVALID = "INVALID",
  WRONG_EVENT = "WRONG_EVENT",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum NotificationType {
  PURCHASE_CONFIRMATION = "PURCHASE_CONFIRMATION",
  TICKET_READY = "TICKET_READY",
  EVENT_REMINDER = "EVENT_REMINDER",
  EVENT_UPDATE = "EVENT_UPDATE",
  EVENT_CANCELLED = "EVENT_CANCELLED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  ORGANIZER_PUBLICATION_STATUS = "ORGANIZER_PUBLICATION_STATUS",
}

export const CURRENCY = "XAF" as const;

export const GABON_CITIES = [
  "Libreville",
  "Port-Gentil",
  "Franceville",
  "Oyem",
  "Moanda",
] as const;

export type GabonCity = (typeof GABON_CITIES)[number];

export const DEFAULT_CATEGORIES = [
  { name: "Musique", slug: "musique" },
  { name: "Culture & Patrimoine", slug: "culture-patrimoine" },
  { name: "Comédie & Divertissement", slug: "comedie-divertissement" },
  { name: "Business & Tech", slug: "business-tech" },
  { name: "Sport & Bien-être", slug: "sport-bien-etre" },
  { name: "Gastronomie", slug: "gastronomie" },
  { name: "Mode & Beauté", slug: "mode-beaute" },
  { name: "Éducation & Formation", slug: "education-formation" },
  { name: "Famille & Communauté", slug: "famille-communaute" },
  { name: "Tourisme & Expériences", slug: "tourisme-experiences" },
] as const;

// ---------------------------------------------------------------------------
// API envelope shapes
// ---------------------------------------------------------------------------

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  requestId?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  locale: string;
  createdAt: string;
}

export interface OrganizerDTO {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  verificationStatus: OrganizerVerificationStatus;
  createdAt: string;
}

export interface VenueDTO {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  coordinates?: { lat: number; lng: number };
  capacity?: number;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
}

export interface TicketTypeDTO {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  priceXaf: number;
  quantity: number;
  soldQuantity: number;
  remaining: number;
  salesStartAt: string;
  salesEndAt: string;
  active: boolean;
}

export interface EventDTO {
  id: string;
  organizer: Pick<OrganizerDTO, "id" | "name" | "slug" | "logoUrl" | "verificationStatus">;
  venue?: VenueDTO;
  category?: Pick<CategoryDTO, "id" | "name" | "slug">;
  title: string;
  slug: string;
  summary: string;
  description: string;
  coverImage?: string;
  gallery: string[];
  city: string;
  startAt: string;
  endAt: string;
  salesStartAt: string;
  salesEndAt: string;
  status: EventStatus;
  visibility: EventVisibility;
  isFree: boolean;
  minPriceXaf: number | null;
  ticketTypes?: TicketTypeDTO[];
  publishedAt?: string;
}

export interface OrderItemDTO {
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  unitPriceXaf: number;
  totalXaf: number;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  userId: string;
  event: Pick<EventDTO, "id" | "title" | "slug" | "coverImage" | "startAt" | "city">;
  items: OrderItemDTO[];
  subtotalXaf: number;
  feesXaf: number;
  totalXaf: number;
  currency: string;
  status: OrderStatus;
  expiresAt?: string;
  createdAt: string;
}

export interface TicketDTO {
  id: string;
  displayCode: string;
  orderId: string;
  eventId: string;
  ticketTypeId: string;
  ticketTypeName: string;
  ownerUserId: string;
  attendeeName: string;
  status: TicketStatus;
  /** Data-URL PNG of the ticket's QR code, present only when fetched by its owner/organizer. */
  qrImage?: string;
  issuedAt: string;
  usedAt?: string;
  event: Pick<EventDTO, "id" | "title" | "slug" | "coverImage" | "startAt" | "endAt" | "city">;
}

export interface OrganizerAnalyticsDTO {
  ticketsSold: number;
  grossSalesXaf: number;
  paidOrders: number;
  attendance: number;
  checkInRate: number;
  salesByTicketType: Array<{ ticketTypeId: string; name: string; sold: number; grossXaf: number }>;
}

export interface AdminOverviewDTO {
  totalUsers: number;
  totalOrganizers: number;
  pendingOrganizers: number;
  totalEvents: number;
  publishedEvents: number;
  totalOrders: number;
  paidOrders: number;
  grossSalesXaf: number;
}
