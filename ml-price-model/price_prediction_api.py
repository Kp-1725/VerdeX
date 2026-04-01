from __future__ import annotations

from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

from data_schema import VerdeXDataSchema
from price_model import VerdexPricePredictionModel


app = Flask(__name__)
CORS(app)

MODEL_PATH = Path(__file__).with_name("price_prediction_model.pkl")
model = VerdexPricePredictionModel()


def ensure_model_loaded() -> None:
    if MODEL_PATH.exists():
        model.load_model(str(MODEL_PATH))
        return

    train_df = VerdeXDataSchema.generate_synthetic_dataset(days=365, num_samples_per_day=2)
    model.train(train_df)
    model.save_model(str(MODEL_PATH))


@app.get("/api/price-prediction/health")
def health() -> tuple:
    return jsonify({"status": "ok", "service": "verdex-ml-price-api"}), 200


@app.post("/api/price-prediction/train")
def train() -> tuple:
    payload = request.get_json(silent=True) or {}
    days = int(payload.get("days", 365))
    samples_per_day = int(payload.get("samples_per_day", 2))

    train_df = VerdeXDataSchema.generate_synthetic_dataset(
        days=max(30, min(days, 2000)),
        num_samples_per_day=max(1, min(samples_per_day, 10)),
    )
    metrics = model.train(train_df)
    model.save_model(str(MODEL_PATH))

    return jsonify({"status": "success", "metrics": metrics}), 200


@app.post("/api/price-prediction/predict")
def predict() -> tuple:
    payload = request.get_json(silent=True) or {}

    product_name = str(payload.get("product_name", "")).strip()
    farm_name = str(payload.get("farm_name", "Haryana Farms")).strip()
    region = str(payload.get("region", "Karnataka")).strip()
    certification = str(payload.get("certification", "Organic")).strip()

    if not product_name:
        return jsonify({"status": "error", "message": "product_name is required"}), 400

    average_rating = float(payload.get("average_rating", 4.2))
    review_count = int(payload.get("review_count", 150))
    active_supply = int(payload.get("active_supply", 300))
    days_ahead = int(payload.get("days_ahead", 7))

    predictions = model.predict_price_range(
        product_name=product_name,
        farm_name=farm_name,
        region=region,
        certification=certification,
        average_rating=average_rating,
        review_count=review_count,
        active_supply=active_supply,
        days_ahead=days_ahead,
    )

    return (
        jsonify(
            {
                "status": "success",
                "product_name": product_name,
                "farm_name": farm_name,
                "predictions": predictions,
            }
        ),
        200,
    )


@app.get("/api/price-prediction/schema")
def schema() -> tuple:
    return (
        jsonify(
            {
                "products": [item["name"] for item in VerdeXDataSchema.PRODUCTS],
                "farms": VerdeXDataSchema.FARMS,
                "regions": VerdeXDataSchema.REGIONS,
                "certifications": VerdeXDataSchema.CERTIFICATIONS,
            }
        ),
        200,
    )


@app.get("/api/price-prediction/metrics")
def metrics() -> tuple:
    return jsonify({"status": "success", "metrics": model.get_metrics()}), 200


if __name__ == "__main__":
    ensure_model_loaded()
    app.run(host="127.0.0.1", port=5001, debug=False)
