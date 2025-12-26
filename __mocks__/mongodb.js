module.exports = {
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
};