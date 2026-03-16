'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require("body-parser");
const session = require('express-session');
const path = require('path');
const { connect, parseChainResult } = require('./gatewayConnection');

const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'static')));
app.use(session({
    secret: 'organchain-secret',
    resave: true,
    saveUninitialized: true
}));

let gateway, client, contract;

// --- FABRIC CONNECTION ---
async function startServer() {
    try {
        const connection = await connect();
        gateway = connection.gateway;
        client = connection.client;
        contract = connection.contract;
        console.log('✅ Connected to Fabric network');

        app.listen(PORT, () => {
            console.log(`🚀 OrganChain API Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to connect to Fabric:', error.message);
        process.exit(1);
    }
}

// --- REST API ENDPOINTS ---

app.get('/api/health', (req, res) => res.json({ status: 'ok', connected: !!contract }));

app.get('/api/patients', async (req, res) => {
    try {
        const result = await contract.evaluateTransaction('GetAllPatients');
        res.json(parseChainResult(result));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/donors', async (req, res) => {
    try {
        const result = await contract.evaluateTransaction('GetAllDonors');
        res.json(parseChainResult(result));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { hospitalId, passwordHash } = req.body;
        const result = await contract.evaluateTransaction('AuthenticateHospital', hospitalId, passwordHash);
        res.json({ success: true, hospital: parseChainResult(result) });
    } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

app.post('/api/patients', async (req, res) => {
    try {
        const { id, nameHash, bloodType, hla, organNeeded, hospitalId } = req.body;
        await contract.submitTransaction('CreatePatient', id, nameHash, bloodType, hla, organNeeded, '', hospitalId);
        res.json({ success: true, id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/donors', async (req, res) => {
    try {
        const { id, name, email, phone, bloodType, hla, organsAvailable, consentHash } = req.body;
        await contract.submitTransaction('CreateDonor', id, name || '', email || '', phone || '', bloodType, hla, JSON.stringify(organsAvailable), '', consentHash);
        res.json({ success: true, id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/matches', async (req, res) => {
    try {
        const { id, patientId, donorId, organType, hlaScore, approvedBy } = req.body;
        await contract.submitTransaction('CreateMatch', id, patientId, donorId, organType, hlaScore, approvedBy);
        res.json({ success: true, id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/donors/:id/status', async (req, res) => {
    try {
        await contract.submitTransaction('UpdateDonorStatus', req.params.id, req.body.organToRemove);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/donors/:id/verify', async (req, res) => {
    try {
        const { hospitalId, status } = req.body;
        await contract.submitTransaction('VerifyDonor', req.params.id, hospitalId, status);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- LEGACY INDRIYA ROUTES (Simplified) ---

app.get('/', (req, res) => res.render('login'));

app.post('/auth', (req, res) => {
    const { username, password } = req.body;
    if ((username === process.env.ADMIN_ID && password === process.env.ADMIN_KEY) ||
        (username === process.env.HOS_ID && password === process.env.HOS_KEY)) {
        req.session.loggedin = true;
        req.session.username = username;
        return res.redirect(username === process.env.ADMIN_ID ? '/admin' : '/hos');
    }
    res.send('Incorrect Username and/or Password!');
});

app.get('/logout', (req, res) => {
    req.session.loggedin = false;
    res.redirect('/');
});

app.get('/admin', (req, res) => {
    if (req.session.loggedin && req.session.username === process.env.ADMIN_ID) return res.render('admin');
    res.status(401).send('Unauthorized');
});

app.get('/hos', (req, res) => {
    if (req.session.loggedin && req.session.username === process.env.HOS_ID) return res.render('hospital');
    res.status(401).send('Unauthorized');
});

// Start Server
startServer();

// Graceful shutdown
process.on('SIGINT', () => {
    if (gateway) gateway.close();
    if (client) client.close();
    process.exit(0);
});