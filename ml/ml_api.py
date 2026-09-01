import os
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

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "safety_model.pkl")
model = joblib.load(MODEL_PATH)

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
# PREDICT BATCH OF RECORDS
# ============================================================

@app.route(
    "/predict_batch",
    methods=["POST"]
)
def predict_batch():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "No JSON data received"
            }), 400

        records = data.get("records", [])
        if not isinstance(records, list):
            return jsonify({
                "success": False,
                "error": "'records' field must be a list"
            }), 400

        if len(records) == 0:
            return jsonify({
                "success": True,
                "predictions": [],
                "count": 0
            })

        rows = []
        for item in records:
            rows.append({
                "crime_count": float(item.get("crime_count", 0)),
                "crime_type": str(item.get("crime_type", "Other")),
                "time_of_day": str(item.get("time_of_day", "Morning")),
                "current_time": str(item.get("current_time", "Morning")),
                "lighting_score": float(item.get("lighting_score", 5)),
                "police_station_distance_km": float(item.get("police_station_distance_km", 2)),
                "crowd_density": float(item.get("crowd_density", 50)),
                "weather_condition": str(item.get("weather_condition", "Clear")),
                "distance_from_route": float(item.get("distance_from_route", 0))
            })

        sample = pd.DataFrame(rows)

        predicted_risks = model.predict(sample)

        predictions = [
            round(max(0, float(r)), 2) for r in predicted_risks
        ]

        return jsonify({
            "success": True,
            "predictions": predictions,
            "count": len(predictions),
            "model": "Random Forest",
            "prediction_type": "ML Learned Historical Risk Batch"
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