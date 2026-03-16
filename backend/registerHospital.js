const { connect, hashPassword } = require('./gatewayConnection');

async function registerHospital(id, name, password, location) {
    let gateway, client;
    try {
        const { contract, gateway: gway, client: cl } = await connect();
        gateway = gway;
        client = cl;

        console.log(`--- Registering Hospital: ${id} ---`);
        await contract.submitTransaction('RegisterHospital', id, name, hashPassword(password), location);
        console.log(`✅ Hospital ${id} successfully registered.`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (gateway) gateway.close();
        if (client) client.close();
    }
}

const args = process.argv.slice(2);
if (args.length < 4) {
    console.log('Usage: node registerHospital.js <ID> <Name> <Password> <Location>');
} else {
    registerHospital(...args);
}
