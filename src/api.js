const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const api = {
    async getHealth() {
        return handleResponse(await fetch(`${API_BASE_URL}/health`));
    },
    async getPatients() {
        return handleResponse(await fetch(`${API_BASE_URL}/patients`));
    },
    async getDonors() {
        return handleResponse(await fetch(`${API_BASE_URL}/donors`));
    },
    async login(hospitalId, passwordHash) {
        return handleResponse(await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hospitalId, passwordHash })
        }));
    },
    async createPatient(patientData) {
        return handleResponse(await fetch(`${API_BASE_URL}/patients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patientData)
        }));
    },
    async createDonor(donorData) {
        return handleResponse(await fetch(`${API_BASE_URL}/donors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(donorData)
        }));
    },
    async createMatch(matchData) {
        return handleResponse(await fetch(`${API_BASE_URL}/matches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(matchData)
        }));
    },
    async updateDonorStatus(donorId, organToRemove) {
        return handleResponse(await fetch(`${API_BASE_URL}/donors/${donorId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ organToRemove })
        }));
    },
    async verifyDonor(donorId, hospitalId, status) {
        return handleResponse(await fetch(`${API_BASE_URL}/donors/${donorId}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hospitalId, status })
        }));
    }
};

export const BLOOD_COMPATIBILITY = {
    'O-': ['O-'],
    'O+': ['O+', 'O-'],
    'A-': ['A-', 'O-'],
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']
};

export const canReceiveFrom = (recipient, donor) => BLOOD_COMPATIBILITY[recipient]?.includes(donor) || false;
