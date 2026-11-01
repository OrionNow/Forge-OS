import { createFileRoute } from "@tanstack/react-router";
import { handleForge } from "@/lib/forge/room.server";

const handle = ({ request }: { request: Request }) => handleForge(request);

export const Route = createFileRoute("/api/forge")({
  server: { handlers: { POST: handle } },
});
