interface SolenumLogoProps {
  size?: number;
  className?: string;
}

export default function SolenumLogo({ size = 32, className }: SolenumLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      width={size}
      height={size}
      className={className}
      aria-label="Solenum"
    >
      <circle cx="50" cy="50" r="44" stroke="#9945FF" strokeWidth="8" />
      <circle cx="50" cy="50" r="16" stroke="#9945FF" strokeWidth="8" />
    </svg>
  );
}
