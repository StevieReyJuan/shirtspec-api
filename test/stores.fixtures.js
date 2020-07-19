function makeStoresArray() {
    return [
        {
            id: 1,
            user_name: 'Drinkwater\'s',
            password: 'test123',
        },
        {
            id: 2,
            user_name: 'Louis',
            password: 'test456',
        },
        {
            id: 3,
            user_name: 'Bergdorf',
            password: 'test789',
            // date_created: '2020-07-07 20:34:00.000Z'
        }
    ]
}

module.exports = { makeStoresArray }