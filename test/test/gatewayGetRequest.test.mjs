import { expect } from 'chai';
import axios from 'axios';



const SERVER_URL = 'http://nginx:8197/request';
const username = 'user1';
const password = 'your_mom';
const base64Auth = btoa(username + ':' + password);

/*
 * Tests for http://nginx:8197/request endpoint
 */
describe('Request Response Tests', () => {

    afterEach(done => {
        new Promise(resolve => setTimeout(resolve, 3400))
            .then(() => done()) // Call done() once the promise resolves
            .catch(err => done(err)); // Pass any errors to done()
    });

    it('should return 200 status code for /request', async () => {
        const response = await axios.get(SERVER_URL, {
        })
        expect(response.status).to.equal(200, 'Expected status code 200');
    });

    it('should have Content-Type text/plain', async () => {
        const response = await axios.get(SERVER_URL, {
        })
        expect(response.headers['content-type']).to.include('text/plain', 'Expected Content-Type to be text/plain');
    });

    it('should contain service1 and service2 fields', async () => {
        const response = await axios.get(SERVER_URL, { 
        })
        const body = response.data;
        expect(body).to.include('service1');
        expect(body).to.include('service2');
    });

    it('should have valid subfields for service1', async () => {
        const response = await axios.get(SERVER_URL, {
        })
        const body = response.data;
        
        expect(body).to.include('ip');
        expect(body).to.include('processes');
        expect(body).to.include('disk');
        expect(body).to.include('login');

    });

    it('should have valid subfields for service2', async () => {
        const response = await axios.get(SERVER_URL, {
        })
        const body = response.data;
        
        expect(body).to.include('ip');
        expect(body).to.include('processes');
        expect(body).to.include('disk');
        expect(body).to.include('login');
    });

    it('should have values for subfield keys in service1', async () => {
        const response = await axios.get(SERVER_URL, {
        })
        const body = response.data;
        const service1Content = body.split("service1:")
        const service1ContentSplit = service1Content[1].split('\n')
        service1ContentSplit.forEach(line => {
            const [key, value] = line.split(':');
            if (value) {
                expect(value.trim()).to.not.be.empty; // Ensure value is non-empty
            }
        });
    })

    it('should have values for subfield keys in service2', async () => {
        const response = await axios.get(SERVER_URL, {
        })
        const body = response.data;
        const service2Content = body.split("service2:")
        const service2ContentSplit = service2Content[1].split('\n')
        service2ContentSplit.forEach(line => {
            const [key, value] = line.split(':');
            if (value) {
                expect(value.trim()).to.not.be.empty; // Ensure value is non-empty
            }
        });
    })


    it('should handle missing fields gracefully', async () => {
        const response = await axios.get(SERVER_URL, {
        })
        const body = response.data;

        // Simulate a missing field scenario
        expect(body).to.not.include('unknownField', 'Response should not include unknownField');
    });
    it('should be resetted when RUNNING -> INIT', async () => {
        const response = await axios.put("http://nginx:8197/state", 'INIT',{
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
});



