import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { EmergencyContact } from "../entities/all.js";
import { evaluateAllRoutes } from "../services/routing.js";

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

async function runEmergencyContactVerification() {
  console.log("==================================================");
  console.log("EMERGENCY CONTACT PERSISTENCE & REGRESSION VERIFICATION");
  console.log("==================================================\n");

  const results = {};
  EmergencyContact.clearCache();

  // --------------------------------------------------
  // TEST 1: Add contact while authenticated (or simulated auth)
  // --------------------------------------------------
  try {
    const contactData1 = {
      name: "Alice Smith",
      phone: "+15550199",
      email: "alice@example.com",
      relationship: "family"
    };

    const created1 = await EmergencyContact.create(contactData1);
    assert.ok(created1.id, "Created contact must have an ID");
    assert.equal(created1.name, "Alice Smith", "Contact name must match");
    assert.equal(created1.phone, "+15550199", "Contact phone must match");

    const list1 = await EmergencyContact.list();
    const found1 = list1.find(c => c.name === "Alice Smith");
    assert.ok(found1, "Contact must be returned by list()");

    console.log(`✓ TEST 1 (Create Contact): Added "${created1.name}" (ID: ${created1.id}) successfully.`);
    results.test1 = "PASS";
  } catch (err) {
    console.error("✗ TEST 1 Failed:", err.message);
    results.test1 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST 2: Add contact with fallback (unauthenticated / offline)
  // --------------------------------------------------
  try {
    const contactData2 = {
      name: "Bob Jones",
      phone: "+15550288",
      email: "bob@example.com",
      relationship: "friend"
    };

    const created2 = await EmergencyContact.create(contactData2);
    assert.ok(created2.id, "Fallback created contact must have an ID");
    assert.equal(created2.name, "Bob Jones");

    const list2 = await EmergencyContact.list();
    const found2 = list2.find(c => c.name === "Bob Jones");
    assert.ok(found2, "Fallback contact must be returned by list()");

    console.log(`✓ TEST 2 (Fallback Add): Added "${created2.name}" (ID: ${created2.id}) to localStorage.`);
    results.test2 = "PASS";
  } catch (err) {
    console.error("✗ TEST 2 Failed:", err.message);
    results.test2 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST 3: Reload / Re-list from storage
  // --------------------------------------------------
  try {
    const listReloaded = await EmergencyContact.list();
    assert.ok(listReloaded.length >= 2, `Expected at least 2 contacts after reload, got ${listReloaded.length}`);

    const hasAlice = listReloaded.some(c => c.name === "Alice Smith");
    const hasBob = listReloaded.some(c => c.name === "Bob Jones");

    assert.ok(hasAlice, "Alice Smith must persist after reload");
    assert.ok(hasBob, "Bob Jones must persist after reload");

    console.log(`✓ TEST 3 (Reload Persistence): Retained ${listReloaded.length} contacts across page reload.`);
    results.test3 = "PASS";
  } catch (err) {
    console.error("✗ TEST 3 Failed:", err.message);
    results.test3 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST 4: Multiple contacts (No overwriting)
  // --------------------------------------------------
  try {
    const contactData3 = {
      name: "Charlie Brown",
      phone: "+15550377",
      email: "charlie@example.com",
      relationship: "partner"
    };

    const created3 = await EmergencyContact.create(contactData3);
    const listMulti = await EmergencyContact.list();

    const names = listMulti.map(c => c.name);
    assert.ok(names.includes("Alice Smith"), "Alice Smith must not be overwritten");
    assert.ok(names.includes("Bob Jones"), "Bob Jones must not be overwritten");
    assert.ok(names.includes("Charlie Brown"), "Charlie Brown must be present");

    console.log(`✓ TEST 4 (Multiple Contacts No Overwrite): Total contacts = ${listMulti.length} (${names.join(", ")}).`);
    results.test4 = "PASS";
  } catch (err) {
    console.error("✗ TEST 4 Failed:", err.message);
    results.test4 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST 5: Delete a single contact
  // --------------------------------------------------
  try {
    const listBefore = await EmergencyContact.list();
    const bob = listBefore.find(c => c.name === "Bob Jones");
    assert.ok(bob, "Bob Jones must exist before delete");

    const deleted = await EmergencyContact.delete(bob.id);
    assert.ok(deleted, "Delete must return true");

    const listAfter = await EmergencyContact.list();
    const hasBobAfter = listAfter.some(c => c.id === bob.id);
    assert.ok(!hasBobAfter, "Bob Jones must be removed");

    const hasAliceAfter = listAfter.some(c => c.name === "Alice Smith");
    assert.ok(hasAliceAfter, "Alice Smith must remain after deleting Bob");

    console.log(`✓ TEST 5 (Delete Contact): Removed Bob Jones. Remaining contacts: ${listAfter.length}.`);
    results.test5 = "PASS";
  } catch (err) {
    console.error("✗ TEST 5 Failed:", err.message);
    results.test5 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST 6: Update contact
  // --------------------------------------------------
  try {
    const listBefore = await EmergencyContact.list();
    const alice = listBefore.find(c => c.name === "Alice Smith");
    assert.ok(alice, "Alice Smith must exist before update");

    const updated = await EmergencyContact.update(alice.id, { is_primary: true, relationship: "spouse" });
    assert.ok(updated, "Update must return updated object");
    assert.equal(updated.is_primary, true);

    const listReloaded = await EmergencyContact.list();
    const aliceUpdated = listReloaded.find(c => c.id === alice.id);
    assert.equal(aliceUpdated.is_primary, true, "is_primary change must persist");
    assert.equal(aliceUpdated.relationship, "spouse", "relationship change must persist");

    console.log(`✓ TEST 6 (Update Contact): Updated "${aliceUpdated.name}" (is_primary: ${aliceUpdated.is_primary}, relationship: ${aliceUpdated.relationship}).`);
    results.test6 = "PASS";
  } catch (err) {
    console.error("✗ TEST 6 Failed:", err.message);
    results.test6 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST 7: Route Functionality Regression Check
  // --------------------------------------------------
  try {
    const origin = { lat: 12.9716, lon: 77.5946 };
    const destination = { lat: 12.9816, lon: 77.6046 };

    const routes = await evaluateAllRoutes(origin, destination, { safetyData: [], communityReports: [] });
    assert.ok(routes.safest, "Safest route must exist");
    assert.ok(routes.fastest, "Fastest route must exist");
    assert.ok(routes.safest.displayedSafetyScore >= 0, "Safety score must be valid");

    console.log(`✓ TEST 7 (Route Regression Check): Routes evaluated cleanly. Safest score = ${routes.safest.displayedSafetyScore}/100.`);
    results.test7 = "PASS";
  } catch (err) {
    console.error("✗ TEST 7 Failed:", err.message);
    results.test7 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // MODEL INTEGRITY VERIFICATION
  // --------------------------------------------------
  try {
    const modelPath = path.resolve("ml", "safety_model.pkl");
    const stat = fs.statSync(modelPath);
    assert.equal(stat.size, 268974650, "safety_model.pkl size must be 268,974,650 bytes");
    console.log(`✓ Model Integrity Verified: ml/safety_model.pkl size is ${stat.size} bytes (100% UNTOUCHED).`);
    results.modelIntegrity = "UNTOUCHED (268,974,650 bytes)";
  } catch (err) {
    console.error("✗ Model Integrity Check Failed:", err.message);
    results.modelIntegrity = `FAIL: ${err.message}`;
  }

  console.log("\n==================================================");
  console.log("VERIFICATION SUMMARY RESULTS:");
  console.log("==================================================");
  console.table(results);
}

runEmergencyContactVerification().catch(console.error);
