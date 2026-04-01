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

## Security Defaults

- JWT now uses stronger defaults:
  - `JWT_SECRET` minimum 32 chars
  - `JWT_EXPIRES_IN` default `12h`
  - issuer/audience validation via `JWT_ISSUER` and `JWT_AUDIENCE`
- Password policy requires at least 10 chars with upper, lower, number, and symbol.
- On-chain proof verification is enabled by default with:
  - `CHAIN_VERIFICATION_MODE=live`
  - `CHAIN_RPC_URL`, `CHAIN_ID`, `CHAIN_CONTRACT_ADDRESS`

You can set `CHAIN_VERIFICATION_MODE=auto` to allow local fallback when chain config is missing, or `off` only for controlled development/testing.

## Routes

- `POST /register`
- `POST /login`
- `GET /me` (auth required)
- `POST /api/products` (Farmer)
- `GET /api/products/price-recommendation?crop=<name>&state=<state>` (Farmer)
- `GET /api/products/price-forecast?crop=<name>&state=<state>&daysAhead=7` (Farmer, returns forecast in INR/kg)
- `PATCH /api/products/:productId/stage` (Farmer/Retailer)
- `GET /api/products/:productId` (public)
