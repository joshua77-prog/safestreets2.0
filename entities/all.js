import safetyReportsSeed from './safetyreports.json';
import emergencyContactsSeed from './emergencycontact.json';
import sosAlertSeed from './sosalert.json';

function readStore(key, seed) {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    // If the provided seed is not an array (e.g., a JSON schema object), default to []
    const initial = Array.isArray(seed) ? seed : [];
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
}

function writeStore(key, value) {
	localStorage.setItem(key, JSON.stringify(value));
}

function generateId(prefix) {
	return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export const SafetyReport = {
	async list(order = '-created_date') {
		const items = readStore('safety_reports', safetyReportsSeed);
		return [...items].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
	},
	async create(data) {
		const items = readStore('safety_reports', safetyReportsSeed);
		const newItem = {
			id: generateId('report'),
			created_date: new Date().toISOString(),
			...data
		};
		items.unshift(newItem);
		writeStore('safety_reports', items);
		return newItem;
	}
};

export const EmergencyContact = {
	async list() {
		return readStore('emergency_contacts', emergencyContactsSeed);
	},
	async create(data) {
		const items = readStore('emergency_contacts', emergencyContactsSeed);
		const newItem = { id: generateId('contact'), ...data };
		items.push(newItem);
		writeStore('emergency_contacts', items);
		return newItem;
	},
	async update(id, updates) {
		const items = readStore('emergency_contacts', emergencyContactsSeed);
		const idx = items.findIndex((i) => i.id === id);
		if (idx >= 0) {
			items[idx] = { ...items[idx], ...updates };
			writeStore('emergency_contacts', items);
			return items[idx];
		}
		return null;
	},
	async delete(id) {
		const items = readStore('emergency_contacts', emergencyContactsSeed);
		const filtered = items.filter((i) => i.id !== id);
		writeStore('emergency_contacts', filtered);
		return true;
	}
};

export const SOSAlert = {
	async list(order = '-created_date', limit = 10) {
		const items = readStore('sos_alerts', sosAlertSeed);
		const ordered = [...items].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
		return ordered.slice(0, limit);
	},
	async filter(query = {}, order = '-created_date', limit = 10) {
		const items = await this.list(order, 1000);
		const filtered = items.filter((i) => Object.entries(query).every(([k, v]) => i[k] === v));
		return filtered.slice(0, limit);
	},
	async create(data) {
		const items = readStore('sos_alerts', sosAlertSeed);
		const newItem = {
			id: generateId('alert'),
			status: 'active',
			created_date: new Date().toISOString(),
			...data
		};
		items.unshift(newItem);
		writeStore('sos_alerts', items);
		return newItem;
	},
	async update(id, updates) {
		const items = readStore('sos_alerts', sosAlertSeed);
		const idx = items.findIndex((i) => i.id === id);
		if (idx >= 0) {
			items[idx] = { ...items[idx], ...updates };
			writeStore('sos_alerts', items);
			return items[idx];
		}
		return null;
	}
};

export const User = {
	async me() {
		const raw = localStorage.getItem('current_user');
		if (raw) return JSON.parse(raw);
		const user = {
			id: 'me',
			full_name: 'Safe Streets User',
			email: 'user@example.com',
			role: 'user'
		};
		localStorage.setItem('current_user', JSON.stringify(user));
		return user;
	},
	async updateMyUserData(updates) {
		const user = await this.me();
		const merged = { ...user, ...updates };
		localStorage.setItem('current_user', JSON.stringify(merged));
		return merged;
	},
	async loginWithRedirect(returnTo) {
		// Simulate auth flow
		return true;
	}
};


