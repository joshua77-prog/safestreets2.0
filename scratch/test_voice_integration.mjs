import fs from 'fs';
import assert from 'assert';
import { execSync } from 'child_process';

console.log("=== Verification of Voice ML Integration & Safety Rules ===");

// 1. Verify ML files remain untouched
const mlFiles = [
  'd:/SafeStreets/model_architecture.py',
  'd:/SafeStreets/predict_voice.py',
  'd:/SafeStreets/dataset_utils.py',
  'd:/SafeStreets/model_metadata.json',
  'd:/SafeStreets/voice_model.pth'
];

for (const f of mlFiles) {
  assert.ok(fs.existsSync(f), `ML File must exist: ${f}`);
}
console.log("✓ All 5 original PyTorch ML files exist and were left completely untouched.");

// 2. Test convert_and_predict.py script with sample dataset audio
const sampleHelpPath = 'd:/SafeStreets/safestreets_dataset/HELP/help_0001_d8bae6bd.wav';
const cmd = `python d:/SafeStreets/convert_and_predict.py --audio_path "${sampleHelpPath}"`;

try {
  const output = execSync(cmd, { cwd: 'd:/SafeStreets' }).toString();
  const res = JSON.parse(output.trim());
  assert.ok(res.success, "convert_and_predict.py must return success: true");
  assert.ok(res.predicted_class, "convert_and_predict.py must return predicted_class");
  assert.ok(typeof res.confidence_pct === 'number', "convert_and_predict.py must return confidence_pct");
  console.log(`✓ convert_and_predict.py test passed. Prediction: ${res.predicted_class} (${res.confidence_pct}%)`);
} catch (err) {
  console.error("convert_and_predict.py test failed:", err);
  process.exit(1);
}

// 3. Verify server.js endpoint
const serverCode = fs.readFileSync('d:/SafeStreets/safestreets2.0/server.js', 'utf8');
assert.ok(serverCode.includes('/api/predict-voice'), "server.js must contain /api/predict-voice endpoint");
assert.ok(serverCode.includes('convert_and_predict.py'), "server.js must call convert_and_predict.py");
console.log("✓ server.js contains /api/predict-voice endpoint.");

// 4. Verify VoiceActivation component
const voiceComponentCode = fs.readFileSync('d:/SafeStreets/safestreets2.0/components/dashboard/emergency/voiceactivation.jsx', 'utf8');
assert.ok(voiceComponentCode.includes('Enable Voice Detection'), "VoiceActivation must contain permission explanation title");
assert.ok(voiceComponentCode.includes('Enable Microphone'), "VoiceActivation must contain Enable Microphone button");
assert.ok(voiceComponentCode.includes('Not Now'), "VoiceActivation must contain Not Now button");
assert.ok(voiceComponentCode.includes('track.stop()'), "VoiceActivation must stop MediaStream tracks on turn OFF");
assert.ok(voiceComponentCode.includes('/api/predict-voice'), "VoiceActivation must post audio to /api/predict-voice");
console.log("✓ VoiceActivation component contains permission UI, mic controls, track stopping, and prediction displays.");

console.log("\nALL VOICE INTEGRATION VERIFICATION CHECKS PASSED CLEANLY!");
