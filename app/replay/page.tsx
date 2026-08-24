import { ReplayPanel } from "@/components/replay/ReplayPanel";
import { notFound } from "next/navigation";

export default function ReplayPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ReplayPanel />;
}
