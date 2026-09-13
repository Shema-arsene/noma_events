import type { EventDTO, TicketTypeDTO } from "../../types";
import type { IEvent } from "./event.model";
import type { IOrganizer } from "../organizers/organizer.model";
import type { IVenue } from "../venues/venue.model";
import type { ICategory } from "../categories/category.model";
import { toVenueDTO } from "../venues/venue.mapper";

export type PopulatedEvent = Omit<IEvent, "organizerId" | "venueId" | "categoryId"> & {
  _id: IEvent["_id"];
  organizerId: IOrganizer & { _id: IOrganizer["_id"] };
  venueId: (IVenue & { _id: IVenue["_id"] }) | null;
  categoryId: (ICategory & { _id: ICategory["_id"] }) | null;
};

export function toEventDTO(event: PopulatedEvent, ticketTypes?: TicketTypeDTO[]): EventDTO {
  return {
    id: event._id.toString(),
    organizer: {
      id: event.organizerId._id.toString(),
      name: event.organizerId.name,
      slug: event.organizerId.slug,
      logoUrl: event.organizerId.logoUrl ?? undefined,
      verificationStatus: event.organizerId.verificationStatus as EventDTO["organizer"]["verificationStatus"],
    },
    venue: event.venueId ? toVenueDTO(event.venueId as never) : undefined,
    category: event.categoryId
      ? { id: event.categoryId._id.toString(), name: event.categoryId.name, slug: event.categoryId.slug }
      : undefined,
    title: event.title,
    slug: event.slug,
    summary: event.summary,
    description: event.description,
    coverImage: event.coverImage ?? undefined,
    gallery: event.gallery ?? [],
    city: event.city,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    salesStartAt: event.salesStartAt.toISOString(),
    salesEndAt: event.salesEndAt.toISOString(),
    status: event.status as EventDTO["status"],
    visibility: event.visibility as EventDTO["visibility"],
    isFree: event.isFree,
    minPriceXaf: event.minPriceXaf ?? null,
    ticketTypes,
    publishedAt: event.publishedAt ? event.publishedAt.toISOString() : undefined,
  };
}
