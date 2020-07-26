const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Customers Endpoints', () => {
    let db

    const { testStores, testCustomers }  = helpers.makeShirtspecFixtures()

    const serializeCustomer = customer => ({
        id: customer.id,
        store_id: customer.store_id,
        customer_name: customer.customer_name,
        date_modified: customer.date_modified,
    })

    const serializeMeasurements = customer => ({
        id: customer.id,
        customer_name: customer.customer_name,
        chest: customer.chest,
        shirt_waist: customer.shirt_waist,
        yoke: customer.yoke,
        shaping: customer.shaping,
        left_sleeve: customer.left_sleeve,
        right_sleeve: customer.right_sleeve,
        left_cuff: customer.left_cuff,
        right_cuff: customer.right_cuff,
        tail: customer.tail,
        collar: customer.collar,
        shoulder_line: customer.shoulder_line
    })

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('cleanup', () => helpers.cleanTables(db))

    afterEach('cleanup', () => helpers.cleanTables(db))

    beforeEach('insert customers', () => {
        return helpers.seedCustomersTables(db, testStores, testCustomers)
    })

    describe(`GET /api/customers`, () => {

        context(`Given no customers`, () => {

            it(`responds with an empty list`, () => {
                const emptyCustomerStore = testStores[2]

                return supertest(app)
                    .get('/api/customers')
                    .set('Authorization', helpers.makeAuthHeader(emptyCustomerStore))
                    .expect([])
            })
        })

        context(`Given there are customers for the store in the db`, () => {

            it(`responds with an array of the stores customers`, () => {
                const storeToCheckForCustomers = testStores[0]
                const customersForStore = helpers.makeExpectedCustomersForStore(testCustomers, storeToCheckForCustomers)
                const serializedCustomers = customersForStore.map(serializeCustomer)

                return supertest(app)
                    .get('/api/customers')
                    .set('Authorization', helpers.makeAuthHeader(storeToCheckForCustomers))
                    .expect(serializedCustomers)
            })
        })
    })

    describe(`GET /api/customers/:customer_id`, () => {

        context(`Given no customer exists with Id`, () => {

            it(`responds with 404`, () => {
                const storeToCheckForCustomers = testStores[0]
                const customerId = 123456

                return supertest(app)
                    .get(`/api/customers/${customerId}`)
                    .set('Authorization', helpers.makeAuthHeader(storeToCheckForCustomers))
                    .expect(404, { error: `Customer doesn't exist` })
            })
        })

        context(`Given customer Id exists, but is store is not authorized`, () => {

            it(`responds with 400`, () => {
                const storeToCheckForCustomers = testStores[0]
                const customerId = testCustomers[1].id
                
                return supertest(app)
                    .get(`/api/customers/${customerId}`)
                    .set('Authorization', helpers.makeAuthHeader(storeToCheckForCustomers))
                    .expect(400, { error: `Not authorized to view customer` })
            })
        })

        context(`Happy Path: Given customer Id exists and is assigned to authorized store`, () => {

            it(`responds with customer's measurements`, () => {
                const storeToCheckForCustomers = testStores[0]
                const customersForStore = helpers.makeExpectedCustomersForStore(testCustomers, storeToCheckForCustomers)
                const customer = customersForStore[0]
                const serializedCustomerMeasurements = serializeMeasurements(customer)

                return supertest(app)
                    .get(`/api/customers/${customer.id}`)
                    .set('Authorization', helpers.makeAuthHeader(storeToCheckForCustomers))
                    .expect(serializedCustomerMeasurements)
            })
        })
    })

    describe(`POST /api/customers`, () => {

        context(`Happy Path: Given no fields have been left blank`, () => {
            it(`creates a new customer, responding with 201 and the new customer`, () => {
                const storeToAddCustomerTo = testStores[0]
                const newCustomer =         {
                    customer_name: 'New Test Guy',
                    chest: 40,
                    shirt_waist: 32,
                    yoke: '17.00',
                    shaping: -4,
                    left_sleeve: '35.00', 
                    right_sleeve: '35.00',
                    left_cuff: '10.00',
                    right_cuff: '10.00',
                    tail: 31,
                    collar: '16.50',
                    shoulder_line: 'regular'
                }

                return supertest(app)
                    .post('/api/customers')
                    .set('Authorization', helpers.makeAuthHeader(storeToAddCustomerTo))
                    .send(newCustomer)
                    .expect(201)
                    .expect(res => {
                        expect(res.body).to.have.property('id')
                        expect(res.body.customer_name).to.eql(newCustomer.customer_name)
                        expect(res.body.chest).to.eql(newCustomer.chest)
                        expect(res.body.shirt_waist).to.eql(newCustomer.shirt_waist)
                        expect(res.body.yoke).to.eql(newCustomer.yoke)
                        expect(res.body.shaping).to.eql(newCustomer.shaping)
                        expect(res.body.left_sleeve).to.eql(newCustomer.left_sleeve)
                        expect(res.body.right_sleeve).to.eql(newCustomer.right_sleeve)
                        expect(res.body.left_cuff).to.eql(newCustomer.left_cuff)
                        expect(res.body.right_cuff).to.eql(newCustomer.right_cuff)
                        expect(res.body.tail).to.eql(newCustomer.tail)
                        expect(res.body.collar).to.eql(newCustomer.collar)
                        expect(res.body.shoulder_line).to.eql(newCustomer.shoulder_line)
                        expect(res.headers.location).to.eql(`/api/customers/${res.body.id}`)
                        const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC' })
                        const actualDate = new Date(res.body.date_modified).toLocaleString()
                        expect(actualDate).to.eql(expectedDate)
                    })
                    .expect(res => 
                        db
                            .from('shirtspec_customers')
                            .select('*')
                            .where({ id: res.body.id })
                            .first()
                            .then(row => {
                                expect(row.customer_name).to.eql(newCustomer.customer_name)
                                expect(row.store_id).to.eql(storeToAddCustomerTo.id)
                                const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC' })
                                const actualDate = new Date(row.date_modified).toLocaleString()
                                expect(actualDate).to.eql(expectedDate)
                            })
                    )
            })
        })
    })

    //TODO: 401 Protected Endpoints, PATCH, Unhappy POST


})