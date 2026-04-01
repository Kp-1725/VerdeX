# Frontend App

## Setup

1. Copy `.env.example` to `.env`
2. Update `VITE_CONTRACT_ADDRESS` with your deployed Ganache contract
3. Verify network settings for Ganache:
   - `VITE_CHAIN_ID=1337`
   - `VITE_RPC_URL=http://127.0.0.1:7545`
4. Install dependencies: `npm install`
5. Start app: `npm run dev`

## Main Routes

- `/login`
- `/register`
- `/home` (protected)
- `/add-product` (Farmer)
- `/update-status` (Farmer/Retailer)
- `/track` (protected)
- `/product/:id` (public)
