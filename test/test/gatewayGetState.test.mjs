import { expect } from 'chai';
import axios from 'axios';

const SERVER_URL = 'http://nginx:8197/state';



// Function to query the server state
async function getServerState() {
    try {
        const response = await axios.get(SERVER_URL, {
            auth: {
                username: 'user1',
                password: 'your_mom',
            }
        })
        
        return response.data;  // Since response is plain text (not JSON), directly return it
    } catch (error) {
        throw new Error(`Failed to query server state: ${error.message}`);
    }
}

/*
 * Tests for http://nginx:8197/state endpoint GET requests
 */
describe('Server State Tests', () => {
    afterEach(done => {
        new Promise(resolve => setTimeout(resolve, 3400))
            .then(() => done()) // Call done() once the promise resolves
            .catch(err => done(err)); // Pass any errors to done()
    });

    

    it('should be in Init state before login from nginx', async () => {
        const state = await getServerState();
        expect(state).to.equal('INIT', 'Expected server to be in INIT state before login');
    });
    
    it('should return 200 status code for /state', async () => {
        const response = await axios.get(SERVER_URL, {
            auth: {
                username: 'user1',
                password: 'your_mom',
            }
        })
        expect(response.status).to.equal(200, 'Expected status code 200');
    });

    it('should have Content-Type text/plain', async () => {
        const response = await axios.get(SERVER_URL, {
            auth: {
                username: 'user1',
                password: 'your_mom',
            }
        })
        expect(response.headers['content-type']).to.include('text/plain', 'Expected Content-Type to be text/plain');
    });
    
    
    

});

