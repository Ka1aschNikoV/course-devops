import { expect } from 'chai';
import axios from 'axios';
    
const SERVER_URL = 'http://nginx:8197/run-log';
const getAuthHeader = (username, password) => {
    const credentials = `${username}:${password}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
};

const AUTH_HEADER = getAuthHeader('user1', 'your_mom');


/*
 * Tests for http://nginx:8197/run-log endpoint
 */
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
    
});
