(async () => {
    const chai = await import('chai');
    const axios = await import('axios');
    
    const { expect } = chai;
    
    // Your test logic here
    const SERVER_URL = 'http://localhost:8197/request'; // Keep the /request endpoint

describe.skip('Request Response Tests', () => {

    afterEach(done => {
        new Promise(resolve => setTimeout(resolve, 2000))
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
            [key, value] = line.split(':');
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
});


  })();

