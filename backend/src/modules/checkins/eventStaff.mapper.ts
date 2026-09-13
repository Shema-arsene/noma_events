import type { Types } from "mongoose";
import type { IEventStaff } from "./eventStaff.model";

type PopulatedStaff = Omit<IEventStaff, "userId"> & {
  _id: Types.ObjectId;
  userId: { _id: Types.ObjectId; name: string; email: string };
};

export interface EventStaffDTO {
  id: string;
  eventId: string;
  userId: string;
  name: string;
  email: string;
  permissions: string[];
  active: boolean;
}

export function toEventStaffDTO(staff: PopulatedStaff): EventStaffDTO {
  return {
    id: staff._id.toString(),
    eventId: staff.eventId.toString(),
    userId: staff.userId._id.toString(),
    name: staff.userId.name,
    email: staff.userId.email,
    permissions: staff.permissions,
    active: staff.active,
  };
}
