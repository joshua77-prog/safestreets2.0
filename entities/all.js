import safetyReportsSeed from './safetyreports.json';
import emergencyContactsSeed from './emergencycontact.json';
import sosAlertSeed from './sosalert.json';
import { supabase } from '../src/lib/supabase';

function readStore(key, seed) {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
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

async function getAuthUserId() {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (user?.id) return user.id;
		const { data: sessionData } = await supabase.auth.getSession();
		if (sessionData?.session?.user?.id) return sessionData.session.user.id;
		const localUser = localStorage.getItem('current_user');
		if (localUser) {
			const u = JSON.parse(localUser);
			if (u?.id && u.id !== 'me' && u.id !== 'guest') return u.id;
		}
		return null;
	} catch {
		return null;
	}
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
		const userId = await getAuthUserId();
		const localItems = readStore('emergency_contacts', emergencyContactsSeed);

		if (userId) {
			try {
				const { data, error } = await supabase
					.from('emergency_contacts')
					.select('*')
					.eq('user_id', userId)
					.order('created_at', { ascending: false });

				if (!error && Array.isArray(data)) {
					const dbMap = new Map();
					data.forEach((item) => {
						dbMap.set(item.id, {
							id: item.id,
							user_id: item.user_id,
							full_name: item.full_name || item.name || '',
							name: item.full_name || item.name || '',
							number: item.number || item.phone || '',
							phone: item.number || item.phone || '',
							relationship: item.relationship || 'other',
							is_primary: item.is_primary ?? false,
							notify_sms: item.notify_sms ?? true,
							notify_email: item.notify_email ?? true,
							created_at: item.created_at
						});
					});

					// Merge local items with database items so newly added local contacts also display
					localItems.forEach((item) => {
						if (!dbMap.has(item.id)) {
							dbMap.set(item.id, item);
						}
					});

					return Array.from(dbMap.values());
				}
			} catch (err) {
				console.warn("Supabase emergency_contacts read error:", err);
			}
		}

		return localItems;
	},

	async create(data) {
		const userId = await getAuthUserId();
		const fullName = data.full_name || data.name || '';
		const phoneNumber = data.number || data.phone || '';
		const relationship = data.relationship || 'other';

		let newContactItem = {
			id: generateId('contact'),
			user_id: userId || 'local',
			full_name: fullName,
			name: fullName,
			number: phoneNumber,
			phone: phoneNumber,
			relationship: relationship,
			is_primary: data.is_primary ?? false,
			notify_sms: data.notify_sms ?? true,
			notify_email: data.notify_email ?? true,
			created_at: new Date().toISOString()
		};

		if (userId) {
			try {
				const payload = {
					user_id: userId,
					full_name: fullName,
					number: phoneNumber,
					relationship: relationship
				};

				const { data: inserted, error } = await supabase
					.from('emergency_contacts')
					.insert(payload)
					.select()
					.single();

				if (!error && inserted) {
					newContactItem = {
						...newContactItem,
						id: inserted.id,
						user_id: inserted.user_id,
						full_name: inserted.full_name || fullName,
						name: inserted.full_name || fullName,
						number: inserted.number || phoneNumber,
						phone: inserted.number || phoneNumber,
						relationship: inserted.relationship || relationship,
						created_at: inserted.created_at || newContactItem.created_at
					};
				} else if (error) {
					console.warn("Supabase insert warning (persisting locally):", error);
				}
			} catch (err) {
				console.warn("Failed to insert emergency contact to Supabase:", err);
			}
		}

		// Always persist to localStore so screen updates instantly
		const items = readStore('emergency_contacts', emergencyContactsSeed);
		items.unshift(newContactItem);
		writeStore('emergency_contacts', items);
		return newContactItem;
	},

	async update(id, updates) {
		const userId = await getAuthUserId();
		const fullName = updates.full_name || updates.name;
		const phoneNumber = updates.number || updates.phone;
		const relationship = updates.relationship;

		if (userId && id) {
			try {
				const payload = {};
				if (fullName !== undefined) payload.full_name = fullName;
				if (phoneNumber !== undefined) payload.number = phoneNumber;
				if (relationship !== undefined) payload.relationship = relationship;

				if (Object.keys(payload).length > 0) {
					const { error } = await supabase
						.from('emergency_contacts')
						.update(payload)
						.eq('id', id)
						.eq('user_id', userId);

					if (error) {
						console.warn("Supabase update error:", error);
					}
				}
			} catch (err) {
				console.warn("Supabase update error:", err);
			}
		}

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
		const userId = await getAuthUserId();

		if (userId && id) {
			try {
				const { error } = await supabase
					.from('emergency_contacts')
					.delete()
					.eq('id', id)
					.eq('user_id', userId);

				if (error) {
					console.warn("Supabase delete error:", error);
				}
			} catch (err) {
				console.warn("Supabase delete error:", err);
			}
		}

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
		if (raw) {
			try { return JSON.parse(raw); } catch {}
		}
		return null;
	},
	async updateMyUserData(updates) {
		const current = (await this.me()) || {};
		const merged = { ...current, ...updates, isAuthenticated: true };
		localStorage.setItem('current_user', JSON.stringify(merged));
		return merged;
	},
	async logout() {
		localStorage.removeItem('current_user');
	},
	isAuthenticated() {
		const raw = localStorage.getItem('current_user');
		if (!raw) return false;
		try {
			const u = JSON.parse(raw);
			return !!u && (u.isAuthenticated === true || (!!u.id && u.id !== 'guest'));
		} catch {
			return false;
		}
	}
};
