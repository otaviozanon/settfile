/*
  # Create uploads tracking table

  1. New Tables
    - `uploads`
      - `id` (uuid, primary key) - Unique identifier for each upload
      - `filename` (text) - Original filename
      - `file_size` (bigint) - File size in bytes
      - `file_type` (text) - MIME type of the file
      - `storage_path` (text) - Path in Supabase Storage
      - `public_url` (text) - Public URL to access the file
      - `provider` (text) - Provider name (Supabase Storage)
      - `expires_at` (timestamptz) - When the file expires
      - `created_at` (timestamptz) - When the upload was created
      - `user_id` (uuid) - Optional user ID for authenticated uploads

  2. Security
    - Enable RLS on `uploads` table
    - Add policy for anyone to insert uploads (public uploader)
    - Add policy for anyone to read uploads (public access)
*/

CREATE TABLE IF NOT EXISTS uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  file_size bigint NOT NULL,
  file_type text,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  provider text DEFAULT 'Supabase Storage',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  user_id uuid
);

ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create uploads"
  ON uploads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view uploads"
  ON uploads
  FOR SELECT
  TO anon, authenticated
  USING (true);