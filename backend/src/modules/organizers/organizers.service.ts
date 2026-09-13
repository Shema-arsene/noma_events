import type { CreateOrganizerInput, UpdateOrganizerInput } from "../../validation";
import { OrganizerVerificationStatus, UserRole, NotificationType } from "../../types";
import { OrganizerModel } from "./organizer.model";
import { UserModel, type UserDocument } from "../users/user.model";
import { uniqueSlug } from "../../common/slug";
import { ConflictError, ForbiddenError, NotFoundError } from "../../common/errors";
import { notify } from "../notifications/notifications.service";

export async function createOrganizer(owner: UserDocument, input: CreateOrganizerInput) {
  const existing = await OrganizerModel.findOne({ ownerUserId: owner._id });
  if (existing) {
    throw new ConflictError("Vous avez déjà un profil organisateur");
  }

  const slug = await uniqueSlug(input.name, async (candidate) => {
    const found = await OrganizerModel.exists({ slug: candidate });
    return Boolean(found);
  });

  const organizer = await OrganizerModel.create({
    ownerUserId: owner._id,
    name: input.name,
    slug,
    description: input.description || undefined,
    logoUrl: input.logoUrl || undefined,
    coverUrl: input.coverUrl || undefined,
    contactEmail: input.contactEmail || undefined,
    contactPhone: input.contactPhone || undefined,
  });

  if (owner.role === UserRole.ATTENDEE) {
    owner.role = UserRole.ORGANIZER;
    await owner.save();
  }

  return organizer;
}

export async function getMyOrganizer(ownerUserId: string) {
  const organizer = await OrganizerModel.findOne({ ownerUserId });
  if (!organizer) throw new NotFoundError("Profil organisateur introuvable");
  return organizer;
}

export async function getOrganizerBySlug(slug: string) {
  const organizer = await OrganizerModel.findOne({ slug });
  if (!organizer) throw new NotFoundError("Organisateur introuvable");
  return organizer;
}

export async function getOrganizerById(id: string) {
  const organizer = await OrganizerModel.findById(id);
  if (!organizer) throw new NotFoundError("Organisateur introuvable");
  return organizer;
}

export async function updateOrganizer(
  organizerId: string,
  requester: UserDocument,
  input: UpdateOrganizerInput,
) {
  const organizer = await getOrganizerById(organizerId);
  assertOwnerOrAdmin(organizer.ownerUserId.toString(), requester);

  if (input.name !== undefined) organizer.name = input.name;
  if (input.description !== undefined) organizer.description = input.description || undefined;
  if (input.logoUrl !== undefined) organizer.logoUrl = input.logoUrl || undefined;
  if (input.coverUrl !== undefined) organizer.coverUrl = input.coverUrl || undefined;
  if (input.contactEmail !== undefined) organizer.contactEmail = input.contactEmail || undefined;
  if (input.contactPhone !== undefined) organizer.contactPhone = input.contactPhone || undefined;

  await organizer.save();
  return organizer;
}

export function assertOwnerOrAdmin(ownerUserId: string, requester: UserDocument): void {
  const isOwner = ownerUserId === requester._id.toString();
  const isAdmin = requester.role === UserRole.ADMIN || requester.role === UserRole.SUPER_ADMIN;
  if (!isOwner && !isAdmin) {
    throw new ForbiddenError("Vous ne gérez pas cet organisateur");
  }
}

export async function listOrganizersForAdmin(status?: OrganizerVerificationStatus) {
  const filter = status ? { verificationStatus: status } : {};
  return OrganizerModel.find(filter).sort({ createdAt: -1 });
}

export async function moderateOrganizer(
  organizerId: string,
  status: OrganizerVerificationStatus,
  reason?: string,
) {
  const organizer = await getOrganizerById(organizerId);
  organizer.verificationStatus = status;
  organizer.verificationReason = reason;
  await organizer.save();

  await notify({
    userId: organizer.ownerUserId,
    type: NotificationType.ORGANIZER_PUBLICATION_STATUS,
    title:
      status === OrganizerVerificationStatus.VERIFIED
        ? "Votre profil organisateur est vérifié"
        : status === OrganizerVerificationStatus.REJECTED
          ? "Votre profil organisateur a été rejeté"
          : "Votre profil organisateur est en attente",
    body:
      reason ??
      `Le statut de vérification de "${organizer.name}" est maintenant ${status}.`,
  });

  return organizer;
}

export async function findUserByEmail(email: string) {
  return UserModel.findOne({ email: email.toLowerCase() });
}
