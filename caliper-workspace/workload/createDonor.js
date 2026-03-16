'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class MyWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.txIndex = 0;
    }

    async submitTransaction() {
        this.txIndex++;
        const id = 'DON-BENCH-' + Date.now() + '-' + this.workerIndex + '-' + this.txIndex;

        const myArgs = {
            contractId: 'organchain',
            contractFunction: 'CreateDonor',
            invokerIdentity: 'User1',
            contractArguments: [
                id,
                'Donor ' + id, // name
                'donor' + id + '@example.com', // email
                '1234567890', // phone
                'O-', // bloodType
                'HLA-A2,B44', // hla
                JSON.stringify(['Kidney', 'Liver']), // organsAvailableJSON
                'Qm' + Math.random().toString(36).substring(7), // ipfsHash
                'consent-' + Math.random().toString(36).substring(7) // consentHash
            ],
            readOnly: false
        };

        await this.sutAdapter.sendRequests(myArgs);
    }
}

function createWorkloadModule() {
    return new MyWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
