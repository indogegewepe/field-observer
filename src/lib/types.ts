export interface FieldObservation {
  id: string
  created_at: string
  observation_date: string
  warung_type: string
  main_pain_point: string
  most_requested_feature: string
  objection: string
  willing_to_try: 'Y' | 'T'
  notes: string | null
}

export interface FieldObservationInsert {
  observation_date: string
  warung_type: string
  main_pain_point: string
  most_requested_feature: string
  objection: string
  willing_to_try: 'Y' | 'T'
  notes?: string | null
}

export type WarungType =
  | 'Warung Makan'
  | 'Kedai Kopi'
  | 'Warung Tegal'
  | 'Bakso/Mie Ayam'
  | 'Nasi Goreng'
  | 'Lainnya'

export const WARUNG_TYPES: WarungType[] = [
  'Warung Makan',
  'Kedai Kopi',
  'Warung Tegal',
  'Bakso/Mie Ayam',
  'Nasi Goreng',
  'Lainnya'
]