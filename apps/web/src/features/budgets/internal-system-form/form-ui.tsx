import type { ReactNode } from "react";

export function CheckboxGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 border-t border-l border-zinc-200 sm:grid-cols-2">
      {children}
    </div>
  );
}
