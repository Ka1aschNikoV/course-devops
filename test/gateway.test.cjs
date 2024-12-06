const chai = require('chai');
const axios = require('axios');
const app = require('../api/index');

const { expect } = chai;

let server;
const BASE_URL = 'http://localhost:3000';

describe('API Tests Without chai-http', () => {
  // Start the server before running the tests
  before((done) => {
    server = app.listen(3000, done);
  });

  // Stop the server after all tests
  after((done) => {
    server.close(done);
  });

  describe('GET /', () => {
    it('should return a welcome message', async () => {
      const response = await axios.get(`${BASE_URL}/`);
      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('object');
      expect(response.data).to.have.property('message', 'Hello, world!');
    });
  });

  describe('POST /echo', () => {
    it('should echo back the data sent', async () => {
      const testData = { name: 'Mocha', type: 'Test' };
      const response = await axios.post(`${BASE_URL}/echo`, testData);

      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('object');
      expect(response.data).to.have.property('data').that.deep.equals(testData);
    });
  });
});
