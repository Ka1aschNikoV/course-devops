const chai = require('chai');
const axios = require('axios');
const expect = chai.expect;

const SERVER_URL = 'http://localhost:8098/state';

// Function to query the server state
async function getServerState() {
    try {
        const response = await axios.get(SERVER_URL);
        
        return response.data.state; // Assuming the API returns { state: "Running" } or similar
    } catch (error) {
        throw new Error(`Failed to query server state: ${error.message}`);
    }
}

describe('Server State Tests', () => {
    it('should be in Init state before login from nginx', async () => {
        const state = await getServerState();
        expect(state).to.equal({state: 'Init'}, 'Expected server to be in Init state before login');
    });

    it('should be in Running state when the server is online and operational', async () => {
        const state = await getServerState();
        expect(state).to.deep.equal({state: 'Running'}, 'Expected server to be in Running state when online');
    });

    it('should be in Paused state when the server is paused but online', async () => {
        const state = await getServerState();
        expect(state).to.equal({state: 'Paused'}, 'Expected server to be in Paused state when paused');
    });

    it('should be in Shutdown state after receiving a shutdown command', async () => {
        const state = await getServerState();
        expect(state).to.equal({state: 'Shutdown'}, 'Expected server to be in Shutdown state after shutdown');
    });
});
