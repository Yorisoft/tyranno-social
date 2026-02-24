interface TyrannoCoinProps {
  className?: string;
}

export function TyrannoCoin({ className = "h-8 w-8" }: TyrannoCoinProps) {
  return (
    <img
      src="/logo.svg"
      alt="Tyrannosocial Logo"
      className={className}
    />
  );
}
