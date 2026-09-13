import type { VenueInput } from "../../validation";
import { VenueModel } from "./venue.model";
import { NotFoundError } from "../../common/errors";

export async function createVenue(input: VenueInput) {
  return VenueModel.create(input);
}

export async function updateVenue(venueId: string, input: VenueInput) {
  const venue = await VenueModel.findByIdAndUpdate(venueId, input, { returnDocument: "after" });
  if (!venue) throw new NotFoundError("Lieu introuvable");
  return venue;
}

export async function getVenue(venueId: string) {
  const venue = await VenueModel.findById(venueId);
  if (!venue) throw new NotFoundError("Lieu introuvable");
  return venue;
}
