import unittest
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from ml_api import app

class TestMLAPI(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_health_check(self):
        response = self.app.get('/')
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertTrue('status' in data)

    def test_predict_single(self):
        payload = {
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
        response = self.app.post('/predict', data=json.dumps(payload), content_type='application/json')
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data.get('success'))
        self.assertIn('historical_risk', data)
        self.assertIsInstance(data['historical_risk'], float)

    def test_predict_batch(self):
        records = [
            {
                "crime_count": 15,
                "crime_type": "Theft",
                "time_of_day": "Night",
                "current_time": "Night",
                "lighting_score": 4,
                "police_station_distance_km": 2.5,
                "crowd_density": 20,
                "weather_condition": "Clear",
                "distance_from_route": 100
            },
            {
                "crime_count": 40,
                "crime_type": "Assault",
                "time_of_day": "Night",
                "current_time": "Night",
                "lighting_score": 2,
                "police_station_distance_km": 5.0,
                "crowd_density": 10,
                "weather_condition": "Clear",
                "distance_from_route": 20
            }
        ]

        # Single predict calls
        r1 = json.loads(self.app.post('/predict', data=json.dumps(records[0]), content_type='application/json').data)['historical_risk']
        r2 = json.loads(self.app.post('/predict', data=json.dumps(records[1]), content_type='application/json').data)['historical_risk']

        # Batch predict call
        batch_resp = self.app.post('/predict_batch', data=json.dumps({"records": records}), content_type='application/json')
        batch_data = json.loads(batch_resp.data)

        self.assertEqual(batch_resp.status_code, 200)
        self.assertTrue(batch_data.get('success'))
        self.assertEqual(len(batch_data['predictions']), 2)
        self.assertEqual(batch_data['predictions'][0], r1)
        self.assertEqual(batch_data['predictions'][1], r2)

    def test_empty_batch(self):
        response = self.app.post('/predict_batch', data=json.dumps({"records": []}), content_type='application/json')
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data.get('success'))
        self.assertEqual(data.get('predictions'), [])

    def test_invalid_json(self):
        response = self.app.post('/predict_batch', data="invalid json", content_type='application/json')
        self.assertEqual(response.status_code, 400)

if __name__ == '__main__':
    unittest.main()
