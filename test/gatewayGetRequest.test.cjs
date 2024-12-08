const chai = require('chai');
const axios = require('axios');
const expect = chai.expect;

const SERVER_URL = 'http://localhost:8197/request';  // Keep the /state endpoint

// Function to query the server state
async function getRequest() {
    try {
        const response = await axios.get(SERVER_URL);
        return {
            state: response.data
        }
        return response.data;  // Since response is plain text (not JSON), directly return it
    } catch (error) {
        throw new Error(`Failed to query server state: ${error.message}`);
    }
}

describe('Request Response Tests', () => {
    it('should return 200 status code for /request', async () => {
        const response = await axios.get(SERVER_URL);
        expect(response.status).to.equal(200, 'Expected status code 200');
    });

    it('should have Content-Type text/plain', async () => {
        const response = await axios.get(SERVER_URL);
        expect(response.headers['content-type']).to.include('text/plain', 'Expected Content-Type to be text/plain');
    });

    it('should contain service1 and service2 fields', async () => {
        const response = await axios.get(SERVER_URL);
        const body = response.data;
        expect(body).to.include('service1:', 'Response should include service1 field');
        expect(body).to.include('service2:', 'Response should include service2 field');
    });

    it('should have valid subfields for service1', async () => {
        const response = await axios.get(SERVER_URL);
        const body = response.data;

        // Example parsing plain text to extract service1 subfields
        const service1Match = body.match(/service1:\s*(.*)/);
        expect(service1Match).to.not.be.null;
        const service1Fields = service1Match[1].split('\n');
        expect(service1Fields).to.include('state: Running', 'service1 state should be Running');
        expect(service1Fields).to.include('uptime:', 'service1 should have uptime field');
    });

    it('should have valid subfields for service2', async () => {
        const response = await axios.get(SERVER_URL);
        const body = response.data;

        // Example parsing plain text to extract service2 subfields
        const service2Match = body.match(/service2:\s*(.*)/);
        expect(service2Match).to.not.be.null;
        const service2Fields = service2Match[1].split('\n');
        expect(service2Fields).to.include('state: Stopped', 'service2 state should be Stopped');
        expect(service2Fields).to.include('last-checked:', 'service2 should have last-checked field');
    });

    it('should handle missing fields gracefully', async () => {
        const response = await axios.get(SERVER_URL);
        const body = response.data;

        // Simulate a missing field scenario
        expect(body).to.not.include('unknownField', 'Response should not include unknownField');
    });
});
