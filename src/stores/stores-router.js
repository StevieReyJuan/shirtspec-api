const path = require('path')
const express = require('express')
const StoresService = require('./stores-service')
// const { requireAuth } = require('../middleware/jwt-auth')

const storesRouter = express.Router()
const jsonBodyParser = express.json()

storesRouter
    .post('/', jsonBodyParser, (req, res, next) => {
        const { user_name, password } = req.body

        for (const field of ['user_name', 'password'])
            if(!req.body[field])
                return res.status(400).json({
                    error: `Missing '${field}' in request body`
                })
        
        const passwordError = StoresService.validatePassword(password)

        if (passwordError) 
            return res.status(400).json({ error: passwordError })

        StoresService.hasUserWithUserName(
            req.app.get('db'),
            user_name
        )
        .then(hasUserWithUserName => {
            if (hasUserWithUserName)
                return res.status(400).json({ error: `Username already exists` })

            return StoresService.hashPassword(password)
                .then(hashedPassword => {
                    const newStore = {
                        user_name,
                        password: hashedPassword,
                        date_created: 'now()'
                    }

                    return StoresService.insertStore(
                        req.app.get('db'),
                        newStore
                    )
                        .then(store => {
                            res
                                .status(201)
                                .location(path.posix.join(req.originalUrl, `/${store.id}`))
                                .json(StoresService.serializeStore(store))
                        })
                })
        })
        .catch(next)
    })

// async function checkStoreExists(req, res, next) {
//     try {
//         const store = await StoresService.getById(
//             req.app.get('db'),
//             req.params.store_id
//         )

//         if (!store)
//             return res.status(404).json({
//                 error: `Store doesn't exist`
//             })
//         res.store = store
//         next()
//     }   catch (error) {
//         next(error)
//     }
// }
module.exports = storesRouter;