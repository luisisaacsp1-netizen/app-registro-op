export type Rol = 'ot' | 'terreno' | 'admin'

export type EstadoPrograma =
  | 'PENDIENTE'
  | 'EN_PROCESO'
  | 'DESPACHADO'
  | 'REALIZADO'
  | 'SIN_EFECTO'
  | 'COORDINADO'

export type TipoOP = 'ARRIENDO' | 'VENTA' | 'MONTAJE' | 'INTERNO'

export interface ProgramaRow {
  id: string
  op_pv: string
  nv: string | null
  tipo: TipoOP
  vendedor: string | null
  cliente: string
  modelo: string | null
  serie: string | null
  descripcion: string | null
  requiere_montaje: boolean
  fecha_ingreso: string | null
  fecha_despacho: string | null
  fecha_reprograma: string | null
  // verdes
  ejecuta: string | null
  fecha_inicio: string | null
  fecha_termino: string | null
  estado: EstadoPrograma
  avance_pct: number
  observacion: string | null
  // OF
  genera_of: boolean
  of_id: string | null
  // auditoría
  created_at: string
  updated_at: string
}

export interface OrdenFabricacion {
  id: string
  of_numero: number
  programa_id: string | null
  op_pv: string | null
  nv: string | null
  serie: string | null
  fecha_liberacion: string | null
  estado_of: string
  modalidad: string | null
  tipo_trabajo: string | null
  tipo_objeto: string | null
  descripcion: string | null
  plano_estado: string | null
  ot_estado: string | null
  accion_requerida: string | null
  status_ejecucion: string | null
  observacion: string | null
  created_at: string
}

export interface FormIngresoOP {
  op_pv: string
  nv: string
  tipo: TipoOP
  vendedor: string
  cliente: string
  modelo: string
  serie: string
  descripcion: string
  requiere_montaje: boolean
  fecha_ingreso: string
  fecha_despacho: string
  genera_of: boolean
  // si genera_of:
  modalidad: string
  tipo_trabajo: string
  tipo_objeto: string
}
