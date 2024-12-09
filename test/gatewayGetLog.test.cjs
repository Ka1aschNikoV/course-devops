const chai = require('chai');
const axios = require('axios');
const expect = chai.expect;

const SERVER_URL = 'http://localhost:8197/run-log';  // Keep the /request endpoint

describe('Server Log Tests', () => {
    afterEach(done => {
        new Promise(resolve => setTimeout(resolve, 2000))
            .then(() => done()) // Call done() once the promise resolves
            .catch(err => done(err)); // Pass any errors to done()
    });


    it('should return 200 status code for /run-log', async () => {
        const response = await axios.get(SERVER_URL)
        expect(response.status).to.equal(200, 'Expected status code 200');
    });
    it('should have Content-Type text/plain', async () => {
        const response = await axios.get(SERVER_URL);
        expect(response.headers['content-type']).to.include('text/plain', 'Expected Content-Type to be text/plain');
    });
    it('response should not be empty', async () => {
        const response = await axios.get(SERVER_URL);
        expect(response.data).to.not.be.empty
    });
});