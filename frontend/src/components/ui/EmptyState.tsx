import type { ReactNode } from "react";

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <p className="text-sm text-muted">{message}</p>
      {action}
    </div>
  );
}
