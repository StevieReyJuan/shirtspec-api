const knex = require('knex')
const bcrypt = require('bcryptjs')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Stores Endpoints', () => {
    let db
    const { testStores } = helpers.makeShirtspecFixtures()
    const testStore = testStores[0]

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', ()=> db.destroy())

    before('cleanup', () => helpers.cleanTables(db))

    afterEach('cleanup', () => helpers.cleanTables(db))

    describe(`POST /api/stores`, () => {
        context(`User Validation`, () => {
            beforeEach('insert users', () => 
                helpers.seedUsers(
                    db,
                    testStores
                )
            )

            const requiredFields = ['user_name', 'password']

            requiredFields.forEach(field => {
                const registerAttemptBody = {
                    user_name: 'test user_name',
                    password: 'test password'
                }

                it(`responds with 400 required error when '${field}' is missing`, () => {
                    delete registerAttemptBody[field]

                    return supertest(app)
                        .post('/api/stores')
                        .send(registerAttemptBody)
                        .expect(400, {
                            error: `Missing '${field}' in request body`})
                })

                it(`responds 400 'Password must be longer than 8 characters' when empty password`, () => {
                    const userShortPassword = {
                        user_name: 'test user_name',
                        password: '1234567',
                        full_name: 'test full_name',
                    }
                    return supertest(app)
                        .post('/api/stores')
                        .send(userShortPassword)
                        .expect(400, { error: `Password must be longer than 8 characters` })
                })
            
                it(`responds 400 'Password must be less than 72 characters' when long password`, () => {
                    const userLongPassword = {
                        user_name: 'test user_name',
                        password: '*'.repeat(73),
                        full_name: 'test full_name',
                    }
                    return supertest(app)
                        .post('/api/stores')
                        .send(userLongPassword)
                        .expect(400, { error: `Password must be less than 72 characters` })
                })
        
                it(`responds 400 error when password starts with spaces`, () => {
                    const userPasswordStartsSpaces = {
                        user_name: 'test user_name',
                        password: ' 1Aa!2Bb@',
                        full_name: 'test full_name',
                    }
                    return supertest(app)
                        .post('/api/stores')
                        .send(userPasswordStartsSpaces)
                        .expect(400, { error: `Password must not start or end with a space` })
                })
        
                it(`responds 400 error when password ends with spaces`, () => {
                    const userPasswordEndsSpaces = {
                        user_name: 'test user_name',
                        password: '1Aa!2Bb@ ',
                        full_name: 'test full_name',
                    }

                    return supertest(app)
                        .post('/api/stores')
                        .send(userPasswordEndsSpaces)
                        .expect(400, { error: `Password must not start or end with a space` })
                })
            })
        })

        context(`Happy path`, () => {
            it(`responds 201, serialized user, storing bcryped password`, () => {
                const newUser = {
                    user_name: 'test user_name',
                    password: '11AAaa!!'
                }
                return supertest(app)
                    .post('/api/stores')
                    .send(newUser)
                    .expect(201)
                    .expect(res => {
                        expect(res.body).to.have.property('id')
                        expect(res.body.user_name).to.eql(newUser.user_name)
                        expect(res.body).to.not.have.property('password')
                        expect(res.headers.location).to.eql(`/api/stores/${res.body.id}`)
                        const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC' })
                        const actualDate = new Date(res.body.date_created).toLocaleString()
                        expect(actualDate).to.eql(expectedDate)
                        })
                        .expect(res =>
                            db
                                .from('shirtspec_stores')
                                .select('*')
                                .where({ id: res.body.id })
                                .first()
                                .then(row => {
                                    expect(row.user_name).to.eql(newUser.user_name)
                                    const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC' })
                                    const actualDate = new Date(row.date_created).toLocaleString()
                                    expect(actualDate).to.eql(expectedDate)
                    
                                    return bcrypt.compare(newUser.password, row.password)
                                })
                                .then(compareMatch => {
                                    expect(compareMatch).to.be.true
                                })
                        )
            })
        })
    })

})