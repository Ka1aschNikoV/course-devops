import { expect } from 'chai';
import axios from 'axios';
 
const SERVER_URL = 'http://nginx:8197/state'; 
const username = 'user1';
const password = 'your_mom';
const base64Auth = btoa(username + ':' + password);


/*
 * Tests for http://nginx:8197/state endpoint PUT requests
 */
describe('Server Put State Tests', () => {
    afterEach(done => {
        new Promise(resolve => setTimeout(resolve, 3400))
            .then(() => done()) // Call done() once the promise resolves
            .catch(err => done(err)); // Pass any errors to done()
    });



    it('should not respond if state is INIT and state change is attempted', async () => {
        try {
            const response = await axios.put(SERVER_URL, "RUNNING", {
                headers: {
                    'Content-Type': 'text/plain',  // Specify the content type
                }
            })
            expect(response.status).to.equal(403, 'Expected status code 403');
        }
        catch (error) {
            // If an error occurs (e.g., 503 response), we expect the 503 status to indicate the system is paused
            expect(error.response.status).to.equal(403, 'Expected status code 403');
        }
        
    });
    it('should respond if user is logged in', async () => {
        const response = await axios.get("http://nginx:8198/controlpanel.html", {
            auth: {
                username: 'user1',
                password: 'your_mom',
            }
        })
        expect(response.status).to.equal(200, 'Expected status code 200');
    });

    it('should return 200 status code for /state', async () => {
        const response = await axios.get(SERVER_URL, {
        })
        expect(response.status).to.equal(200, 'Expected status code 200');
        
    });

    it('should be RUNNING automatically after login event', async () => {
        const response = await axios.get(SERVER_URL, {
        });
        expect(response.data).to.equal('RUNNING', 'Expected server to be in RUNNING state automatically');
        
    });

    it('should have Content-Type text/plain', async () => {
        const response = await axios.get(SERVER_URL, {
        })
        expect(response.headers['content-type']).to.include('text/plain', 'Expected Content-Type to be text/plain');
    });
    
    it('should be in RUNNING state after setting it to RUNNING', async () => {
        
        const response = await axios.put(SERVER_URL, 'RUNNING', {
            headers: {
                'Content-Type': 'text/plain',
                'Authorization': `Basic ${base64Auth}`, 
                'X-Authenticated-User': 'user1' 
            },
        });
        expect(response.status).to.equal(200, 'Expected server to be in RUNNING state');
            
    });

    it('should be in RUNNING', async () => {

        const response = await axios.get(SERVER_URL, {
        })
        const state = response.data; 
        expect(state).to.equal('RUNNING', 'Expected server to be in RUNNING state');

    });

    it('should be in PAUSED state after setting it to PAUSED', async () => {
        const response = await axios.put(SERVER_URL, 'PAUSED',{
            headers: {
                'Content-Type': 'text/plain',
                'Authorization': `Basic ${base64Auth}`,
                'X-Authenticated-User': 'user1'
            },
        })
        expect(response.status).to.equal(200, 'Expected server to be PAUSED');
    });

    it('should not be operational in PAUSED (container is paused)', async function () {
        try {
            const response = await axios.get(SERVER_URL, {})
            expect(response.status).to.equal(503, 'Expected status code 503');
        }
        catch (error) {
            expect(error.response.status).to.equal(503, 'Expected status code 503');
        }
    });
    

    it('should be in RUNNING state after setting it to RUNNING', async () => {
        await axios.put(SERVER_URL, 'RUNNING',{
            headers: {
                'Content-Type': 'text/plain',
                'Authorization': `Basic ${base64Auth}`, 
                'X-Authenticated-User': 'user1'
            },
        })
        const response = await axios.get(SERVER_URL, {
        })
        const state = response.data;  
        expect(state).to.equal('RUNNING', 'Expected server to be in RUNNING state');
    });

    it('should be operational in RUNNING', async () => {
        const response = await axios.get(SERVER_URL, {
        })
        expect(response.status).to.equal(200, 'Expected server to be operable when RUNNING');
    });

    it('should be resetted when RUNNING -> INIT', async () => {
        const response = await axios.put(SERVER_URL, 'INIT',{
            headers: {
                'Content-Type': 'text/plain',
                'Authorization': `Basic ${base64Auth}`,
                'X-Authenticated-User': 'user1'
            },
        })
        const state = response.data;  // Extract the data from the response
        expect(state).to.equal('INIT', 'Expected server to be in INIT state');
        const responseLogs = await axios.get("http://nginx:8197/run-log")
        expect(responseLogs.data).to.not.equal("", "Expected logs to not be wiped")

    });

    /*
     * SHUTDOWN test, excluded to avoid pipeline side-effects
     *
     * it('should be in SHUTDOWN state after setting it to SHUTDOWN', async () => {
        const response = await axios.put(SERVER_URL, 'SHUTDOWN',{
            headers: {
                'Content-Type': 'text/plain',
                'Authorization': `Basic ${base64Auth}`, // Include the Basic Auth header
                'X-Authenticated-User': 'user1' // Optionally send the user info as a custom header
            },
        })
        expect(response.status).to.equal(200, 'Expected server to be SHUTDOWN');
    });*/

});
