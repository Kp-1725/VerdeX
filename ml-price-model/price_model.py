from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, List

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder


class VerdexPricePredictionModel:
    def __init__(self) -> None:
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=15,
            random_state=42,
            n_jobs=-1,
        )
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.feature_columns: List[str] = []
        self.metrics: Dict[str, float] = {}
        self.is_trained = False

    def _prepare_features(self, df: pd.DataFrame, fit_encoders: bool) -> pd.DataFrame:
        work = df.copy()
        work["date"] = pd.to_datetime(work["date"])
        work["day_of_year"] = work["date"].dt.dayofyear
        work["month"] = work["date"].dt.month
        work["day_of_week"] = work["date"].dt.dayofweek
        work["week_of_year"] = work["date"].dt.isocalendar().week.astype(int)

        categorical_cols = [
            "product_name",
            "category",
            "farm_name",
            "region",
            "certification",
        ]

        for column in categorical_cols:
            encoder = self.label_encoders.get(column)
            if fit_encoders or encoder is None:
                encoder = LabelEncoder()
                work[f"{column}_encoded"] = encoder.fit_transform(work[column].astype(str))
                self.label_encoders[column] = encoder
            else:
                values = []
                classes = set(encoder.classes_)
                for value in work[column].astype(str):
                    values.append(value if value in classes else encoder.classes_[0])
                work[f"{column}_encoded"] = encoder.transform(values)

        feature_cols = [
            "day_of_year",
            "month",
            "day_of_week",
            "week_of_year",
            "product_name_encoded",
            "category_encoded",
            "farm_name_encoded",
            "region_encoded",
            "certification_encoded",
            "average_rating",
            "review_count",
            "active_supply",
        ]

        if fit_encoders:
            self.feature_columns = feature_cols

        return work[feature_cols]

    def train(self, df: pd.DataFrame, test_size: float = 0.2) -> Dict[str, float]:
        if "price" not in df.columns:
            raise ValueError("Training data must include 'price' column")

        features = self._prepare_features(df, fit_encoders=True)
        target = df["price"].astype(float)

        # Chronological split for time-aware validation.
        split_index = int(len(df) * (1 - test_size))
        x_train = features.iloc[:split_index]
        y_train = target.iloc[:split_index]
        x_test = features.iloc[split_index:]
        y_test = target.iloc[split_index:]

        self.model.fit(x_train, y_train)

        train_pred = self.model.predict(x_train)
        test_pred = self.model.predict(x_test)

        self.metrics = {
            "mae_train": float(mean_absolute_error(y_train, train_pred)),
            "mae_test": float(mean_absolute_error(y_test, test_pred)),
            "rmse_train": float(np.sqrt(mean_squared_error(y_train, train_pred))),
            "rmse_test": float(np.sqrt(mean_squared_error(y_test, test_pred))),
            "train_samples": int(len(x_train)),
            "test_samples": int(len(x_test)),
            "feature_count": int(len(self.feature_columns)),
        }

        self.is_trained = True
        return self.metrics

    def _predict_single_day(
        self,
        date_value: datetime,
        product_name: str,
        farm_name: str,
        region: str,
        certification: str,
        average_rating: float,
        review_count: int,
        active_supply: int,
    ) -> float:
        if not self.is_trained:
            raise RuntimeError("Model is not trained")

        # Infer category from known products if available.
        category = "Vegetable"
        lower_product = product_name.lower()
        if "rice" in lower_product or "wheat" in lower_product:
            category = "Grain"
        if "soy" in lower_product:
            category = "Oil"

        row = pd.DataFrame(
            [
                {
                    "date": date_value.date().isoformat(),
                    "product_name": product_name,
                    "category": category,
                    "farm_name": farm_name,
                    "region": region,
                    "certification": certification,
                    "average_rating": float(average_rating),
                    "review_count": int(review_count),
                    "active_supply": int(active_supply),
                }
            ]
        )

        features = self._prepare_features(row, fit_encoders=False)
        prediction = float(self.model.predict(features)[0])
        return prediction

    def predict_price_range(
        self,
        product_name: str,
        farm_name: str,
        region: str,
        certification: str,
        average_rating: float,
        review_count: int,
        active_supply: int,
        days_ahead: int = 7,
        confidence: float = 0.85,
    ) -> List[Dict[str, float]]:
        if not self.is_trained:
            raise RuntimeError("Model is not trained")

        horizon = max(1, min(int(days_ahead), 30))
        start_date = datetime.utcnow().date()

        predictions = []
        for offset in range(horizon):
            target_date = datetime.combine(start_date + timedelta(days=offset), datetime.min.time())
            predicted_price = self._predict_single_day(
                date_value=target_date,
                product_name=product_name,
                farm_name=farm_name,
                region=region,
                certification=certification,
                average_rating=average_rating,
                review_count=review_count,
                active_supply=active_supply,
            )
            lower = round(predicted_price * 0.85, 2)
            upper = round(predicted_price * 1.15, 2)
            predictions.append(
                {
                    "date": target_date.date().isoformat(),
                    "predicted_price": round(predicted_price, 2),
                    "lower_bound": lower,
                    "upper_bound": upper,
                    "confidence": confidence,
                }
            )

        return predictions

    def save_model(self, file_path: str = "price_prediction_model.pkl") -> None:
        payload = {
            "model": self.model,
            "label_encoders": self.label_encoders,
            "feature_columns": self.feature_columns,
            "metrics": self.metrics,
            "is_trained": self.is_trained,
        }
        joblib.dump(payload, file_path)

    def load_model(self, file_path: str = "price_prediction_model.pkl") -> None:
        payload = joblib.load(file_path)
        self.model = payload["model"]
        self.label_encoders = payload["label_encoders"]
        self.feature_columns = payload["feature_columns"]
        self.metrics = payload.get("metrics", {})
        self.is_trained = payload.get("is_trained", True)

    def get_metrics(self) -> Dict[str, float]:
        return self.metrics
