// server.test.js
jest.mock('mongodb'); // use our __mocks__/mongodb.js

const request = require('supertest');
const baseUrl = `http://localhost:${process.env.CATALOGUE_SERVER_PORT || 8080}`;

describe('Catalogue API Endpoints (with mocked MongoDB)', () => {
  test('GET /health returns app and mongo status', async () => {
    const res = await request(baseUrl).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ app: 'OK', mongo: true });
  });

  test('GET /products returns mocked product list', async () => {
    const res = await request(baseUrl).get('/products');
    expect(res.statusCode).toBe(200);
    expect(res.body[0].sku).toBe('123');
  });

  test('GET /product/:sku returns mocked product', async () => {
    const res = await request(baseUrl).get('/product/123');
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Mock Product');
  });

  test('GET /categories returns mocked categories', async () => {
    const res = await request(baseUrl).get('/categories');
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('cat1');
  });

  test('GET /search/:text returns mocked hits', async () => {
    const res = await request(baseUrl).get('/search/test');
    expect(res.statusCode).toBe(200);
    expect(res.body[0].name).toBe('Mock Product');
  });
});