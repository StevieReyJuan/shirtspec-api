const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function makeStoresArray() {
    return [
        {
            id: 1,
            user_name: 'test-user-1',
            password: 'password',
            date_created: new Date('2021-01-22T16:28:32.615Z')
        },
        {
            id: 2,
            user_name: 'test-user-2',
            password: 'password',
            date_created: new Date('2021-01-22T16:28:32.615Z')
        },
        {
            id: 3,
            user_name: 'test-user-3',
            password: 'password',
            date_created: new Date('2021-01-22T16:28:32.615Z')
        },
    ];
}

function makeCustomersArray(stores) {
    return [
        {
            id: 1,
            store_id: stores[0].id,
            customer_name: 'Steven',
            date_modified: '2021-01-22T16:28:32.615Z',
            chest: 36,
            shirt_waist: 30,
            yoke: '17.00',
            shaping: -6,
            left_sleeve: '33.00', 
            right_sleeve: '33.00',
            left_cuff: '9.00',
            right_cuff: '9.00',
            tail: 28,
            collar: '15.00',
            shoulder_line: 'square'
        },
        {
            id: 2,
            store_id: stores[1].id,
            customer_name: 'Gary',
            date_modified: '2021-01-22T16:28:32.615Z',
            chest: 42,
            shirt_waist: 36,
            yoke: '18.50',
            shaping: -4,
            left_sleeve: '35.00', 
            right_sleeve: '35.00',
            left_cuff: '10.75',
            right_cuff: '10.50',
            tail: 32,
            collar: '16.50',
            shoulder_line: 'regular'
        },
        {
            id: 3,
            store_id: stores[0].id,
            customer_name: 'Gus',
            date_modified: '2021-01-22T16:28:32.615Z',
            chest: 42,
            shirt_waist: 34,
            yoke: '18.00',
            shaping: -3,
            left_sleeve: '35.00', 
            right_sleeve: '35.00',
            left_cuff: '10.00',
            right_cuff: '10.00',
            tail: 32,
            collar: '17.00',
            shoulder_line: 'square'
        },
    ];
}

function makeExpectedCustomersForStore(customers, store) {
    return customers
        .filter(customer => customer.store_id === store.id); 
}

function makeMaliciousCustomer(store) {
    const maliciousCustomer = {
        id: 911,
        store_id: store.id,
        customer_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        date_modified: new Date(),
        chest: 40,
        shirt_waist: 34,
        yoke: 18.5,
        shaping: -4,
        left_sleeve: 35, 
        right_sleeve: 35,
        left_cuff: 10,
        right_cuff: 10,
        tail: 32,
        collar: 16,
        shoulder_line: 'regular'
    };
    const expectedCustomer = {
        ...makeExpectedCustomersForStore([maliciousCustomer], store),
        title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    };
    return {
        maliciousCustomer,
        expectedCustomer
    };
}

function makeShirtspecFixtures() {
    const testStores = makeStoresArray();
    const testCustomers = makeCustomersArray(testStores);
    return { testStores, testCustomers};
}

function cleanTables(db) {
    return db.transaction(trx =>
        trx.raw(
            `TRUNCATE
            shirtspec_stores,
            shirtspec_customers
            `
        )
        .then(() =>
            Promise.all([
                trx.raw(`ALTER SEQUENCE shirtspec_stores_id_seq minvalue 0 START WITH 1`),
                trx.raw(`ALTER SEQUENCE shirtspec_customers_id_seq minvalue 0 START WITH 1`),
                trx.raw(`SELECT setval('shirtspec_stores_id_seq', 0)`),
                trx.raw(`SELECT setval('shirtspec_customers_id_seq', 0)`),
                ])
            )
        );
}

function seedUsers(db, users) {
    const preppedUsers = users.map(user => ({
        ...user,
        password: bcrypt.hashSync(user.password, 1)
    }));

    return db.into('shirtspec_stores').insert(preppedUsers)
        .then(() =>
            // update the auto sequence to stay in sync
            db.raw(
                `SELECT setval('shirtspec_stores_id_seq', ?)`,
                [users[users.length - 1].id],
            )
        );
}

function seedCustomersTables(db, users, customers) {
    // use a transaction to group the queries and auto rollback on any failure
    return db.transaction(async trx => {
        await seedUsers(trx, users)
        await trx.into('shirtspec_customers').insert(customers)
        // update the auto sequence to match the forced id values
        await trx.raw(
            `SELECT setval('shirtspec_customers_id_seq', ?)`,
            [customers[customers.length - 1].id],
        );
    });
}

function seedMaliciousCustomer(db, store, customer) {
    return seedUsers(db, [store])
        .then(() => 
            db
                .into('shirtspec_customers')
                .insert([customer])
    );
}


function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
    const token = jwt.sign({ user_id: user.id }, secret, {
        subject: user.user_name,
        algorithm: 'HS256',
    });

    return `Bearer ${token}`;
}

module.exports = {
    makeStoresArray,
    makeCustomersArray,
    makeExpectedCustomersForStore,
    makeMaliciousCustomer,

    makeShirtspecFixtures,
    cleanTables,
    seedUsers,
    seedCustomersTables,
    seedMaliciousCustomer,
    makeAuthHeader
};