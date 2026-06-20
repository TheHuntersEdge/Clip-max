/* ClipMax brandmark — angular cyan spear. Ported from the prototype. */
export function Logo({ size = 22, mono }: { size?: number; mono?: string }) {
  const a = mono ?? "#06DBFD";
  const b = mono ?? "#0586a0";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M42 40 L33 33 L20 52 L18 64 L26 56 L31 47 L40 50 Z" fill={a} />
      <path d="M18 64 L40 54 L34 64 L26 70 Z" fill={a} opacity=".85" />
      <path d="M58 40 L67 33 L80 52 L82 64 L74 56 L69 47 L60 50 Z" fill={b} />
      <path d="M82 64 L60 54 L66 64 L74 70 Z" fill={b} opacity=".85" />
      <path d="M50 8 L44 34 L50 70 Z" fill={a} />
      <path d="M50 8 L56 34 L50 70 Z" fill={b} />
      <path d="M50 60 L46 84 L50 93 L54 84 Z" fill={a} />
    </svg>
  );
}
