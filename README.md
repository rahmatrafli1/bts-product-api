# BTS Product API

REST API untuk manajemen produk dan autentikasi (Backend Developer Coding Test).

## Fitur

- CRUD Produk (`/api/products`)
- Register & Login dengan JWT (`/api/auth`)
- Rate limiting (products mutation: 1x/5s, auth: 3x/60s)
- Basic caching (60s TTL, in-memory node-cache)
- CORS enabled (semua origin)
- Swagger docs di `/api-docs`
- Menggunakan **ES Modules** (`"type": "module"`)

## Requirement

- Node.js **>= 18.x** (disarankan LTS terbaru)
- npm >= 9.x

## Menjalankan secara lokal

```powershell
npm install
copy .env.example .env
npm run dev
```

## Menjalankan dengan Docker

```powershell
docker-compose up --build
```

API akan berjalan di `http://localhost:3000`.
Swagger docs: `http://localhost:3000/api-docs`

## Contoh Request

### Register

```
POST /api/auth/register
{
  "username": "jhon_doe",
  "password": "supersecret",
  "password_confirmation": "supersecret"
}
```

### Login

```
POST /api/auth/login
{
  "username": "jhon_doe",
  "password": "supersecret"
}
```

Response berisi `authentication_token` dan `refresh_token`.

### Create Product (perlu Bearer token)

```
POST /api/products
Authorization: Bearer <authentication_token>
{
  "title": "Awesome T-Shirt",
  "price": 99.99,
  "description": "High-quality cotton t-shirt",
  "category": "Clothes",
  "images": ["https://placeimg.com/640/480/any"]
}
```

## Catatan Teknis

- Data disimpan di `data/db.json` menggunakan `lowdb` (file-based JSON DB), otomatis dibuat saat pertama kali server dijalankan.
- Password user di-hash menggunakan `bcryptjs` sebelum disimpan.
- File `data/db.json` tidak di-commit ke git (lihat `.gitignore`).
