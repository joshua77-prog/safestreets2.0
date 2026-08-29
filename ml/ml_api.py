from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd


# ============================================================
# CREATE FLASK APP
# ============================================================

app = Flask(__name__)
CORS(app)


# ============================================================
# LOAD TRAINED RANDOM FOREST MODEL
# ============================================================

model = joblib.load(
    "safety_model.pkl"
)

print(
    "Random Forest model loaded successfully!"
)


# ============================================================
# PREDICT HISTORICAL RISK
# ============================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "No JSON data received"
            }), 400


        # ----------------------------------------------------
        # INPUT FEATURES
        # These MUST match train_model.py
        # ----------------------------------------------------

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


        # ----------------------------------------------------
        # ML PREDICTION
        # ----------------------------------------------------

        predicted_risk = model.predict(
            sample
        )[0]

        predicted_risk = max(
            0,
            float(predicted_risk)
        )


        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return jsonify({

            "success": True,

            "historical_risk": round(
                predicted_risk,
                2
            ),

            "model": "Random Forest",

            "prediction_type":
                "ML Learned Historical Risk"
        })


    except Exception as e:

        return jsonify({

            "success": False,

            "error": str(e)

        }), 400


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route(
    "/",
    methods=["GET"]
)
def home():

    return jsonify({

        "status":
            "ML API is running",

        "model":
            "Random Forest",

        "prediction":
            "Historical Risk"
    })


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    print(
        "ML API running on "
        "http://127.0.0.1:5000"
    )

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )