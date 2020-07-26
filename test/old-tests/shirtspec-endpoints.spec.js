const knex = require('knex')
const app = require('../../src/app')
const request = require('supertest');
const { makeStoresArray } = require('./stores.fixtures')
const { makeCustomersArray } = require('./customers.fixtures')

describe.skip('ShirtSpec Endpoints', function() {
    let db

    const authenticatedUser = request.agent(app);

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db.raw('TRUNCATE shirtspec_stores, shirtspec_customers RESTART IDENTITY CASCADE'))

    afterEach('cleanup', () => db.raw('TRUNCATE shirtspec_stores, shirtspec_customers RESTART IDENTITY CASCADE'))

    describe(`GET /api/customers`, () => {
        context('Given there are customers for store in the database', () => {
            const testStores = makeStoresArray();
            const testCustomers = makeCustomersArray();
            
            beforeEach('insert stores', () => {
                return db
                    .into('shirtspec_stores')
                    .insert(testStores)
            })

            beforeEach('insert customers', () => {
                return db
                    .into('shirtspec_customers')
                    .insert(testCustomers)
            })

            //Need to find a way to login for tests as endpoints are protected...
            it('unauthorized GET /api/customers responds with 401', () => {
                return supertest(app)
                    .get('/api/stores')
                    .expect(200)
            })
        })
    })
})