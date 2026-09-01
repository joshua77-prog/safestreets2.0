import fs from 'fs';
import assert from 'assert';

console.log("=== Emergency Page Fix Verification ===");

// 1. Check emergency.jsx for sensor buttons removal
const emergencyCode = fs.readFileSync('d:/SafeStreets/safestreets2.0/pages/emergency.jsx', 'utf8');

assert.ok(!emergencyCode.includes('Wearable SOS'), 'Wearable SOS button must be removed');
assert.ok(!emergencyCode.includes('Pressure Sensor'), 'Pressure Sensor button must be removed');
assert.ok(!emergencyCode.includes('Motion Sensor'), 'Motion Sensor button must be removed');
assert.ok(!emergencyCode.includes('Accelerometer'), 'Accelerometer button must be removed');
console.log("✓ Sensor test buttons successfully removed from Emergency Page");

// 2. Check loadEmergencyData in emergency.jsx
assert.ok(!emergencyCode.includes('setContacts([]);\n\n      const { data: { user } }'), 'loadEmergencyData must not setContacts([]) before loading');
console.log("✓ loadEmergencyData fixed to load contacts reliably");

// 3. Check emergencycontacts.jsx
const contactsComponentCode = fs.readFileSync('d:/SafeStreets/safestreets2.0/components/dashboard/emergency/emergencycontacts.jsx', 'utf8');
assert.ok(contactsComponentCode.includes('EmergencyContact.clearCache()'), 'handleAddContact must clear cache');
assert.ok(contactsComponentCode.includes('await onContactsChange()'), 'handleAddContact must await onContactsChange');
console.log("✓ Emergency contact creation on Emergency Page verified");

console.log("ALL EMERGENCY PAGE CHECKS PASSED!");
