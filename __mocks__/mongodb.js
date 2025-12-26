module.exports = {
  MongoClient: {
    connect: jest.fn().mockResolvedValue({
      db: () => ({
        collection: () => ({
          find: (query) => {
            if (query && query.categories) {
              return { toArray: () => Promise.resolve([{ sku: '123', categories: query.categories }]) };
            }
            return { toArray: () => Promise.resolve([{ sku: '123', name: 'Mock Product' }]) };
          },
          findOne: () => Promise.resolve({ sku: '123', name: 'Mock Product' }),
          distinct: () => Promise.resolve(['cat1', 'cat2'])
        })
      })
    })
  },
  ObjectId: jest.fn()
};