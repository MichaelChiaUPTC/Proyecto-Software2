/** Isotipo del logo (src/logo.svg): corchetes de código + nodo de decisión. Hereda colores del tema. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size * (210 / 238)} viewBox="50 150 238 210" aria-hidden className="logo-mark">
      <g transform="translate(40, 136)" fill="none" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round">
        <path className="logo-mark__brackets" d="M 72 32 L 28 32 L 28 208 L 72 208" />
        <path className="logo-mark__brackets" d="M 184 32 L 228 32 L 228 208 L 184 208" />
        <path className="logo-mark__accent" d="M 84 164 L 128 80 L 172 164" />
        <circle cx="128" cy="80" r="8" className="logo-mark__accent-fill" stroke="none" />
        <circle cx="84" cy="164" r="7" className="logo-mark__node" stroke="none" />
        <circle cx="172" cy="164" r="7" className="logo-mark__node" stroke="none" />
      </g>
    </svg>
  )
}

export function Brand({ compact }: { compact?: boolean }) {
  return (
    <span className="brand">
      <LogoMark />
      {!compact && (
        <span className="brand__text">
          <span className="brand__name">lógica</span>
          <span className="brand__org">UPTC</span>
        </span>
      )}
    </span>
  )
}
