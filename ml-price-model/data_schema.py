from __future__ import annotations

from datetime import datetime, timedelta
from typing import List

import numpy as np
import pandas as pd


class VerdeXDataSchema:
    PRODUCTS = [
        {"name": "Organic Tomatoes", "category": "Vegetable", "base_price": 46},
        {"name": "Organic Rice", "category": "Grain", "base_price": 62},
        {"name": "Wheat", "category": "Grain", "base_price": 38},
        {"name": "Onion", "category": "Vegetable", "base_price": 30},
        {"name": "Potato", "category": "Vegetable", "base_price": 24},
        {"name": "Soybean", "category": "Oil", "base_price": 72},
    ]

    FARMS = [
        "Haryana Farms",
        "Bengaluru Growers",
        "Mandya Organics",
        "Kolar Fresh Collective",
    ]

    REGIONS = ["Haryana", "Karnataka", "Maharashtra", "Tamil Nadu"]

    CERTIFICATIONS = ["Organic", "Fair Trade", "ISO 9001", "None"]

    @staticmethod
    def _seasonal_factor(date_value: datetime) -> float:
        month = date_value.month
        if month in (6, 7, 8):
            return np.random.uniform(1.1, 1.15)
        if month in (12, 1, 2):
            return np.random.uniform(0.85, 0.9)
        return np.random.uniform(0.95, 1.05)

    @staticmethod
    def _certification_factor(certification: str) -> float:
        mapping = {
            "Organic": 1.25,
            "Fair Trade": 1.15,
            "ISO 9001": 1.1,
            "None": 1.0,
        }
        return mapping.get(certification, 1.0)

    @staticmethod
    def _supply_factor(active_supply: int) -> float:
        # Higher supply slightly reduces prices.
        return max(0.82, 1.0 - ((active_supply - 100) / 4000))

    @classmethod
    def generate_synthetic_dataset(
        cls,
        days: int = 365,
        num_samples_per_day: int = 2,
        random_seed: int = 42,
    ) -> pd.DataFrame:
        np.random.seed(random_seed)

        records = []
        start_date = datetime.utcnow() - timedelta(days=days)

        for day_offset in range(days):
            current_date = start_date + timedelta(days=day_offset)
            for _ in range(num_samples_per_day):
                product = np.random.choice(cls.PRODUCTS)
                farm = np.random.choice(cls.FARMS)
                region = np.random.choice(cls.REGIONS)
                certification = np.random.choice(cls.CERTIFICATIONS)

                average_rating = round(float(np.random.uniform(3.2, 4.9)), 2)
                review_count = int(np.random.randint(10, 500))
                active_supply = int(np.random.randint(95, 520))

                seasonal = cls._seasonal_factor(current_date)
                certification_mult = cls._certification_factor(certification)
                supply_mult = cls._supply_factor(active_supply)
                rating_mult = 0.9 + ((average_rating - 3.0) / 10)
                random_noise = np.random.uniform(0.96, 1.04)

                final_price = (
                    product["base_price"]
                    * seasonal
                    * certification_mult
                    * supply_mult
                    * rating_mult
                    * random_noise
                )

                records.append(
                    {
                        "date": current_date.date().isoformat(),
                        "product_name": product["name"],
                        "category": product["category"],
                        "farm_name": farm,
                        "region": region,
                        "certification": certification,
                        "average_rating": average_rating,
                        "review_count": review_count,
                        "active_supply": active_supply,
                        "price": round(float(final_price), 2),
                    }
                )

        return pd.DataFrame.from_records(records)


if __name__ == "__main__":
    df = VerdeXDataSchema.generate_synthetic_dataset()
    print(f"Generated {len(df)} records")
    print(df.head(3))
