import type { UserDTO } from "../../types";
import type { UserDocument } from "./user.model";

export function toUserDTO(user: UserDocument): UserDTO {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    role: user.role as UserDTO["role"],
    status: user.status as UserDTO["status"],
    avatarUrl: user.avatarUrl ?? undefined,
    locale: user.locale,
    createdAt: (user as unknown as { createdAt: Date }).createdAt.toISOString(),
  };
}
