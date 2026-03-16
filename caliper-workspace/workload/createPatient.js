'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class MyWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.txIndex = 0;
    }

    async submitTransaction() {
        this.txIndex++;
        const id = 'PAT-BENCH-' + Date.now() + '-' + this.workerIndex + '-' + this.txIndex;

        const myArgs = {
            contractId: 'organchain',
            contractFunction: 'CreatePatient',
            invokerIdentity: 'User1',
            contractArguments: [
                id,
                'hash-' + Math.random().toString(36).substring(7), // nameHash
                'A+', // bloodType
                'HLA-A2,B44', // hla
                'Kidney', // organNeeded
                'Qm' + Math.random().toString(36).substring(7), // ipfsHash
                'ADMIN-HOSP' // hospitalId
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
