function makeCustomersArray() {
    return [
        {
            id: 1,
            store_id: 1,
            customer_name: 'Steven',
            chest: 36,
            shirt_waist: 30,
            yoke: 17,
            shaping: -6,
            left_sleeve: 33, 
            right_sleeve: 33,
            left_cuff: 9,
            right_cuff: 9,
            tail: 28,
            collar: 15,
            shoulder_line: 'square'
        },
        {
            id: 2,
            store_id: 2,
            customer_name: 'Gary',
            chest: 42,
            shirt_waist: 36,
            yoke: 18.5,
            shaping: -4,
            left_sleeve: 35, 
            right_sleeve: 35,
            left_cuff: 10.75,
            right_cuff: 10.5,
            tail: 32,
            collar: 16.5,
            shoulder_line: 'regular'
        },
        {
            id: 3,
            store_id: 1,
            customer_name: 'Gus',
            // date_modified: '2020-07-07 20:34:00.000Z',
            chest: 42,
            shirt_waist: 34,
            yoke: 18,
            shaping: -3,
            left_sleeve: 35, 
            right_sleeve: 35,
            left_cuff: 10,
            right_cuff: 10,
            tail: 32,
            collar: 17,
            shoulder_line: 'square'
        },
    ]
}

module.exports = { makeCustomersArray }