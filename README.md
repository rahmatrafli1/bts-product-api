# BTS Product API

REST API untuk manajemen produk dan autentikasi.

## Fitur

- CRUD Produk (`/api/products`)
- Register & Login dengan JWT (`/api/auth`)
- Rate limiting: product mutation 1x/5 detik, auth 3x/60 detik
- Basic caching 60 detik
- CORS enabled
- Swagger docs di `/api-docs`
- ES Modules (`"type": "module"`)

## Requirement

- Node.js >= 18.x
- npm >= 9.x

## Instalasi dan Menjalankan Project

```powershell
npm install
copy .env.example .env
```

Buat nilai rahasia untuk JWT dengan menjalankan perintah berikut **dua kali**:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Masukkan hasilnya ke file `.env`:

```env
PORT=3000
JWT_SECRET=hasil_generate_pertama
JWT_REFRESH_SECRET=hasil_generate_kedua
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=bts_product_api
DB_USER=postgres
DB_PASSWORD=password_postgresql_anda
```

Jalankan development server:

```powershell
npm run dev
```

API berjalan pada `http://localhost:3000`.

Swagger documentation: `http://localhost:3000/api-docs`

## Docker

```powershell
docker-compose up --build
```

## Endpoint

| Method | Endpoint             |         Auth | Keterangan                |
| ------ | -------------------- | -----------: | ------------------------- |
| POST   | `/api/auth/register` |        Tidak | Register user             |
| POST   | `/api/auth/login`    |        Tidak | Login dan mendapatkan JWT |
| GET    | `/api/products`      |        Tidak | Daftar produk             |
| GET    | `/api/products/:id`  |        Tidak | Detail produk             |
| POST   | `/api/products`      | Bearer Token | Membuat produk            |
| PUT    | `/api/products/:id`  | Bearer Token | Mengubah produk           |
| DELETE | `/api/products/:id`  | Bearer Token | Menghapus produk          |

## Contoh Request

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "username": "jhon_doe",
  "password": "supersecret",
  "password_confirmation": "supersecret"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "username": "jhon_doe",
  "password": "supersecret"
}
```

Response login berisi `authentication_token` dan `refresh_token`.

### Create Product

Gunakan `authentication_token` hasil login pada header:

```http
POST /api/products
Authorization: Bearer <authentication_token>
Content-Type: application/json
```

```json
{
  "title": "Awesome T-Shirt",
  "price": 99.99,
  "description": "High-quality cotton t-shirt",
  "category": "Clothes",
  "images": ["https://placeimg.com/640/480/any"]
}
```

## Catatan Teknis

- Data disimpan di PostgreSQL.
- Konfigurasi database menggunakan `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, dan `DB_PASSWORD` pada `.env`.
- Jalankan `database.sql` terlebih dahulu untuk membuat tabel `users` dan `products`.
- Password disimpan dalam bentuk hash menggunakan `bcryptjs`.
- `JWT_SECRET` dan `JWT_REFRESH_SECRET` harus berbeda.
- Jangan commit file `.env` atau membagikan JWT secret.
