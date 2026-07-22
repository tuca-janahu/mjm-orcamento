import type { ReactNode } from "react";
import { ui } from "../../../lib/ui";

export function FieldError({ message }: { message: string | undefined }) {
  return message ? (
    <small className={ui.fieldError} role="alert">
      {message}
    </small>
  ) : null;
}

export function SectionHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className={ui.formSectionHeading}>
      <span className="text-[0.625rem] font-bold text-zinc-400">{number}</span>
      <div>
        <h2 className="m-0 mb-2 text-sm font-semibold">{title}</h2>
        <p className="m-0 text-xs leading-relaxed text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  );
}

export function CheckboxGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 border-t border-l border-zinc-200 sm:grid-cols-2">
      {children}
    </div>
  );
}
