const chai = require('chai');
const axios = require('axios');
const expect = chai.expect;

const SERVER_URL = 'http://localhost:8197/request';  // Keep the /request endpoint

describe('Request Response Tests', () => {

    afterEach(done => {
        new Promise(resolve => setTimeout(resolve, 2000))
            .then(() => done()) // Call done() once the promise resolves
            .catch(err => done(err)); // Pass any errors to done()
    });

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
        expect(body).to.include('service1');
        expect(body).to.include('service2');
    });

    it('should have valid subfields for service1', async () => {
        const response = await axios.get(SERVER_URL);
        const body = response.data;
        
        
        
        expect(body).to.include('ip');
        expect(body).to.include('processes');
        expect(body).to.include('disk');
        expect(body).to.include('login');
        
        

    });

    it('should have valid subfields for service2', async () => {
        const response = await axios.get(SERVER_URL);
        const body = response.data;

        
        
        expect(body).to.include('ip');
        expect(body).to.include('processes');
        expect(body).to.include('disk');
        expect(body).to.include('login');

        
    });

    it('should have values for subfield keys in service1', async () => {

        // Split the service2 fields into lines and check each for non-empty values
        const service1Match = body.match(/service1:\s*([\s\S]*?)\n\s*service2:/);
        const service1Fields = service1Match[1].trim();
        const service1Lines = service1Fields.split('\n');
        service1Lines.forEach(line => {
            const [key, value] = line.split(':');
            if (value) {
                expect(value.trim()).to.not.be.empty; // Ensure value is non-empty
            }
        });

    })

    it('should have values for subfield keys in service2', async () => {

        // Split the service2 fields into lines and check each for non-empty values
        const service2Match = body.match(/service2:\s*([\s\S]*?)\n\s*$/);
        const service2Fields = service2Match[1].trim();
        expect(service2Fields).to.be.null
        const service2Lines = service2Fields.split('\n');
        service2Lines.forEach(line => {
            const [key, value] = line.split(':');
            if (value) {
                expect(value.trim()).to.not.be.empty; // Ensure value is non-empty
            }
        });
    })


    it('should handle missing fields gracefully', async () => {
        const response = await axios.get(SERVER_URL);
        const body = response.data;

        // Simulate a missing field scenario
        expect(body).to.not.include('unknownField', 'Response should not include unknownField');
    });
});
