import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { FieldObservationInsert } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const observation: FieldObservationInsert = {
      observation_date: body.observation_date,
      warung_type: body.warung_type,
      main_pain_point: body.main_pain_point,
      most_requested_feature: body.most_requested_feature,
      objection: body.objection,
      willing_to_try: body.willing_to_try,
      notes: body.notes || null
    }

    const { data, error } = await supabase
      .from('field_observations')
      .insert(observation)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}