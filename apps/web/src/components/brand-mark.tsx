interface BrandMarkProps {
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="brand-mark" aria-label="MJM Group">
      <span className="brand-symbol">MJM</span>
      {!compact && <span className="brand-caption">Digital solutions</span>}
    </div>
  );
}
