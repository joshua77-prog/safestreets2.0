import random
import joblib
import pandas as pd

from sklearn.ensemble import RandomForestRegressor
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline


# ============================================================
# RULES USED TO GENERATE TRAINING TARGET
# ============================================================

def get_crime_count_risk(crime_count):
    if crime_count <= 5:
        return 0
    if crime_count <= 10:
        return 5
    if crime_count <= 20:
        return 10
    if crime_count <= 30:
        return 18
    if crime_count <= 40:
        return 25
    return 35


def get_crime_type_risk(crime_type):
    crime_type = str(crime_type).lower()

    if "assault" in crime_type:
        return 20
    if "harassment" in crime_type or "stalking" in crime_type:
        return 18
    if "violence" in crime_type:
        return 18
    if "robbery" in crime_type or "burglary" in crime_type:
        return 15
    if (
        "theft" in crime_type
        or "pickpocketing" in crime_type
        or "stealing" in crime_type
    ):
        return 12
    if "suspicious" in crime_type:
        return 10
    if "hazard" in crime_type or "accident" in crime_type:
        return 6

    return 5


def get_lighting_risk(lighting_score):
    if lighting_score >= 9:
        return 0
    if lighting_score >= 7:
        return 3
    if lighting_score >= 5:
        return 8
    if lighting_score >= 3:
        return 15

    return 20


def get_police_distance_risk(distance_km):
    if distance_km <= 0.5:
        return 0
    if distance_km <= 1:
        return 2
    if distance_km <= 2:
        return 5
    if distance_km <= 3:
        return 10

    return 15


def get_crowd_density_risk(density):
    if density >= 80:
        return 0
    if density >= 60:
        return 2
    if density >= 40:
        return 5
    if density >= 20:
        return 10

    return 15


def get_time_match_risk(time_of_day, current_time):
    if time_of_day == current_time:
        return 5

    return 0


def get_distance_multiplier(distance_meters):
    if distance_meters <= 50:
        return 1.0
    if distance_meters <= 100:
        return 0.90
    if distance_meters <= 250:
        return 0.75
    if distance_meters <= 500:
        return 0.50
    if distance_meters <= 750:
        return 0.30
    if distance_meters <= 1000:
        return 0.10

    return 0.0


# ============================================================
# CALCULATE HISTORICAL RISK
# ============================================================

def calculate_rule_based_risk(row):

    crime_count_risk = get_crime_count_risk(
        row["crime_count"]
    )

    crime_type_risk = get_crime_type_risk(
        row["crime_type"]
    )

    lighting_risk = get_lighting_risk(
        row["lighting_score"]
    )

    police_risk = get_police_distance_risk(
        row["police_station_distance_km"]
    )

    crowd_risk = get_crowd_density_risk(
        row["crowd_density"]
    )

    time_risk = get_time_match_risk(
        row["time_of_day"],
        row["current_time"]
    )

    distance_multiplier = get_distance_multiplier(
        row["distance_from_route"]
    )

    risk = (
        crime_count_risk
        + crime_type_risk
        + lighting_risk
        + police_risk
        + crowd_risk
        + time_risk
    ) * distance_multiplier

    return risk


# ============================================================
# GENERATE TRAINING DATA
# ============================================================

random.seed(42)

crime_types = [
    "Assault",
    "Harassment",
    "Violence",
    "Robbery",
    "Burglary",
    "Theft",
    "Pickpocketing",
    "Suspicious Activity",
    "Road Hazard",
    "Other"
]

time_cycles = [
    "Morning",
    "Afternoon",
    "Evening",
    "Night",
    "Critical Hours"
]

weather_conditions = [
    "Clear",
    "Cloudy",
    "Rain",
    "Fog"
]

rows = []

# Generate 20,000 training examples
for _ in range(20000):

    row = {
        "crime_count": random.randint(0, 60),

        "crime_type": random.choice(
            crime_types
        ),

        "time_of_day": random.choice(
            time_cycles
        ),

        "current_time": random.choice(
            time_cycles
        ),

        "lighting_score": random.randint(
            1, 10
        ),

        "police_station_distance_km": round(
            random.uniform(0.1, 6.0),
            2
        ),

        "crowd_density": random.randint(
            0, 100
        ),

        "weather_condition": random.choice(
            weather_conditions
        ),

        "distance_from_route": round(
            random.uniform(0, 1500),
            2
        )
    }

    row["historical_risk"] = calculate_rule_based_risk(
        row
    )

    rows.append(row)


df = pd.DataFrame(rows)

print("Training dataset created.")
print("Rows:", len(df))


# ============================================================
# FEATURES AND TARGET
# ============================================================

features = [
    "crime_count",
    "crime_type",
    "time_of_day",
    "current_time",
    "lighting_score",
    "police_station_distance_km",
    "crowd_density",
    "weather_condition",
    "distance_from_route"
]

X = df[features]
y = df["historical_risk"]


# ============================================================
# CATEGORICAL + NUMERICAL FEATURES
# ============================================================

categorical_features = [
    "crime_type",
    "time_of_day",
    "current_time",
    "weather_condition"
]

numerical_features = [
    "crime_count",
    "lighting_score",
    "police_station_distance_km",
    "crowd_density",
    "distance_from_route"
]


preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(
                handle_unknown="ignore"
            ),
            categorical_features
        ),
        (
            "numerical",
            "passthrough",
            numerical_features
        )
    ]
)


# ============================================================
# RANDOM FOREST MODEL
# ============================================================

model = RandomForestRegressor(
    n_estimators=300,
    max_depth=18,
    random_state=42,
    n_jobs=-1
)


pipeline = Pipeline(
    steps=[
        (
            "preprocessor",
            preprocessor
        ),
        (
            "model",
            model
        )
    ]
)


# ============================================================
# TRAIN
# ============================================================

print("Training Random Forest...")

pipeline.fit(X, y)

print("Training completed.")


# ============================================================
# SAVE TRAINED MODEL
# ============================================================

joblib.dump(
    pipeline,
    "safety_model.pkl"
)

print(
    "Model saved as safety_model.pkl"
)