import mongoose, { type QueryFilter } from "mongoose";
import type { CreateEventInput, UpdateEventInput, EventQueryInput } from "../../validation";
import { EventStatus, EventVisibility, UserRole } from "../../types";
import { EventModel, type IEvent } from "./event.model";
import type { PopulatedEvent } from "./event.mapper";
import { TicketTypeModel } from "./ticketType.model";
import * as ticketTypesService from "./ticketTypes.service";
import * as venuesService from "../venues/venues.service";
import { CategoryModel } from "../categories/category.model";
import { OrganizerModel } from "../organizers/organizer.model";
import { FavoriteModel } from "../favorites/favorite.model";
import type { UserDocument } from "../users/user.model";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../common/errors";
import { uniqueSlug } from "../../common/slug";

const POPULATE = [
  { path: "organizerId", select: "name slug logoUrl verificationStatus ownerUserId" },
  { path: "venueId" },
  { path: "categoryId", select: "name slug" },
];

export async function assertOrganizerOwnership(organizerId: string, requester: UserDocument) {
  const organizer = await OrganizerModel.findById(organizerId);
  if (!organizer) throw new NotFoundError("Organisateur introuvable");
  const isOwner = organizer.ownerUserId.toString() === requester._id.toString();
  const isAdmin = requester.role === UserRole.ADMIN || requester.role === UserRole.SUPER_ADMIN;
  if (!isOwner && !isAdmin) throw new ForbiddenError("Vous ne gérez pas cet événement");
  return organizer;
}

export async function createEvent(requester: UserDocument, input: CreateEventInput) {
  const organizer = await OrganizerModel.findOne({ ownerUserId: requester._id });
  if (!organizer) throw new ForbiddenError("Créez d'abord un profil organisateur");

  const category = await CategoryModel.findById(input.categoryId);
  if (!category) throw new BadRequestError("Catégorie invalide");

  const venue = await venuesService.createVenue(input.venue);

  const slug = await uniqueSlug(input.title, async (candidate) => {
    const found = await EventModel.exists({ slug: candidate });
    return Boolean(found);
  });

  const event = await EventModel.create({
    organizerId: organizer._id,
    venueId: venue._id,
    categoryId: category._id,
    title: input.title,
    slug,
    summary: input.summary,
    description: input.description,
    coverImage: input.coverImage || undefined,
    gallery: input.gallery,
    city: input.city,
    startAt: input.startAt,
    endAt: input.endAt,
    salesStartAt: input.salesStartAt,
    salesEndAt: input.salesEndAt,
    visibility: input.visibility as EventVisibility,
    status: EventStatus.DRAFT,
  });

  await ticketTypesService.createTicketTypes(event._id.toString(), input.ticketTypes);

  return getEventByIdForOwner(event._id.toString(), requester);
}

export async function updateEvent(eventId: string, requester: UserDocument, input: UpdateEventInput) {
  const event = await EventModel.findById(eventId);
  if (!event) throw new NotFoundError("Événement introuvable");
  await assertOrganizerOwnership(event.organizerId.toString(), requester);

  if (event.status === EventStatus.COMPLETED || event.status === EventStatus.ARCHIVED) {
    throw new BadRequestError("Cet événement ne peut plus être modifié");
  }

  if (input.title !== undefined) event.title = input.title;
  if (input.summary !== undefined) event.summary = input.summary;
  if (input.description !== undefined) event.description = input.description;
  if (input.coverImage !== undefined) event.coverImage = input.coverImage || undefined;
  if (input.gallery !== undefined) event.gallery = input.gallery;
  if (input.city !== undefined) event.city = input.city;
  if (input.startAt !== undefined) event.startAt = input.startAt;
  if (input.endAt !== undefined) event.endAt = input.endAt;
  if (input.salesStartAt !== undefined) event.salesStartAt = input.salesStartAt;
  if (input.salesEndAt !== undefined) event.salesEndAt = input.salesEndAt;
  if (input.visibility !== undefined) event.visibility = input.visibility as EventVisibility;

  if (input.categoryId !== undefined) {
    const category = await CategoryModel.findById(input.categoryId);
    if (!category) throw new BadRequestError("Catégorie invalide");
    event.categoryId = category._id;
  }

  if (event.endAt <= event.startAt) {
    throw new BadRequestError("La date de fin doit être après la date de début");
  }
  if (event.salesEndAt <= event.salesStartAt) {
    throw new BadRequestError("La fin des ventes doit être après le début des ventes");
  }

  if (input.venue !== undefined) {
    await venuesService.updateVenue(event.venueId.toString(), input.venue);
  }

  await event.save();
  return getEventByIdForOwner(eventId, requester);
}

export async function publishEvent(eventId: string, requester: UserDocument) {
  const event = await EventModel.findById(eventId);
  if (!event) throw new NotFoundError("Événement introuvable");
  await assertOrganizerOwnership(event.organizerId.toString(), requester);

  if (event.status !== EventStatus.DRAFT) {
    throw new BadRequestError("Seuls les événements en brouillon peuvent être publiés");
  }

  const requiredFields: Array<[unknown, string]> = [
    [event.title, "titre"],
    [event.description, "description"],
    [event.categoryId, "catégorie"],
    [event.coverImage, "image de couverture"],
    [event.venueId, "lieu"],
    [event.startAt, "date de début"],
    [event.endAt, "date de fin"],
  ];
  const missing = requiredFields.filter(([value]) => !value).map(([, label]) => label);
  if (missing.length > 0) {
    throw new BadRequestError(`Champs requis manquants pour la publication: ${missing.join(", ")}`);
  }

  const ticketTypeCount = await TicketTypeModel.countDocuments({ eventId: event._id });
  if (ticketTypeCount === 0) {
    throw new BadRequestError("Ajoutez au moins un type de billet avant de publier");
  }

  event.status = EventStatus.PUBLISHED;
  event.publishedAt = new Date();
  await event.save();

  return getEventByIdForOwner(eventId, requester);
}

export async function cancelEvent(eventId: string, requester: UserDocument) {
  const event = await EventModel.findById(eventId);
  if (!event) throw new NotFoundError("Événement introuvable");
  await assertOrganizerOwnership(event.organizerId.toString(), requester);

  if (event.status === EventStatus.CANCELLED || event.status === EventStatus.COMPLETED) {
    throw new BadRequestError("Cet événement ne peut pas être annulé");
  }

  event.status = EventStatus.CANCELLED;
  event.cancelledAt = new Date();
  await event.save();

  // Notify ticket holders and release pending reservations. Lazy-imported to
  // keep this module free of a circular dependency (both modules reference events).
  const { cancelTicketsForEvent } = await import("../tickets/tickets.service.js");
  const { cancelPendingOrdersForEvent } = await import("../orders/orders.service.js");
  await Promise.all([cancelTicketsForEvent(event._id.toString()), cancelPendingOrdersForEvent(event._id.toString())]);

  return getEventByIdForOwner(eventId, requester);
}

export async function getEventByIdForOwner(eventId: string, requester: UserDocument) {
  const event = await EventModel.findById(eventId).populate(POPULATE);
  if (!event) throw new NotFoundError("Événement introuvable");
  const populated = event as unknown as PopulatedEvent;
  await assertOrganizerOwnership(populated.organizerId._id.toString(), requester);
  return populated;
}

export async function getPublicEventBySlug(slugOrId: string, viewer?: UserDocument) {
  const orClauses: QueryFilter<IEvent>[] = [{ slug: slugOrId }];
  if (mongoose.isValidObjectId(slugOrId)) orClauses.push({ _id: slugOrId });

  const event = await EventModel.findOne({ $or: orClauses, status: { $ne: EventStatus.ARCHIVED } }).populate(
    POPULATE,
  );
  if (!event) throw new NotFoundError("Événement introuvable");
  const populated = event as unknown as PopulatedEvent;

  const isOwnerOrAdmin =
    viewer &&
    (populated.organizerId.ownerUserId?.toString() === viewer._id.toString() ||
      viewer.role === UserRole.ADMIN ||
      viewer.role === UserRole.SUPER_ADMIN);

  if (populated.status !== EventStatus.PUBLISHED && !isOwnerOrAdmin) {
    throw new NotFoundError("Événement introuvable");
  }

  EventModel.findByIdAndUpdate(event._id, { $inc: { viewCount: 1 } }).exec().catch(() => undefined);

  return populated;
}

export async function listOrganizerEvents(organizerId: string, requester: UserDocument) {
  await assertOrganizerOwnership(organizerId, requester);
  return EventModel.find({ organizerId }).populate(POPULATE).sort({ createdAt: -1 });
}

interface SearchResult {
  events: Awaited<ReturnType<typeof EventModel.find>>;
  total: number;
}

export async function searchPublicEvents(query: EventQueryInput): Promise<SearchResult> {
  const filter: QueryFilter<IEvent> = {
    status: EventStatus.PUBLISHED,
    visibility: EventVisibility.PUBLIC,
  };

  if (query.q) {
    filter.$text = { $search: query.q };
  }
  if (query.city) {
    filter.city = query.city;
  }
  if (query.category) {
    const category = await CategoryModel.findOne({ slug: query.category });
    filter.categoryId = category ? category._id : null;
  }
  if (query.organizer) {
    const organizer = await OrganizerModel.findOne({ slug: query.organizer });
    filter.organizerId = organizer ? organizer._id : null;
  }
  if (query.free === "true") {
    filter.isFree = true;
  } else if (query.free === "false") {
    filter.isFree = false;
  }
  if (query.dateFrom || query.dateTo) {
    filter.startAt = {};
    if (query.dateFrom) filter.startAt.$gte = query.dateFrom;
    if (query.dateTo) filter.startAt.$lte = query.dateTo;
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.minPriceXaf = {};
    if (query.minPrice !== undefined) filter.minPriceXaf.$gte = query.minPrice;
    if (query.maxPrice !== undefined) filter.minPriceXaf.$lte = query.maxPrice;
  }

  const sort: Record<string, 1 | -1> =
    query.sort === "newest" ? { publishedAt: -1 } : query.sort === "popularity" ? { viewCount: -1 } : { startAt: 1 };

  const skip = (query.page - 1) * query.limit;

  const [events, total] = await Promise.all([
    EventModel.find(filter).populate(POPULATE).sort(sort).skip(skip).limit(query.limit),
    EventModel.countDocuments(filter),
  ]);

  return { events, total };
}

export async function toggleFavorite(userId: string, eventId: string): Promise<{ favorited: boolean }> {
  const event = await EventModel.findById(eventId);
  if (!event) throw new NotFoundError("Événement introuvable");

  const existing = await FavoriteModel.findOne({ userId, eventId });
  if (existing) {
    await existing.deleteOne();
    return { favorited: false };
  }
  await FavoriteModel.create({ userId, eventId });
  return { favorited: true };
}

export async function listMyFavorites(userId: string) {
  const favorites = await FavoriteModel.find({ userId }).sort({ createdAt: -1 });
  const eventIds = favorites.map((f) => f.eventId);
  return EventModel.find({ _id: { $in: eventIds } }).populate(POPULATE);
}

/** Marks published events whose end date has passed as COMPLETED. Called by the periodic sweep. */
export async function sweepCompletedEvents(): Promise<number> {
  const result = await EventModel.updateMany(
    { status: EventStatus.PUBLISHED, endAt: { $lt: new Date() } },
    { status: EventStatus.COMPLETED },
  );
  return result.modifiedCount ?? 0;
}
