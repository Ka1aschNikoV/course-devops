const chai = require('chai');
const axios = require('axios');
const expect = chai.expect;

const SERVER_URL = 'http://localhost:8197/state';  // Keep the /state endpoint


describe.skip('Server Put State Tests', () => {
    afterEach(done => {
        new Promise(resolve => setTimeout(resolve, 2000))
            .then(() => done()) // Call done() once the promise resolves
            .catch(err => done(err)); // Pass any errors to done()
    });


    it('should return 200 status code for /state', async () => {
        const response = await axios.get(SERVER_URL)
        expect(response.status).to.equal(200, 'Expected status code 200');
    });

    it('should have Content-Type text/plain', async () => {
        const response = await axios.get(SERVER_URL)
        expect(response.headers['content-type']).to.include('text/plain', 'Expected Content-Type to be text/plain');
    });
    
    it('should be in RUNNING state after setting it to RUNNING', async () => {
        await axios.put(SERVER_URL, 'RUNNING',{
            headers: {
                'Content-Type': 'text/plain',
            },
        })
        const state = await axios.get(SERVER_URL)
        expect(state).to.equal('RUNNING', 'Expected server to be in RUNNING state');
    });

    it('should be in PAUSED state after setting it to PAUSED', async () => {
        await axios.put(SERVER_URL, 'PAUSED',{
            headers: {
                'Content-Type': 'text/plain',
            },
        })
        const state = await axios.get(SERVER_URL)
        expect(state).to.equal('PAUSED', 'Expected server to be in PAUSED state after pause');
    });

    it('should not be operational in PAUSED', async () => {
        const state = await axios.get(SERVER_URL)
        expect(state.response).to.equal(503, 'Expected server to be inoperable when paused');
    });

    it('should be in RUNNING state after setting it to RUNNING', async () => {
        await axios.put(SERVER_URL, 'RUNNING',{
            headers: {
                'Content-Type': 'text/plain',
            },
        })
        const state = await axios.get(SERVER_URL)
        expect(state).to.equal('RUNNING', 'Expected server to be in RUNNING state');
    });

    it('should be operational in RUNNING', async () => {
        const state = await axios.get(SERVER_URL)
        expect(state.response).to.equal(200, 'Expected server to be inoperable when paused');
    });

    it('should be in SHUTDOWN state after setting it to SHUTDOWN', async () => {
        await axios.put(SERVER_URL, 'SHUTDOWN',{
            headers: {
                'Content-Type': 'text/plain',
            },
        })
        const state = await axios.get(SERVER_URL)
        expect(state).to.equal('SHUTDOWN', 'Expected server to be in RUNNING state');
    });

    it('should not be operational in SHUTDOWN', async () => {
        const state = await axios.get(SERVER_URL)
        expect(state.response).to.equal(503, 'Expected server to be inoperable when shutdown');
    });

});