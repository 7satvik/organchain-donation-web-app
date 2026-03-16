'use strict';

require('dotenv').config();
const { connect, signers } = require('@hyperledger/fabric-gateway');
const grpc = require('@grpc/grpc-js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CHANNEL_NAME = process.env.CHANNEL_NAME || 'organchannel';
const CHAINCODE_NAME = process.env.CHAINCODE_NAME || 'organchain';
const MSP_ID = process.env.MSP_ID || 'Org1MSP';
const PEER_ENDPOINT = process.env.PEER_ENDPOINT || 'localhost:7051';
const PEER_HOST_ALIAS = process.env.PEER_HOST_ALIAS || 'peer0.org1.example.com';

const CERT_PATH = path.resolve(__dirname, process.env.CERT_PATH || '../fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts/cert.pem');
const KEY_DIR_PATH = path.resolve(__dirname, '../fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore');
const TLS_CERT_PATH = path.resolve(__dirname, process.env.TLS_CERT_PATH || '../fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt');

/**
 * Connect to the Fabric gateway
 */
async function connectToGateway() {
    const tlsRootCert = fs.readFileSync(TLS_CERT_PATH);
    const credentials = grpc.credentials.createSsl(tlsRootCert);
    const client = new grpc.Client(PEER_ENDPOINT, credentials, { 'grpc.ssl_target_name_override': PEER_HOST_ALIAS });

    const certificate = fs.readFileSync(CERT_PATH).toString();
    const keyFiles = fs.readdirSync(KEY_DIR_PATH);
    const privateKeyPem = fs.readFileSync(path.join(KEY_DIR_PATH, keyFiles[0])).toString();
    const privateKey = crypto.createPrivateKey(privateKeyPem);

    const gateway = connect({
        client,
        identity: { mspId: MSP_ID, credentials: Buffer.from(certificate) },
        signer: signers.newPrivateKeySigner(privateKey),
    });

    const network = gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);

    return { gateway, client, contract };
}

/**
 * Hash password using SHA-256 (matches frontend)
 */
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Utility to parse chaincode results
 */
function parseChainResult(result) {
    if (!result || result.length === 0) return null;
    return JSON.parse(new TextDecoder().decode(result));
}

module.exports = {
    connect: connectToGateway,
    hashPassword,
    parseChainResult
};
