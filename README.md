# Decentralized Donation Platform 🏥

Blockchain-based application designed to bring transparency, security, and efficiency to the organ donation process. Built on **Hyperledger Fabric**, it ensures tamper-proof records for donors, patients, and transplants.

## 🚀 Features

- **Decentralized Registry**: Immutable record of all donors and patients.
- **Self-Registration**: Donors can register securely via IPFS-backed forms.
- **Hospital Verification**: Authorized medical personnel verify donor claims.
- **Smart Matching**: Automated, weighted algorithm for fair organ allocation (HLA + Waitlist + Blood Type).
- **Privacy First**: Sensitive medical data stored off-chain (IPFS), with hash pointers on-chain.

## 🛠️ Technology Stack

- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Node.js + Express
- **Blockchain**: Hyperledger Fabric (Go Chaincode)
- **Storage**: Web3.Storage (IPFS)

## 📋 Prerequisites

- **Docker** & Docker Compose
- **Node.js** (v18+)
- **Go** (v1.19+)
- **Hyperledger Fabric Samples ** (Test Network)

## ⚡ Quick Start

### 1. Start the Blockchain Network
```bash
cd fabric-samples/test-network
./network.sh up createChannel -c organchannel -ca
./network.sh deployCC -ccn organchain -ccp ../../chaincode/organchain -ccl go -c organchannel
```

### 2. Start the Backend API
```bash
cd backend
npm install
export WEB3_STORAGE_TOKEN="your_ipfs_token" # Optional: For file uploads
npm start
```

### 3. Start the Frontend
```bash
# In a new terminal
npm install
npm run dev
```

Visit `http://localhost:5173` to access the application.

## 🧪 Testing the Flow

1.  **Register**: As a public user, sign up as a Donor (Data saves to IPFS -> Chain).
2.  **Verify**: Log in as Hospital (`HOSP-APOLLO`), verify the new donor.
3.  **Match**: Go to Matching tab, run the engine for a patient, and approve the best match.

## 📄 Documentation

For a deep dive into the architecture and logic, see the [Project Report](./PROJECT_REPORT.md).

## 📄 License

This project is open-source and available under the MIT License.
