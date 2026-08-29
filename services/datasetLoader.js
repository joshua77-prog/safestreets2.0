import fs from 'fs';
import path from 'path';

let cachedRecords = null;

export function loadSafetyDataset() {
  if (cachedRecords) {
    return cachedRecords;
  }

  try {
    const csvPath = path.resolve(process.cwd(), 'ml', 'data', 'Woman_Safety_Dataset_Management.csv');
    if (!fs.existsSync(csvPath)) {
      console.warn("Dataset CSV file not found at:", csvPath);
      return [];
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(Boolean);

    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      if (cols.length < headers.length) continue;

      const lat = Number(cols[3]);
      const lon = Number(cols[4]);

      if (isNaN(lat) || isNaN(lon)) continue;

      records.push({
        id: cols[0] || `dataset_${i}`,
        city: cols[1] || "",
        area: cols[2] || "",
        latitude: lat,
        longitude: lon,
        crime_type: cols[5] || "Other",
        crime_count: Number(cols[6] || 0),
        time_of_day: cols[7] || "Anytime",
        lighting_score: Number(cols[8] || 5),
        police_station_distance_km: Number(cols[9] || 2.0),
        crowd_density: Number(cols[10] || 50),
        weather_condition: cols[11] || "Clear",
        safety_score: Number(cols[12] || 0.7),
        risk_level: cols[13] || "Medium",
        incident_timestamp: cols[14] || new Date().toISOString()
      });
    }

    cachedRecords = records;
    console.log(`Successfully loaded ${records.length} safety records from dataset.`);
    return cachedRecords;
  } catch (err) {
    console.error("Error loading safety dataset CSV:", err);
    return [];
  }
}

export function getDatasetSafetyData() {
  return loadSafetyDataset();
}

export function getDatasetSafetyDataByCity(city) {
  if (!city) return getDatasetSafetyData();
  const lowerCity = String(city).toLowerCase();
  return loadSafetyDataset().filter((r) => String(r.city).toLowerCase() === lowerCity);
}
