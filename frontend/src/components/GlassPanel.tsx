interface Props {
  children: React.ReactNode;
  className?: string;
}

export function GlassPanel({ children, className = "" }: Props) {
  return (
    <div className={`glass-border rounded-xl ${className}`}>
      <div className="glass-inner rounded-xl h-full w-full">
        {children}
      </div>
    </div>
  );
}
