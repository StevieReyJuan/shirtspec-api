const path = require('path')
const express = require('express')
const xss = require('xss')
const CustomersService = require('./customers-service')
const { requireAuth } = require('../middleware/jwt-auth')

const customersRouter = express.Router()
const jsonBodyParser = express.json()

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

customersRouter
    .route('/')
    .all(requireAuth)
    .get((req, res, next) => {
        const store_id = req.user.id
        CustomersService.getAllCustomersForStore(
            req.app.get('db'), store_id
        )
            .then(customers => {
                res.json(customers.map(serializeCustomer))
            })
            .catch(next)
    })
    .post(jsonBodyParser, (req, res, next) => {
        const 
            {   
                customer_name, chest, shirt_waist, yoke, shaping, 
                left_sleeve, right_sleeve, left_cuff, right_cuff,
                tail, collar, shoulder_line
            } = req.body
        const newCustomer = 
            { 
                customer_name, chest, shirt_waist, yoke, shaping,
                left_sleeve, right_sleeve, left_cuff, right_cuff,
                tail, collar, shoulder_line
            }

        for (const [key, value] of Object.entries(newCustomer))
            if (value == null)
                return res.status(400).json({
                    error: `Missing '${key}' in request body`
                })
        newCustomer.store_id = req.user.id //use logged in user to post customer to appropriate store

        CustomersService.insertCustomer(
            req.app.get('db'),
            newCustomer
        )
            .then(customer => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${customer.id}`))
                    .json(CustomersService.serializeNewCustomer(customer))
            })
            .catch(next)
    })

customersRouter
    .route('/:customer_id')
    .all(requireAuth)
    .all(checkCustomerExists)
    .get((req, res, next) => {
        CustomersService.getCustomerMeasurements(
            req.app.get('db'), req.params.customer_id
        )
            .then(customer => {
                res.json(serializeMeasurements(customer))
            })
            .catch(next)
    })
    .patch(jsonBodyParser, (req, res, next) => {
        const 
            {   
                customer_name, chest, shirt_waist, yoke, shaping, 
                left_sleeve, right_sleeve, left_cuff, right_cuff,
                tail, collar, shoulder_line
            } = req.body

        const measurementsToUpdate =    
            {
                customer_name, chest, shirt_waist, yoke, shaping, 
                left_sleeve, right_sleeve, left_cuff, right_cuff,
                tail, collar, shoulder_line
            }
        
        const numberOfValues = Object.values(measurementsToUpdate).filter(Boolean).length

        if (numberOfValues.length === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must include any of 'name, chest', 'shirt waist', 'yoke', 'shaping', 'sleeve', 'cuff', 'tail', 'collar', or 'shoulder line'.`
                }
            })
        }

        measurementsToUpdate.store_id = req.user.id
        measurementsToUpdate.date_modified = new Date()

        CustomersService.updateCustomerMeasurements(
            req.app.get('db'), req.params.customer_id, measurementsToUpdate
        )
            // .then(numRowsAffected => {
            //     res.status(204).end()
            // })
            // .catch(next)
            .then(customer => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${customer.id}`))
                    .json(CustomersService.serializeNewCustomer(customer))
            })
            .catch(next)
    })

    // TODO: DELETE CUSTOMER

async function checkCustomerExists(req, res, next) {
    try {
        const customer = await CustomersService.getById(
            req.app.get('db'),
            req.params.customer_id
        )

        if (!customer)
            return res.status(404).json({
                error: `Customer doesn't exist`
            })
        else if (customer.store_id !== req.user.id)
            return res.status(400).json({
                error: `Not authorized to view customer`
            })
        res.customer = customer
        next()
    }   catch (error) {
        next(error)
    }
}

module.exports = customersRouter;