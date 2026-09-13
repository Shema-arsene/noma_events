import type { TicketTypeInput } from "../../validation";
import { TicketTypeModel } from "./ticketType.model";
import { EventModel } from "./event.model";
import { BadRequestError, ConflictError, NotFoundError } from "../../common/errors";

export async function listTicketTypesForEvent(eventId: string, activeOnly = false) {
  const filter = activeOnly ? { eventId, active: true } : { eventId };
  return TicketTypeModel.find(filter).sort({ priceXaf: 1 });
}

export async function createTicketTypes(eventId: string, inputs: TicketTypeInput[]) {
  const docs = await TicketTypeModel.insertMany(
    inputs.map((input) => ({ ...input, eventId, soldQuantity: 0, reservedQuantity: 0 })),
  );
  await recomputeEventPricing(eventId);
  return docs;
}

export async function addTicketType(eventId: string, input: TicketTypeInput) {
  const doc = await TicketTypeModel.create({ ...input, eventId, soldQuantity: 0, reservedQuantity: 0 });
  await recomputeEventPricing(eventId);
  return doc;
}

export async function updateTicketType(eventId: string, ticketTypeId: string, input: Partial<TicketTypeInput>) {
  const ticketType = await TicketTypeModel.findOne({ _id: ticketTypeId, eventId });
  if (!ticketType) throw new NotFoundError("Type de billet introuvable");

  if (input.quantity !== undefined && input.quantity < ticketType.soldQuantity + ticketType.reservedQuantity) {
    throw new BadRequestError(
      "La quantité ne peut pas être inférieure au nombre de billets déjà vendus ou réservés",
    );
  }

  Object.assign(ticketType, input);
  await ticketType.save();
  await recomputeEventPricing(eventId);
  return ticketType;
}

export async function deleteTicketType(eventId: string, ticketTypeId: string) {
  const ticketType = await TicketTypeModel.findOne({ _id: ticketTypeId, eventId });
  if (!ticketType) throw new NotFoundError("Type de billet introuvable");
  if (ticketType.soldQuantity > 0 || ticketType.reservedQuantity > 0) {
    throw new ConflictError("Impossible de supprimer un type de billet déjà vendu ou réservé");
  }
  await ticketType.deleteOne();
  await recomputeEventPricing(eventId);
}

export async function recomputeEventPricing(eventId: string): Promise<void> {
  const ticketTypes = await TicketTypeModel.find({ eventId, active: true });
  if (ticketTypes.length === 0) {
    await EventModel.findByIdAndUpdate(eventId, { minPriceXaf: null, isFree: false });
    return;
  }
  const minPriceXaf = Math.min(...ticketTypes.map((tt) => tt.priceXaf));
  const isFree = ticketTypes.every((tt) => tt.priceXaf === 0);
  await EventModel.findByIdAndUpdate(eventId, { minPriceXaf, isFree });
}
