const { connect } = require('./gatewayConnection');

async function resetLedger() {
    let gateway, client;
    try {
        const { contract, gateway: gway, client: cl } = await connect();
        gateway = gway;
        client = cl;

        console.log('--- Resetting Ledger (4x4 Initial Data) ---');
        await contract.submitTransaction('ClearLedger');
        await contract.submitTransaction('InitLedger');
        console.log('✅ Ledger successfully re-seeded with 4 Patients and 4 Donors.');

    } catch (error) {
        console.error('❌ Error resetting ledger:', error.message);
    } finally {
        if (gateway) gateway.close();
        if (client) client.close();
    }
}

resetLedger();
