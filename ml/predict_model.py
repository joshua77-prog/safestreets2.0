import joblib
import pandas as pd


# ============================================================
# LOAD TRAINED MODEL
# ============================================================

model = joblib.load(
    "safety_model.pkl"
)

print(
    "Random Forest model loaded successfully!"
)


# ============================================================
# PREDICT ONE RECORD
# ============================================================

def predict_historical_risk(data):

    sample = pd.DataFrame([{

        "crime_count": float(
            data.get(
                "crime_count",
                0
            )
        ),

        "crime_type": data.get(
            "crime_type",
            "Other"
        ),

        "time_of_day": data.get(
            "time_of_day",
            "Morning"
        ),

        "current_time": data.get(
            "current_time",
            "Morning"
        ),

        "lighting_score": float(
            data.get(
                "lighting_score",
                5
            )
        ),

        "police_station_distance_km": float(
            data.get(
                "police_station_distance_km",
                2
            )
        ),

        "crowd_density": float(
            data.get(
                "crowd_density",
                50
            )
        ),

        "weather_condition": data.get(
            "weather_condition",
            "Clear"
        ),

        "distance_from_route": float(
            data.get(
                "distance_from_route",
                0
            )
        )
    }])


    # ========================================================
    # ML PREDICTION
    # ========================================================

    prediction = model.predict(
        sample
    )[0]


    prediction = max(
        0,
        float(prediction)
    )


    return prediction


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    test_data = {

        "crime_count": 15,

        "crime_type": "Theft",

        "time_of_day": "Night",

        "current_time": "Night",

        "lighting_score": 4,

        "police_station_distance_km": 2.5,

        "crowd_density": 20,

        "weather_condition": "Clear",

        "distance_from_route": 100
    }


    result = predict_historical_risk(
        test_data
    )


    print(
        "Predicted Historical Risk:",
        round(result, 2)
    )