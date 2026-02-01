const express = require('express');
const cors = require('cors');
const { connect, signers } = require('@hyperledger/fabric-gateway');
const grpc = require('@grpc/grpc-js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const CHANNEL_NAME = 'organchannel';
const CHAINCODE_NAME = 'organchain';
const MSP_ID = 'Org1MSP';
const PEER_ENDPOINT = 'localhost:7051';
const PEER_HOST_ALIAS = 'peer0.org1.example.com';

// Paths to crypto materials (relative to the fabric-samples/test-network)
const CRYPTO_PATH = path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com');
const KEY_DIR_PATH = path.join(CRYPTO_PATH, 'users', 'User1@org1.example.com', 'msp', 'keystore');
const CERT_PATH = path.join(CRYPTO_PATH, 'users', 'User1@org1.example.com', 'msp', 'signcerts', 'User1@org1.example.com-cert.pem');
const TLS_CERT_PATH = path.join(CRYPTO_PATH, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');

let gateway;
let contract;

// Initialize the Fabric Gateway connection
async function initFabric() {
    try {
        // Load credentials
        const tlsRootCert = fs.readFileSync(TLS_CERT_PATH);
        const credentials = grpc.credentials.createSsl(tlsRootCert);

        // Create gRPC client
        const client = new grpc.Client(PEER_ENDPOINT, credentials, {
            'grpc.ssl_target_name_override': PEER_HOST_ALIAS,
        });

        // Load user identity
        const certificate = fs.readFileSync(CERT_PATH).toString();
        const keyFiles = fs.readdirSync(KEY_DIR_PATH);
        const privateKeyPath = path.join(KEY_DIR_PATH, keyFiles[0]);
        const privateKeyPem = fs.readFileSync(privateKeyPath).toString();
        const privateKey = crypto.createPrivateKey(privateKeyPem);

        // Connect to gateway
        gateway = connect({
            client,
            identity: { mspId: MSP_ID, credentials: Buffer.from(certificate) },
            signer: signers.newPrivateKeySigner(privateKey),
            evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
            endorseOptions: () => ({ deadline: Date.now() + 15000 }),
            submitOptions: () => ({ deadline: Date.now() + 5000 }),
            commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
        });

        // Get network and contract
        const network = gateway.getNetwork(CHANNEL_NAME);
        contract = network.getContract(CHAINCODE_NAME);

        console.log('✅ Connected to Fabric network');
        return true;
    } catch (error) {
        console.error('❌ Failed to connect to Fabric:', error.message);
        return false;
    }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', connected: !!contract });
});

// Initialize ledger with sample data
app.post('/api/init', async (req, res) => {
    try {
        await contract.submitTransaction('InitLedger');
        res.json({ success: true, message: 'Ledger initialized with sample data' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper to parse chaincode results safely
function parseChainResult(result) {
    try {
        // Handle Buffer/Uint8Array from Fabric Gateway
        let str;
        if (result instanceof Uint8Array || Buffer.isBuffer(result)) {
            str = new TextDecoder().decode(result);
        } else {
            str = result.toString();
        }

        if (!str || str === 'null' || str === '') return [];
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) {
            return parsed.filter(item => item !== null);
        }
        return parsed || [];
    } catch (e) {
        console.error('Parse error:', e.message);
        return [];
    }
}

// Get all patients
app.get('/api/patients', async (req, res) => {
    try {
        const result = await contract.evaluateTransaction('GetAllPatients');
        res.json(parseChainResult(result));
    } catch (error) {
        console.error('Error getting patients:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single patient
app.get('/api/patients/:id', async (req, res) => {
    try {
        const result = await contract.evaluateTransaction('GetPatient', req.params.id);
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Create patient
app.post('/api/patients', async (req, res) => {
    try {
        const { id, nameHash, bloodType, hla, organNeeded, ipfsHash, hospitalId } = req.body;
        await contract.submitTransaction(
            'CreatePatient',
            id,
            nameHash,
            bloodType,
            hla,
            organNeeded,
            ipfsHash,
            hospitalId
        );
        res.json({ success: true, id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all donors
app.get('/api/donors', async (req, res) => {
    try {
        const result = await contract.evaluateTransaction('GetAllDonors');
        res.json(parseChainResult(result));
    } catch (error) {
        console.error('Error getting donors:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single donor
app.get('/api/donors/:id', async (req, res) => {
    try {
        const result = await contract.evaluateTransaction('GetDonor', req.params.id);
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Create donor
app.post('/api/donors', async (req, res) => {
    try {
        const { id, bloodType, hla, organsAvailable, ipfsHash, consentHash } = req.body;
        await contract.submitTransaction(
            'CreateDonor',
            id,
            bloodType,
            hla,
            JSON.stringify(organsAvailable),
            ipfsHash,
            consentHash
        );
        res.json({ success: true, id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create match
app.post('/api/matches', async (req, res) => {
    try {
        const { id, patientId, donorId, organType, hlaScore, approvedBy } = req.body;
        await contract.submitTransaction(
            'CreateMatch',
            id,
            patientId,
            donorId,
            organType,
            hlaScore,
            approvedBy
        );
        res.json({ success: true, id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update patient status
app.patch('/api/patients/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await contract.submitTransaction('UpdatePatientStatus', req.params.id, status);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3001;

initFabric().then((connected) => {
    app.listen(PORT, () => {
        console.log(`🚀 OrganChain Backend API running on port ${PORT}`);
        if (!connected) {
            console.log('⚠️  Running in disconnected mode - Fabric connection failed');
        }
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    if (gateway) {
        gateway.close();
    }
    process.exit(0);
});
