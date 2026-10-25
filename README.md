# FieldObserver

Aplikasi web sederhana untuk input data observasi lapangan harian warung makan/kuliner. Dibangun dengan Next.js 15, TypeScript, Tailwind CSS, dan Supabase.

## Fitur

- **Form Input Harian** (mobile-friendly): Tanggal, jenis warung, pain point utama, fitur paling diminati, keberatan, mau coba (Y/T), catatan singkat
- **Backend**: Supabase (database PostgreSQL + optional auth)
- **Hosting**: Vercel (frontend + cron job)
- **Ringkasan Harian Otomatis**: Setiap jam 22:00 WIB kirim ringkasan ke Telegram
- **Durasi**: 30 hari observasi

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase Client
- Vercel (deploy + cron)

## Persiapan

### 1. Supabase Project

1. Buat project baru di [Supabase](https://supabase.com)
2. Jalankan SQL di `supabase/schema.sql` di Supabase SQL Editor
3. Catat `Project URL`, `anon public key`, dan `service_role key` dari Settings > API

### 2. Telegram Bot (Opsional - untuk notifikasi ringkasan)

1. Buat bot via [@BotFather](https://t.me/BotFather) → `/newbot`
2. Dapatkan `TELEGRAM_BOT_TOKEN`
3. Mulai chat dengan bot, lalu kunjungi `https://api.telegram.org/bot<TOKEN>/getUpdates` untuk mendapatkan `chat_id`

### 3. Environment Variables

Copy `.env.example` ke `.env.local` dan isi:

```bash
cp .env.example .env.local
```

| Variable | Deskripsi |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (untuk cron job) |
| `TELEGRAM_BOT_TOKEN` | Token bot Telegram |
| `TELEGRAM_CHAT_ID` | Chat ID tujuan notifikasi |
| `CRON_SECRET` | Random string untuk verifikasi cron |

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Deploy ke Vercel

1. Push repo ke GitHub
2. Import project di Vercel
3. Tambahkan Environment Variables di Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TELEGRAM_BOT_TOKEN` (opsional)
   - `TELEGRAM_CHAT_ID` (opsional)
   - `CRON_SECRET` (generate random string)
4. Deploy

Vercel akan otomatis menjalankan cron job di `/api/cron/daily-summary` setiap jam 22:00 WIB (schedule: `0 15 * * *` UTC).

## API Endpoints

- `POST /api/observations` - Simpan observasi baru
- `GET /api/cron/daily-summary` - Trigger ringkasan harian (dipanggil Vercel Cron)

## Struktur Project

```
field-observer/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── observations/route.ts    # POST simpan observasi
│   │   │   └── cron/daily-summary/route.ts  # Cron ringkasan harian
│   │   ├── page.tsx                      # Form input (homepage)
│   │   └── layout.tsx
│   └── lib/
│       ├── supabase.ts                   # Supabase client
│       └── types.ts                      # TypeScript types
├── supabase/
│   └── schema.sql                        # Schema database
├── vercel.json                           # Vercel config + cron
├── .env.example                          # Template env vars
└── package.json
```

## Skema Database

Tabel `field_observations`:
- `id` (UUID, PK)
- `created_at` (TIMESTAMPTZ)
- `observation_date` (DATE)
- `warung_type` (TEXT)
- `main_pain_point` (TEXT)
- `most_requested_feature` (TEXT)
- `objection` (TEXT)
- `willing_to_try` (TEXT, 'Y'/'T')
- `notes` (TEXT, nullable)

## Cron Job

Ringkasan harian dijalankan via Vercel Cron setiap jam 22:00 WIB (15:00 UTC):

1. Query data hari ini dari Supabase via RPC `get_daily_summary`
2. Format pesan ringkasan
3. Kirim ke Telegram via Bot API

Format ringkasan:
- Jumlah warung diobservasi
- Pain point teratas (top 3)
- Fitur paling diminati (top 3)
- Persentase "Mau Coba"
- Insight otomatis

## Testing Cron Secara Manual

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/daily-summary
```

## Lisensi

Internal tool untuk WarungKu — not for public distribution.

## PWA

FieldObserver menyediakan manifest, ikon aplikasi, pemasangan mandiri, dan halaman cadangan offline dengan palet WarungKu.

- Android/Chrome/Edge: gunakan tombol **Pasang aplikasi** ketika browser menawarkan pemasangan, atau menu browser **Install app / Tambahkan ke layar utama**.
- iPhone/iPad: buka di Safari, pilih **Bagikan > Tambahkan ke Layar Utama**.
- Service worker aktif pada build production melalui HTTPS (localhost juga didukung). Untuk pemeriksaan lokal, jalankan `npm run build` lalu `npm run start` dengan environment Supabase tersedia.
- Saat offline, navigasi menampilkan halaman penjelasan dan tombol coba lagi. Membuka formulir serta menyimpan observasi tetap memerlukan internet; tidak ada antrean kirim offline.
- Service worker hanya menyimpan halaman offline dan ikon. Respons API, data observasi, dan dokumen formulir tidak disimpan dalam cache.
- Ikon memakai aset di `public/`: `android-chrome-192x192.png`, `android-chrome-512x512.png`, `apple-touch-icon.png`, `favicon.ico`, serta favicon PNG 16/32. Logo header memakai `logo_square.png`.
- Naikkan versi `CACHE_NAME` di `public/sw.js` saat mengganti aset offline.
