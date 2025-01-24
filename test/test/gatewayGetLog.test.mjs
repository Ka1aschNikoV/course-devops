import { expect } from 'chai';
    import axios from 'axios';
       
    const SERVER_URL = 'http://nginx:8197/run-log';  // Keep the /request endpoint
const username = 'user1';
const password = 'your_mom';
const base64Auth = btoa(username + ':' + password);
    const getAuthHeader = (username, password) => {
        const credentials = `${username}:${password}`;
        return `Basic ${Buffer.from(credentials).toString('base64')}`;
    };

    const AUTH_HEADER = getAuthHeader('user1', 'your_mom');

    describe('Server Log Tests', () => {
        afterEach(done => {
            new Promise(resolve => setTimeout(resolve, 3400))
                .then(() => done()) // Call done() once the promise resolves
                .catch(err => done(err)); // Pass any errors to done()
        });


        it('should return 200 status code for /run-log', async () => {
            const response = await axios.get(SERVER_URL, {
                headers: {
                    Authorization: AUTH_HEADER,
                },
            })
            expect(response.status).to.equal(200, 'Expected status code 200');
        });
        it('should have Content-Type text/plain', async () => {
            const response = await axios.get(SERVER_URL, {
                headers: {
                    Authorization: AUTH_HEADER,
                },
            })
            expect(response.headers['content-type']).to.include('text/plain', 'Expected Content-Type to be text/plain');
        });
        it('response should not be empty', async () => {
            const response = await axios.get(SERVER_URL, {
                headers: {
                    Authorization: AUTH_HEADER,
                },
            })
            expect(response.data).to.not.be.empty
        });
        it('should be resetted when RUNNING -> INIT', async () => {
            const response = await axios.put("http://nginx:8197/state", 'INIT',{
                headers: {
                    'Content-Type': 'text/plain',
                    'Authorization': `Basic ${base64Auth}`, // Include the Basic Auth header
                    'X-Authenticated-User': 'user1' // Optionally send the user info as a custom header
                },
            })
            const state = response.data;  // Extract the data from the response
            expect(state).to.equal('INIT', 'Expected server to be in INIT state');
    
            const responseLogs = await axios.get("http://nginx:8197/run-log")
            expect(responseLogs.data).to.not.equal("", "Expected logs to not be wiped")
    
        });
    });
