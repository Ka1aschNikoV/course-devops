const chai = require('chai');
const axios = require('axios');
const expect = chai.expect;

const SERVER_URL = 'http://localhost:8197/request';  // Keep the /request endpoint


describe('Server Put State Tests', () => {
    afterEach(done => {
        new Promise(resolve => setTimeout(resolve, 2000))
            .then(() => done()) // Call done() once the promise resolves
            .catch(err => done(err)); // Pass any errors to done()
    });


    it('should return 201 status code for /state', async () => {
        const response = await axios.get(SERVER_URL)
        expect(response.status).to.equal(201, 'Expected status code 201');
    });

    it('should have Content-Type text/plain', async () => {
        const response = await axios.get(SERVER_URL)
        expect(response.headers['content-type']).to.include('text/plain', 'Expected Content-Type to be text/plain');
    });
    
    it('should be in Init state before login from nginx', async () => {
        const state = await getServerState();
        expect(state).to.equal('INIT', 'Expected server to be in INIT state before login');
    });

    it('should be in Running state when the server is online and operational', async () => {
        const state = await getServerState();
        expect(state).to.deep.equal('RUNNING', 'Expected server to be in RUNNING state when online');
    });

    it('should be in Paused state when the server is paused but online', async () => {
        const state = await getServerState();
        expect(state).to.equal('PAUSED', 'Expected server to be in PAUSED state when paused');
    });

    it('should be in Shutdown state after receiving a shutdown command', async () => {
        const state = await getServerState();
        expect(state).to.equal('SHUTDOWN', 'Expected server to be in SHUTDOWN state after shutdown');
    });
});