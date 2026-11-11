import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Terminal,
});

function Terminal() {
  return (
    <iframe
      title="FORGE-OS"
      src="terminal.html?v=5.5.5"
      className="block h-dvh w-full border-0 bg-bg"
    />
  );
}
