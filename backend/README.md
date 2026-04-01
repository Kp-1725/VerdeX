# Backend API

## Setup

1. Copy `.env.example` to `.env`
2. Update `MONGODB_URI` and `JWT_SECRET`
3. Government price recommendation modes:
   - Default `GOVT_PRICE_MODE=auto`: works without key using prototype fallback
   - `GOVT_PRICE_MODE=live`: requires `GOVT_DATA_API_KEY`
   - `GOVT_PRICE_MODE=prototype`: always uses prototype data
4. Optional: set `GOVT_DATA_API_KEY` for live government data from data.gov.in
5. ML forecast modes:
   - Default `ML_PRICE_MODE=auto`: uses Python ML API if available, else prototype fallback
   - `ML_PRICE_MODE=live`: requires active Python ML API at `ML_PRICE_API_URL`
   - `ML_PRICE_MODE=prototype`: always uses backend prototype forecast
6. Install dependencies: `npm install`
7. Run development server: `npm run dev`

## Routes

- `POST /register`
- `POST /login`
- `GET /me` (auth required)
- `POST /api/products` (Farmer)
- `GET /api/products/price-recommendation?crop=<name>&state=<state>` (Farmer)
- `GET /api/products/price-forecast?crop=<name>&state=<state>&daysAhead=7` (Farmer, returns forecast in INR/kg)
- `PATCH /api/products/:productId/stage` (Farmer/Retailer)
- `GET /api/products/:productId` (public)
