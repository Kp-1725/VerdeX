# VerdeX

VerdeX is a role-based agri traceability platform that helps farmers and retailers manage produce lifecycle updates, trade requests, and transparent tracking from source to shelf.

## What This Project Includes

- Product creation and lifecycle tracking
- Role-based workflows for Farmer and Retailer users
- Trade request inbox with status updates and messaging
- Public product page for transparency
- Live platform metrics dashboard
- Government-inspired crop price recommendation flow with prototype fallback mode
- Team ML-based short-term price forecasting integration

## Tech Stack

- Frontend: React (Vite) + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB
- Blockchain integration: Ethers.js + MetaMask + Ganache/Polygon development setup

## Quick Start

### 1. Prerequisites

- Node.js 18+
- npm
- MongoDB (local or cloud)
- MetaMask (for blockchain flows)

### 2. Install Dependencies

Open two terminals.

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

### 3. Configure Environment Variables

Backend:

- Copy [backend/.env.example](backend/.env.example) to [backend/.env](backend/.env)
- Set at least:
  - MONGODB_URI
  - JWT_SECRET
  - CLIENT_ORIGIN
  - PUBLIC_APP_URL

Frontend:

- Copy [frontend/.env.example](frontend/.env.example) to [frontend/.env](frontend/.env)
- Set blockchain-related variables based on your network setup

### 4. Run the App

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Then open the frontend URL shown by Vite (usually http://localhost:5173).

## Project Structure

```text
backend/
  controllers/
  middleware/
  models/
  routes/
  services/
  server.js
frontend/
  src/
    components/
    hooks/
    pages/
    utils/
ml-price-model/
  data_schema.py
  price_model.py
  price_prediction_api.py
```

## Core User Flows

Farmer:

- Create product metadata and generate product IDs
- Update farm profile
- Respond to retailer trade requests
- View metrics and tracking data

Retailer:

- Discover farmers
- Send trade requests
- Update product status and retail price
- Monitor requests and metrics

Public:

- View product trace page using public product URL

## Important Pages

- /home
- /add-product
- /update-status
- /track
- /requests
- /discover-farmers
- /farmer-profile
- /metrics
- /product/:id

## Platform Metrics Dashboard

The /metrics page shows real-time operational insights from your own platform data, including:

- Total value tracked
- Fairness rating
- Food waste prevented
- Regional transparency map
- Live ledger stream from recent product/request updates
- Velocity and totals counters

## Price Recommendation Modes

Configured in backend environment:

- GOVT_PRICE_MODE=auto
  - Uses live data when a valid GOVT_DATA_API_KEY exists
  - Falls back to prototype benchmark values when key is missing or source is unavailable
- GOVT_PRICE_MODE=live
  - Requires GOVT_DATA_API_KEY
  - Fails on missing key or live source failures
- GOVT_PRICE_MODE=prototype
  - Always uses prototype benchmark data for reliable demos

Endpoint:

- GET /api/products/price-recommendation?crop=<name>&state=<state>

## ML Price Forecast Integration

VerdeX now includes a Python Random Forest service in [ml-price-model/README.md](ml-price-model/README.md).

- Backend endpoint: GET /api/products/price-forecast?crop=<name>&state=<state>&daysAhead=7
- Forecast unit: INR/kg (per kilogram)
- Add Product UI can load and apply day-1 ML forecast price
- Backend mode control:
  - ML_PRICE_MODE=auto: live API if available, else prototype fallback
  - ML_PRICE_MODE=live: strict live ML API mode
  - ML_PRICE_MODE=prototype: always fallback series

## Scripts

Backend:

- npm run dev
- npm start

Frontend:

- npm run dev
- npm run build
- npm run preview

## Additional Documentation

- Backend API notes: [backend/README.md](backend/README.md)
- Frontend setup notes: [frontend/README.md](frontend/README.md)

## Troubleshooting

- If auth fails, verify JWT_SECRET and token validity
- If CORS fails, verify CLIENT_ORIGIN in backend env
- If price recommendation should run without key, use GOVT_PRICE_MODE=auto or GOVT_PRICE_MODE=prototype
- If blockchain actions fail, verify MetaMask network and contract configuration in frontend env
