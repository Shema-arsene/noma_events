import type { VenueDTO } from "../../types";
import type { HydratedDocument } from "mongoose";
import type { IVenue } from "./venue.model";

export function toVenueDTO(venue: HydratedDocument<IVenue>): VenueDTO {
  return {
    id: venue._id.toString(),
    name: venue.name,
    address: venue.address,
    city: venue.city,
    country: venue.country,
    coordinates:
      venue.coordinates?.lat != null && venue.coordinates?.lng != null
        ? { lat: venue.coordinates.lat, lng: venue.coordinates.lng }
        : undefined,
    capacity: venue.capacity ?? undefined,
  };
}
