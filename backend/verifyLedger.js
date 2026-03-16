const { connect, parseChainResult } = require('./gatewayConnection');

async function verify() {
    let gateway, client;
    try {
        const { contract, gateway: gway, client: cl } = await connect();
        gateway = gway;
        client = cl;

        console.log('--- Current Ledger Data ---');

        console.log('\n[Patients]');
        const patients = parseChainResult(await contract.evaluateTransaction('GetAllPatients'));
        console.table(patients.map(p => ({ ID: p.id, Blood: p.bloodType, Organ: p.organNeeded, Status: p.status })));

        console.log('\n[Donors]');
        const donors = parseChainResult(await contract.evaluateTransaction('GetAllDonors'));
        console.table(donors.map(d => ({ ID: d.id, Blood: d.bloodType, Organs: d.organsAvailable.join(', '), Status: d.verificationStatus })));

        console.log('\n[Hospitals]');
        const hospitals = ['ADMIN-HOSP', 'HOS1'];
        for (const id of hospitals) {
            try {
                const h = parseChainResult(await contract.evaluateTransaction('GetHospital', id));
                console.log(`- ${id}: ${h.name} (${h.location})`);
            } catch (e) {
                console.log(`- ${id}: NOT FOUND`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (gateway) gateway.close();
        if (client) client.close();
    }
}

verify();
