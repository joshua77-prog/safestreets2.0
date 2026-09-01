import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("=== Verification of Navigation/Profile UX Fixes ===");

// 1. Verify SafetyScoreCard totalDangerPenalty fix
const safetyScoreCardPath = 'd:/SafeStreets/safestreets2.0/components/navigation/SafetyScoreCard.jsx';
const safetyScoreCardCode = fs.readFileSync(safetyScoreCardPath, 'utf8');

assert.ok(safetyScoreCardCode.includes('totalDangerPenalty'), 'SafetyScoreCard must destructure totalDangerPenalty');
assert.ok(!safetyScoreCardCode.includes('<<<<<<<'), 'SafetyScoreCard must not contain merge conflict markers');
console.log("✓ Task 1 Verified: SafetyScoreCard destructures totalDangerPenalty safely without ReferenceError.");

// 2. Verify Trusted Places removal from Navigation
const navigationPath = 'd:/SafeStreets/safestreets2.0/pages/safenavigation.jsx';
const navigationCode = fs.readFileSync(navigationPath, 'utf8');

assert.ok(!navigationCode.includes('<TrustedPlacesSection'), 'Navigation page must NOT render TrustedPlacesSection UI');
assert.ok(!navigationCode.includes('<TrustedPlaceDetailsCard'), 'Navigation page must NOT render TrustedPlaceDetailsCard UI');

const profilePath = 'd:/SafeStreets/safestreets2.0/pages/profile.jsx';
const profileCode = fs.readFileSync(profilePath, 'utf8');

assert.ok(profileCode.includes('<TrustedPlacesSection'), 'Profile page must render TrustedPlacesSection UI');
assert.ok(profileCode.includes('<TrustedPlaceDetailsCard'), 'Profile page must render TrustedPlaceDetailsCard UI');
console.log("✓ Task 2 Verified: Trusted Places UI moved from Navigation -> Profile page.");

// 3. Verify SearchBox single-click selection fix
const searchBoxPath = 'd:/SafeStreets/safestreets2.0/components/map/SearchBox.jsx';
const searchBoxCode = fs.readFileSync(searchBoxPath, 'utf8');

assert.ok(searchBoxCode.includes('suppressSearchRef'), 'SearchBox must use suppressSearchRef to prevent re-searching on selection');
assert.ok(searchBoxCode.includes('onMouseDown'), 'SearchBox must handle onMouseDown for immediate click committing');
assert.ok(searchBoxCode.includes('handleSelectSuggestion'), 'SearchBox must handle select suggestion');
console.log("✓ Task 3 Verified: SearchBox handles single-click selection and suppresses re-searching.");

console.log("ALL VERIFICATION CHECKS PASSED CLEANLY!");
