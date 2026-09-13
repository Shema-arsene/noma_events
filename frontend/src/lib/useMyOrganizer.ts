import { useQuery } from "@tanstack/react-query";
import type { OrganizerDTO } from "@/types";
import { apiGet, ApiRequestError } from "./api";

export function useMyOrganizer() {
  return useQuery({
    queryKey: ["my-organizer"],
    queryFn: async () => {
      try {
        const { data } = await apiGet<OrganizerDTO>("/organizers/me");
        return data;
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 404) return null;
        throw err;
      }
    },
  });
}
