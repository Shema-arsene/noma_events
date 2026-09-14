import { OrganizerNav } from "@/components/organizer/OrganizerNav";

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <OrganizerNav />
      <div className="container-page py-8">{children}</div>
    </div>
  );
}
