// Logo SVG inline — no depende de archivos externos, siempre carga

interface Props {
  /** 'full' = logo completo con texto | 'icon' = solo chevron rojo */
  variant?: 'full' | 'icon'
  height?: number
}

export default function LogoPatagonia({ variant = 'full', height = 57 }: Props) {
  if (variant === 'icon') {
    // Solo el chevron rojo para el sidebar (34×34)
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 76"
        width={34} height={34} style={{ display: 'block' }}>
        <path d="M2 10 L34 38 L2 66 L12 66 L44 38 L12 10 Z" fill="#e63329"/>
      </svg>
    )
  }

  // Logo completo
  const w = Math.round(height * (320 / 76))
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 76"
      width={w} height={height} style={{ display: 'block' }}>
      <path d="M12 10 L44 38 L12 66 L22 66 L54 38 L22 10 Z" fill="#e63329"/>
      <text x="68" y="24"
        fontFamily="Arial,Helvetica,sans-serif"
        fontSize="10" fontWeight="600"
        fill="rgba(255,255,255,0.60)"
        letterSpacing="2.8">CONTENEDORES</text>
      <text x="66" y="52"
        fontFamily="Arial Black,Arial,Helvetica,sans-serif"
        fontSize="27" fontWeight="900"
        fill="#ffffff"
        letterSpacing="1.2">PATAGONIA</text>
      <text x="68" y="68"
        fontFamily="Arial,Helvetica,sans-serif"
        fontSize="8" fontWeight="400"
        fill="rgba(255,255,255,0.40)"
        letterSpacing="1.5">VENTA  ·  TRANSPORTE  ·  ARRIENDO</text>
    </svg>
  )
}
