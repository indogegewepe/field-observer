-- Supabase Schema for FieldObserver
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create field_observations table
CREATE TABLE field_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  observation_date DATE NOT NULL,
  warung_type TEXT NOT NULL,
  main_pain_point TEXT NOT NULL,
  most_requested_feature TEXT NOT NULL,
  objection TEXT NOT NULL,
  willing_to_try TEXT NOT NULL CHECK (willing_to_try IN ('Y', 'T')),
  notes TEXT
);

-- Create index for daily queries
CREATE INDEX idx_field_observations_date ON field_observations(observation_date);

-- Enable Row Level Security
ALTER TABLE field_observations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public insert (for field data collection without auth)
CREATE POLICY "Enable insert for all users" ON field_observations
  FOR INSERT WITH CHECK (true);

-- Policy: Allow read for authenticated users only (for summary)
CREATE POLICY "Enable read for authenticated users" ON field_observations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Function to get daily summary
CREATE OR REPLACE FUNCTION get_daily_summary(target_date DATE)
RETURNS TABLE (
  total_warung BIGINT,
  top_pain_points JSONB,
  top_features JSONB,
  willing_percentage NUMERIC,
  insights TEXT
) AS $$
DECLARE
  v_total BIGINT;
  v_willing BIGINT;
  v_pain_points JSONB;
  v_features JSONB;
  v_insights TEXT;
BEGIN
  -- Total warung observed today
  SELECT COUNT(*) INTO v_total
  FROM field_observations
  WHERE observation_date = target_date;

  -- Count willing to try
  SELECT COUNT(*) INTO v_willing
  FROM field_observations
  WHERE observation_date = target_date AND willing_to_try = 'Y';

  -- Top pain points
  SELECT COALESCE(
    jsonb_object_agg(pain_point, cnt ORDER BY cnt DESC),
    '{}'::jsonb
  ) INTO v_pain_points
  FROM (
    SELECT main_pain_point as pain_point, COUNT(*) as cnt
    FROM field_observations
    WHERE observation_date = target_date
    GROUP BY main_pain_point
    ORDER BY cnt DESC
    LIMIT 5
  ) sub;

  -- Top features
  SELECT COALESCE(
    jsonb_object_agg(feature, cnt ORDER BY cnt DESC),
    '{}'::jsonb
  ) INTO v_features
  FROM (
    SELECT most_requested_feature as feature, COUNT(*) as cnt
    FROM field_observations
    WHERE observation_date = target_date
    GROUP BY most_requested_feature
    ORDER BY cnt DESC
    LIMIT 5
  ) sub;

  -- Generate insights
  IF v_total = 0 THEN
    v_insights := 'Belum ada data observasi hari ini.';
  ELSE
    v_insights := format(
      'Total %s warung diobservasi. %s%% bersedia mencoba. Pain point teratas: %s. Fitur paling diminati: %s.',
      v_total,
      ROUND(v_willing::NUMERIC / v_total * 100, 1),
      COALESCE((SELECT pain_point FROM (
        SELECT main_pain_point as pain_point, COUNT(*) as cnt
        FROM field_observations
        WHERE observation_date = target_date
        GROUP BY main_pain_point
        ORDER BY cnt DESC
        LIMIT 1
      ) sub), 'N/A'),
      COALESCE((SELECT feature FROM (
        SELECT most_requested_feature as feature, COUNT(*) as cnt
        FROM field_observations
        WHERE observation_date = target_date
        GROUP BY most_requested_feature
        ORDER BY cnt DESC
        LIMIT 1
      ) sub), 'N/A')
    );
  END IF;

  RETURN QUERY SELECT v_total, v_pain_points, v_features,
    CASE WHEN v_total > 0 THEN ROUND(v_willing::NUMERIC / v_total * 100, 1) ELSE 0 END,
    v_insights;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_daily_summary(DATE) TO authenticated;