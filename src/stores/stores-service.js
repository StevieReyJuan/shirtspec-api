const bcrypt = require('bcryptjs')
const xss = require('xss')

const StoresService = {
    serializeStore(store) {
        return {
            id: store.id,
            user_name: xss(store.user_name),
            // password: xss(store.password),
            date_created: new Date(store.date_created)
        }
    },
    validatePassword(password) {
        if (password.length < 8) {
            return 'Password must be longer than 8 characters'
        }
        if (password.length > 72) {
            return 'Password must be less than 72 characters'
        }
        if (password.startsWith(' ') || password.endsWith(' ')) {
            return 'Password must not start or end with a space'
        }
        return null
    },
    hasUserWithUserName(db, user_name) {
        return db('shirtspec_stores')
            .where({ user_name })
            .first()
            .then(user => !!user) //user is true
    },
    hashPassword(password) {
        return bcrypt.hash(password, 12)
    },
    insertStore(db, newStore) {
        return db
            .insert(newStore)
            .into('shirtspec_stores')
            .returning('*')
            .then(([store]) => store)
    }
    // getAllStores(knex) {
    //     return knex.select('*').from('shirtspec_stores')
    // }

}

module.exports = StoresService;