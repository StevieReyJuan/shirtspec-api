const xss = require('xss');

const CustomersService = {
    getAllCustomersForStore(db, store_id) {
        return db
            .from('shirtspec_customers')
            .select('*')
            .where({ store_id });
    },
    getCustomerMeasurements(db, id) {
        return db
            .from('shirtspec_customers')
            .select(
                'id',
                'customer_name',
                'chest',
                'shirt_waist',
                'yoke',
                'shaping',
                'left_sleeve',
                'right_sleeve',
                'left_cuff',
                'right_cuff',
                'tail',
                'collar',
                'shoulder_line'
            )
            .where({ id })
            .first();
    },
    getById(db, id) {
        return db
            .from('shirtspec_customers')
            .where({ id })
            .first();
    },
    insertCustomer(db, newCustomer) {
        return db
            .insert(newCustomer)
            .into('shirtspec_customers')
            .returning('*')
            .then(([customer]) => customer)
            .then(customer => 
                CustomersService.getById(db, customer.id));
    },
    serializeNewCustomer(customer) {
        return {
            id: customer.id,
            customer_name: xss(customer.customer_name),
            store_id: customer.store_id,
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
            shoulder_line: customer.shoulder_line,
            date_modified: new Date(customer.date_modified) || null
        };
    },
    updateCustomerMeasurements(db, id, UpdatedMeasurementFields) {
        return db
            .from('shirtspec_customers')
            .where({ id })
            .update(UpdatedMeasurementFields)
            .returning('*')
            .then(([customer]) => customer)
            .then(customer => 
                CustomersService.getById(db, customer.id));
    },

}

module.exports = CustomersService;