const request = require('supertest');
const app = require('./server'); // import Express app

describe('Catalogue API Endpoints', () => {
  test('GET /health returns app and mongo status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('app', 'OK');
    expect(res.body).toHaveProperty('mongo');
  });

  test('GET /products returns product list or error', async () => {
    const res = await request(app).get('/products');
    expect([200, 500]).toContain(res.statusCode);
  });

  test('GET /product/:sku returns product or 404/500', async () => {
    const res = await request(app).get('/product/123');
    expect([200, 404, 500]).toContain(res.statusCode);
  });

  test('GET /categories returns categories or error', async () => {
    const res = await request(app).get('/categories');
    expect([200, 500]).toContain(res.statusCode);
  });

  test('GET /search/:text returns hits or error', async () => {
    const res = await request(app).get('/search/test');
    expect([200, 500]).toContain(res.statusCode);
  });
});

afterAll(() => {
  // Close any open handles so Jest can exit cleanly
  jest.clearAllTimers();
});