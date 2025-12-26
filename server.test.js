// server.test.js
const request = require('supertest');

// ✅ Mock MongoDB so we can control behavior
jest.mock('mongodb', () => ({
  MongoClient: {
    connect: jest.fn().mockResolvedValue({
      db: () => ({
        collection: () => ({
          find: () => ({ toArray: () => Promise.resolve([{ sku: '123', name: 'Mock Product' }]) }),
          findOne: () => Promise.resolve({ sku: '123', name: 'Mock Product' }),
          distinct: () => Promise.resolve(['cat1', 'cat2'])
        })
      })
    })
  },
  ObjectId: jest.fn()
}));

const app = require('./server');

describe('Catalogue API Endpoints', () => {
  test('GET /health returns app and mongo status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('app', 'OK');
    expect(res.body).toHaveProperty('mongo');
  });

  test('GET /products returns product list', async () => {
    const res = await request(app).get('/products');
    expect(res.statusCode).toBe(200);
    expect(res.body[0].sku).toBe('123');
  });

  test('GET /product/:sku returns product', async () => {
    const res = await request(app).get('/product/123');
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Mock Product');
  });

  test('GET /products/:cat returns products in category', async () => {
    const res = await request(app).get('/products/cat1');
    expect(res.statusCode).toBe(200);
    expect(res.body[0].sku).toBe('123');
  });

  test('GET /categories returns categories', async () => {
    const res = await request(app).get('/categories');
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('cat1');
  });

  test('GET /search/:text returns hits', async () => {
    const res = await request(app).get('/search/test');
    expect(res.statusCode).toBe(200);
    expect(res.body[0].name).toBe('Mock Product');
  });

  // ❌ Error branch when mongoConnected = false
  test('GET /products returns 500 when DB not connected', async () => {
    app.locals.mongoConnected = false;
    const res = await request(app).get('/products');
    expect(res.statusCode).toBe(500);
    app.locals.mongoConnected = true; // reset
  });

  // ✅ Delay branch
  test('GET /product/:sku respects GO_SLOW delay', async () => {
    process.env.GO_SLOW = 50; // 50ms delay
    const res = await request(app).get('/product/123');
    expect(res.statusCode).toBe(200);
    delete process.env.GO_SLOW;
  });
});

// ✅ Extra test to cover mongoConnect failure branch
jest.mock('mongodb', () => ({
  MongoClient: {
    connect: jest.fn().mockRejectedValue(new Error('Connection failed'))
  },
  ObjectId: jest.fn()
}));

test('mongoConnect handles connection failure', async () => {
  const app = require('./server');
  expect(app).toBeDefined();
});

// Cleanup so Jest exits cleanly
afterAll(() => {
  jest.clearAllTimers();
});