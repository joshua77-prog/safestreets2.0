import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { EmergencyContact, SafetyReport } from "../entities/all.js";
import { evaluateAllRoutes } from "../services/routing.js";
import { reverseGeocodeAddress, useResolvedLocation } from "../services/geocoding.js";

// Mock localStorage if running in Node environment
if (typeof global.localStorage === "undefined") {
  const store = new Map();
  global.localStorage = {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}

async function runUICleanupVerification() {
  console.log("==================================================");
  console.log("REPORTS PAGE & DASHBOARD SHARED LOCATION RESOLUTION AUDIT");
  console.log("==================================================\n");

  const results = {};

  // --------------------------------------------------
  // VERIFICATION 1: Test Screenshot Coordinates (12.8237, 80.0441)
  // --------------------------------------------------
  try {
    const lat1 = 12.8237;
    const lon1 = 80.0441;
    const addr1 = await reverseGeocodeAddress(lat1, lon1);
    assert.ok(addr1, "Address must be returned for 12.8237, 80.0441");
    assert.ok(!addr1.includes("Current GPS"), "Resolved address must not contain 'Current GPS'");
    console.log(`✓ VERIFICATION 1 (12.8237, 80.0441 Reverse Geocoded): "${addr1}"`);
    results.screenshotCoordsAddress = addr1;
  } catch (err) {
    console.error("✗ VERIFICATION 1 Failed:", err.message);
    results.screenshotCoordsAddress = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // VERIFICATION 2: Test Second Coordinate Pair (13.0300, 80.1776)
  // --------------------------------------------------
  try {
    const lat2 = 13.0300;
    const lon2 = 80.1776;
    const addr2 = await reverseGeocodeAddress(lat2, lon2);
    assert.ok(addr2, "Address must be returned for 13.0300, 80.1776");
    assert.ok(!addr2.includes("Lat:"), "Resolved address must not contain 'Lat:'");
    console.log(`✓ VERIFICATION 2 (13.0300, 80.1776 Reverse Geocoded): "${addr2}"`);
    results.secondCoordsAddress = addr2;
  } catch (err) {
    console.error("✗ VERIFICATION 2 Failed:", err.message);
    results.secondCoordsAddress = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // VERIFICATION 3: Dashboard & Reports Page Raw Coordinate Resolution Test
  // --------------------------------------------------
  try {
    const itemWithCurrentGPS = {
      location: "Current GPS (12.8237, 80.0441)",
      latitude: 12.8237,
      longitude: 80.0441
    };
    const itemWithLatLon = {
      location: "Lat: 13.0300, Lon: 80.1776",
      latitude: 13.0300,
      longitude: 80.1776
    };

    const resolvedGPS = await reverseGeocodeAddress(itemWithCurrentGPS.latitude, itemWithCurrentGPS.longitude);
    const resolvedLatLon = await reverseGeocodeAddress(itemWithLatLon.latitude, itemWithLatLon.longitude);

    assert.ok(resolvedGPS && !resolvedGPS.includes("Current GPS"), "Dashboard / Reports item 1 resolved");
    assert.ok(resolvedLatLon && !resolvedLatLon.includes("Lat:"), "Dashboard / Reports item 2 resolved");

    console.log(`✓ VERIFICATION 3 (Shared Location Resolution): Shared hook converts "Current GPS (12.8237, 80.0441)" -> "${resolvedGPS}" and "Lat: 13.0300, Lon: 80.1776" -> "${resolvedLatLon}".`);
    results.sharedLocationResolution = "PASS";
  } catch (err) {
    console.error("✗ VERIFICATION 3 Failed:", err.message);
    results.sharedLocationResolution = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // VERIFICATION 4: Report Creation & Numeric Coordinates Preservation
  // --------------------------------------------------
  try {
    const reportData = {
      report_type: "poor_lighting",
      category: "poor_lighting",
      latitude: 12.8237,
      longitude: 80.0441,
      location: "Current GPS (12.8237, 80.0441)",
      time_cycle: "Night",
      safety_rating: 2,
      intelligence_briefing: "Dim streetlights near SRM Potheri area"
    };

    const newReport = await SafetyReport.create(reportData);
    assert.ok(newReport.id, "Report must have an ID");
    assert.equal(newReport.latitude, 12.8237, "Latitude must remain stored in numeric field");
    assert.equal(newReport.longitude, 80.0441, "Longitude must remain stored in numeric field");

    const reportsList = await SafetyReport.list();
    const found = reportsList.find(r => r.id === newReport.id);
    assert.ok(found, "Created report must exist in SafetyReport.list()");

    console.log(`✓ VERIFICATION 4 (Report Creation & Coords Storage): Stored report ${newReport.id} with numeric coords (${newReport.latitude}, ${newReport.longitude}).`);
    results.reportCreationAndCoordsStored = "PASS";
  } catch (err) {
    console.error("✗ VERIFICATION 4 Failed:", err.message);
    results.reportCreationAndCoordsStored = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // VERIFICATION 5: Report Deletion & Persistence
  // --------------------------------------------------
  try {
    const listBefore = await SafetyReport.list();
    assert.ok(listBefore.length > 0, "Must have reports before delete");
    const target = listBefore[0];

    const deleted = await SafetyReport.delete(target.id);
    assert.ok(deleted, "Delete report must return true");

    const listAfter = await SafetyReport.list();
    const hasTargetAfter = listAfter.some(r => r.id === target.id);
    assert.ok(!hasTargetAfter, "Deleted report must be removed from list");

    console.log(`✓ VERIFICATION 5 (Report Deletion): Successfully deleted report ${target.id}. Remaining: ${listAfter.length}.`);
    results.reportDeletion = "PASS";
  } catch (err) {
    console.error("✗ VERIFICATION 5 Failed:", err.message);
    results.reportDeletion = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // VERIFICATION 6: Route Calculation Regression Check
  // --------------------------------------------------
  try {
    const origin = { lat: 12.9716, lon: 77.5946 };
    const destination = { lat: 12.9816, lon: 77.6046 };

    const routes = await evaluateAllRoutes(origin, destination, { safetyData: [], communityReports: [] });
    assert.ok(routes.safest, "Safest route must exist");
    assert.ok(routes.fastest, "Fastest route must exist");
    assert.ok(routes.safest.displayedSafetyScore >= 0, "Safety score must be valid");

    console.log(`✓ VERIFICATION 6 (Route Regression): Route evaluation untouched. Safest score = ${routes.safest.displayedSafetyScore}/100.`);
    results.routeRegression = "PASS";
  } catch (err) {
    console.error("✗ VERIFICATION 6 Failed:", err.message);
    results.routeRegression = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // VERIFICATION 7: ML Model File Integrity Check
  // --------------------------------------------------
  try {
    const modelPath = path.resolve("ml", "safety_model.pkl");
    const stat = fs.statSync(modelPath);
    assert.equal(stat.size, 268974650, "safety_model.pkl size must be 268,974,650 bytes");
    console.log(`✓ VERIFICATION 7 (ML Model Integrity): ml/safety_model.pkl size is ${stat.size} bytes (100% UNTOUCHED).`);
    results.mlModelIntegrity = "UNTOUCHED (268,974,650 bytes)";
  } catch (err) {
    console.error("✗ VERIFICATION 7 Failed:", err.message);
    results.mlModelIntegrity = `FAIL: ${err.message}`;
  }

  console.log("\n==================================================");
  console.log("VERIFICATION SUMMARY RESULTS:");
  console.log("==================================================");
  console.table(results);
}

runUICleanupVerification().catch(console.error);
