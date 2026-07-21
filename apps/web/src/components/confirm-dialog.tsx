import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

const focusableSelector = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  tone = "primary",
  loading = false,
  error = null,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const loadingRef = useRef(loading);
  onCloseRef.current = onClose;
  loadingRef.current = loading;

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !loadingRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ??
          [],
      );
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);
      if (
        event.shiftKey &&
        (document.activeElement === firstElement ||
          !dialogRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        lastElement?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === lastElement ||
          !dialogRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        firstElement?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (
        previouslyFocused instanceof HTMLElement &&
        previouslyFocused.isConnected
      ) {
        previouslyFocused.focus();
        return;
      }

      const mainContent = document.querySelector<HTMLElement>(
        "main, [role='main']",
      );
      if (mainContent === null) return;

      const hadTabIndex = mainContent.hasAttribute("tabindex");
      if (!hadTabIndex) mainContent.setAttribute("tabindex", "-1");
      mainContent.focus();
      if (!hadTabIndex) mainContent.removeAttribute("tabindex");
    };
  }, [open]);

  if (!open) return null;

  const confirmButtonClass =
    tone === "danger"
      ? "border-red-700 bg-red-700 text-white hover:border-red-800 hover:bg-red-800"
      : "border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-800";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-zinc-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md border border-zinc-300 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={`${descriptionId}${error === null ? "" : ` ${errorId}`}`}
      >
        <div className="border-b border-zinc-200 px-5 py-5 sm:px-6">
          <p className="m-0 text-[0.625rem] font-bold tracking-[0.18em] text-zinc-500 uppercase">
            Confirmação
          </p>
          <h2
            className="mt-2.5 mb-0 text-xl font-bold tracking-[-0.025em] text-zinc-950"
            id={titleId}
          >
            {title}
          </h2>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:px-6">
          <p
            className="m-0 text-sm leading-relaxed text-zinc-600"
            id={descriptionId}
          >
            {description}
          </p>
          {error !== null && (
            <div
              className="border-l-[3px] border-red-600 bg-red-50 px-3.5 py-3 text-[0.8125rem] leading-relaxed text-red-800"
              id={errorId}
              role="alert"
            >
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 bg-zinc-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            ref={cancelButtonRef}
            className="inline-flex min-h-10 cursor-pointer items-center justify-center border border-zinc-400 bg-white px-4 text-[0.625rem] font-bold tracking-[0.1em] text-zinc-800 uppercase transition-colors hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-50"
            disabled={loading}
            type="button"
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            className={`inline-flex min-h-10 cursor-pointer items-center justify-center border px-4 text-[0.625rem] font-bold tracking-[0.1em] uppercase transition-colors disabled:cursor-wait disabled:opacity-50 ${confirmButtonClass}`}
            disabled={loading}
            type="button"
            aria-busy={loading}
            onClick={onConfirm}
          >
            {loading ? "Processando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
