interface BrandMarkProps {
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="inline-flex items-center gap-3" aria-label="MJM Group">
      <span className="text-lg leading-none font-black tracking-[-0.075em]">MJM</span>
      {!compact && <span className="border-l border-current pl-3 text-[0.5625rem] font-semibold tracking-[0.22em] uppercase opacity-55">Digital solutions</span>}
    </div>
  );
}
