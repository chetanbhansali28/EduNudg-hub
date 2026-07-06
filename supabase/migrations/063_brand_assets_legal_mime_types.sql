-- Allow brand legal pages (PDF, Word) and converted HTML in public brand-assets bucket.
-- Paths: `{brand_id}/legal/{privacy|terms}/…`

UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
    'image/gif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/html',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ],
  file_size_limit = 10485760
WHERE id = 'brand-assets';
