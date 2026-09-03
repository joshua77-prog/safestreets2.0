import { triggerSOS, SOSAlert } from "../entities/all.js";

const SOS_STATE_KEY = "safestreets_active_sos_state";

function broadcastChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sos_state_changed"));
  }
}

/**
 * Get current SOS state
 */
export function getSOSState() {
  if (typeof window === "undefined") {
    return { status: "idle", remainingSeconds: 0, activeAlert: null, location: null };
  }

  try {
    const raw = localStorage.getItem(SOS_STATE_KEY);
    if (!raw) return { status: "idle", remainingSeconds: 0, activeAlert: null, location: null };

    const state = JSON.parse(raw);

    if (state.status === "countdown") {
      const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
      const remainingSeconds = Math.max(0, (state.durationSeconds || 45) - elapsed);

      return {
        ...state,
        remainingSeconds
      };
    }

    return state;
  } catch (err) {
    console.warn("Error reading SOS state from localStorage:", err);
    return { status: "idle", remainingSeconds: 0, activeAlert: null, location: null };
  }
}

/**
 * Start 45-second SOS countdown
 */
export function startSOSCountdown(alertType = "manual_sos", message = "", source = "SOS") {
  if (typeof window === "undefined") return;

  const newState = {
    status: "countdown",
    startTime: Date.now(),
    durationSeconds: 45,
    alertType,
    message: message || "Emergency assistance needed",
    source,
    activeAlert: null,
    location: null
  };

  localStorage.setItem(SOS_STATE_KEY, JSON.stringify(newState));
  broadcastChange();
  return newState;
}

/**
 * Cancel emergency countdown
 */
export function cancelSOSCountdown() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(SOS_STATE_KEY);
  broadcastChange();
}

/**
 * Save active SOS alert state
 */
export function setActiveSOSAlert(alert, location) {
  if (typeof window === "undefined") return;

  const newState = {
    status: "active",
    startTime: null,
    durationSeconds: 0,
    activeAlert: alert,
    location: location || null
  };

  localStorage.setItem(SOS_STATE_KEY, JSON.stringify(newState));
  broadcastChange();
}

/**
 * Resolve active SOS alert (Mark Status: Guarded)
 */
export async function resolveActiveSOSAlert() {
  if (typeof window === "undefined") return;

  const currentState = getSOSState();
  if (currentState.activeAlert?.id) {
    try {
      await SOSAlert.update(currentState.activeAlert.id, {
        status: "resolved",
        resolved_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Failed to mark SOS alert resolved in database:", err);
    }
  }

  localStorage.removeItem(SOS_STATE_KEY);
  broadcastChange();
}

/**
 * Finalize emergency workflow when countdown hits 0
 */
export async function finalizeSOSWorkflow(contacts = []) {
  const currentState = getSOSState();
  
  // Set state to dispatching temporarily
  if (typeof window !== "undefined") {
    localStorage.setItem(SOS_STATE_KEY, JSON.stringify({
      ...currentState,
      status: "dispatching"
    }));
    broadcastChange();
  }

  try {
    const contactIds = Array.isArray(contacts) ? contacts.map(c => c.id || c) : [];
    const res = await triggerSOS(
      currentState.alertType || "manual_sos",
      `${currentState.message || "Emergency assistance needed"} [${currentState.source || "SOS"}]`,
      contactIds
    );

    const alert = res.alert;
    const location = res.location || { latitude: Number(alert.latitude), longitude: Number(alert.longitude) };

    setActiveSOSAlert(alert, location);
    return { alert, location };
  } catch (error) {
    console.error("SOS workflow execution error:", error);
    cancelSOSCountdown();
    throw error;
  }
}
