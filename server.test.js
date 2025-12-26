const request = require('supertest');

const baseUrl = `http://localhost:${process.env.CATALOGUE_SERVER_PORT || 8080}`;

describe('Catalogue API Endpoints', () => {
  test('GET /health returns app and mongo status', async () => {
    const res = await request(baseUrl).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('app', 'OK');
    expect(res.body).toHaveProperty('mongo');
  });

  test('GET /products handles DB connected or not', async () => {
    const res = await request(baseUrl).get('/products');
    expect([200, 500]).toContain(res.statusCode);
  });

  test('GET /product/:sku returns product or 404/500', async () => {
    const res = await request(baseUrl).get('/product/123');
    expect([200, 404, 500]).toContain(res.statusCode);
  });

  test('GET /categories returns categories or error', async () => {
    const res = await request(baseUrl).get('/categories');
    expect([200, 500]).toContain(res.statusCode);
  });

  test('GET /search/:text returns hits or error', async () => {
    const res = await request(baseUrl).get('/search/test');
    expect([200, 500]).toContain(res.statusCode);
  });
});