# Backend API

## Setup

1. Copy `.env.example` to `.env`
2. Update `MONGODB_URI` and `JWT_SECRET`
3. Install dependencies: `npm install`
4. Run development server: `npm run dev`

## Routes

- `POST /register`
- `POST /login`
- `GET /me` (auth required)
- `POST /api/products` (Farmer)
- `PATCH /api/products/:productId/stage` (Farmer/Retailer)
- `GET /api/products/:productId` (public)
