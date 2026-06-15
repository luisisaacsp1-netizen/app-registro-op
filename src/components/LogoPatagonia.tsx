// Logo 100% CSS/JSX — sin archivos externos, siempre carga

interface Props {
  variant?: 'full' | 'icon'
}

export default function LogoPatagonia({ variant = 'full' }: Props) {
  // Solo el chevron rojo para el sidebar
  if (variant === 'icon') {
    return (
      <svg viewBox="0 0 44 60" width={22} height={30} style={{ display: 'block', flexShrink: 0 }}>
        <path d="M0 0 L28 30 L0 60 L10 60 L38 30 L10 0 Z" fill="#e63329" />
      </svg>
    )
  }

  // Logo completo para login
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {/* Chevron */}
      <svg viewBox="0 0 44 60" width={38} height={52} style={{ display: 'block', flexShrink: 0 }}>
        <path d="M0 0 L28 30 L0 60 L10 60 L38 30 L10 0 Z" fill="#e63329" />
      </svg>

      {/* Texto */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 10, fontWeight: 600,
          color: 'rgba(255,255,255,0.65)',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}>
          CONTENEDORES
        </span>
        <span style={{
          fontFamily: '"Arial Black", "Arial Bold", Arial, Helvetica, sans-serif',
          fontSize: 32, fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '1px',
          lineHeight: 1,
          textTransform: 'uppercase',
        }}>
          PATAGONIA
        </span>
        <span style={{
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 8, fontWeight: 400,
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}>
          VENTA · TRANSPORTE · ARRIENDO
        </span>
      </div>
    </div>
  )
}
