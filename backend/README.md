# Backend API

## Setup

1. Copy `.env.example` to `.env`
2. Update `MONGODB_URI` and `JWT_SECRET`
3. Government price recommendation modes:
   - Default `GOVT_PRICE_MODE=auto`: works without key using prototype fallback
   - `GOVT_PRICE_MODE=live`: requires `GOVT_DATA_API_KEY`
   - `GOVT_PRICE_MODE=prototype`: always uses prototype data
4. Optional: set `GOVT_DATA_API_KEY` for live government data from data.gov.in
5. Install dependencies: `npm install`
6. Run development server: `npm run dev`

## Routes

- `POST /register`
- `POST /login`
- `GET /me` (auth required)
- `POST /api/products` (Farmer)
- `GET /api/products/price-recommendation?crop=<name>&state=<state>` (Farmer)
- `PATCH /api/products/:productId/stage` (Farmer/Retailer)
- `GET /api/products/:productId` (public)
