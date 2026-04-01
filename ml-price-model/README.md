# VerdeX ML Price Prediction Service

This folder contains the team-shared Random Forest model service used for short-horizon agricultural price forecasts.

## Files

- data_schema.py
- price_model.py
- price_prediction_api.py
- requirements.txt

## Setup

```bash
cd ml-price-model
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python price_prediction_api.py
```

The API starts on http://127.0.0.1:5001.

## Endpoints

- GET /api/price-prediction/health
- POST /api/price-prediction/train
- POST /api/price-prediction/predict
- GET /api/price-prediction/schema
- GET /api/price-prediction/metrics
