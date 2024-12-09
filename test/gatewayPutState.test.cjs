const chai = require('chai');
const axios = require('axios');
const expect = chai.expect;

const SERVER_URL = 'http://localhost:8197/state';  // Keep the /state endpoint


describe('Server Put State Tests', () => {
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
        // Sending the PUT request with 'RUNNING' state
        await axios.put(SERVER_URL, 'RUNNING', {
            headers: {
                'Content-Type': 'text/plain',  // Specify the content type
            },
        });
    
        // Get the current state after the PUT request
        const response = await axios.get(SERVER_URL);
        const state = response.data;  // Extract the data from the response
        expect(state).to.equal('RUNNING', 'Expected server to be in RUNNING state');
    });

    it('should be in PAUSED state after setting it to PAUSED', async () => {
        await axios.put(SERVER_URL, 'PAUSED',{
            headers: {
                'Content-Type': 'text/plain',
            },
        })
        try {
            // Attempting to access /run-log while in PAUSED state
            const response = await axios.get(SERVER_URL);
            
            // Check if the response status is 503, as expected when the system is paused
            expect(response.status).to.equal(503, 'Expected server to be inoperable when paused');
        } catch (error) {
            // If an error occurs (e.g., 503 response), we expect the 503 status to indicate the system is paused
            expect(error.response.status).to.equal(503, 'Expected server to return 503 when paused');
        }
    });

    it('should not be operational in PAUSED', async () => {
        try {
            // Attempting to access /run-log while in PAUSED state
            const response = await axios.get("http://localhost:8196/run-log");
            
            // Check if the response status is 503, as expected when the system is paused
            expect(response.status).to.equal(503, 'Expected server to be inoperable when paused');
        } catch (error) {
            // If an error occurs (e.g., 503 response), we expect the 503 status to indicate the system is paused
            expect(error.response.status).to.equal(503, 'Expected server to return 503 when paused');
        }
    });
    

    it('should be in RUNNING state after setting it to RUNNING', async () => {
        await axios.put(SERVER_URL, 'RUNNING',{
            headers: {
                'Content-Type': 'text/plain',
            },
        })
        const response = await axios.get(SERVER_URL);
        const state = response.data;  // Extract the data from the response
        expect(state).to.equal('RUNNING', 'Expected server to be in RUNNING state');
    });

    it('should be operational in RUNNING', async () => {
        const response = await axios.get(SERVER_URL)
        expect(response.status).to.equal(200, 'Expected server to be inoperable when paused');
    });

    it('should be in SHUTDOWN state after setting it to SHUTDOWN', async () => {
        await axios.put(SERVER_URL, 'SHUTDOWN',{
            headers: {
                'Content-Type': 'text/plain',
            },
        })
        try {
            // Attempting to access /run-log while in SHUTDOWN state
            const response = await axios.get(SERVER_URL);
            
            // Check if the response status is 503, as expected when the system is shutdown
            expect(response.status).to.equal(503, 'Expected server to be inoperable when shutdown');
        } catch (error) {
            // If an error occurs (e.g., 503 response), we expect the 503 status to indicate the system is shutdown
            expect(error.response.status).to.equal(503, 'Expected server to return 503 when shutdown');
        }
    });

    it('should not be operational in SHUTDOWN', async () => {
        try {
            // Attempting to access /run-log while in PAUSED state
            const response = await axios.get("http://localhost:8196/run-log");
            
            // Check if the response status is 503, as expected when the system is shutdown
            expect(response.status).to.equal(503, 'Expected server to be inoperable when shutdown');
        } catch (error) {
            // If an error occurs (e.g., 503 response), we expect the 503 status to indicate the system is shutdown
            expect(error.response.status).to.equal(503, 'Expected server to return 503 when shutdown');
        }
    });

});