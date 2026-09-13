import type { OrganizerDTO } from "../../types";
import type { HydratedDocument } from "mongoose";
import type { IOrganizer } from "./organizer.model";

export function toOrganizerDTO(organizer: HydratedDocument<IOrganizer>): OrganizerDTO {
  return {
    id: organizer._id.toString(),
    ownerUserId: organizer.ownerUserId.toString(),
    name: organizer.name,
    slug: organizer.slug,
    description: organizer.description ?? undefined,
    logoUrl: organizer.logoUrl ?? undefined,
    coverUrl: organizer.coverUrl ?? undefined,
    contactEmail: organizer.contactEmail ?? undefined,
    contactPhone: organizer.contactPhone ?? undefined,
    verificationStatus: organizer.verificationStatus as OrganizerDTO["verificationStatus"],
    createdAt: (organizer as unknown as { createdAt: Date }).createdAt.toISOString(),
  };
}
