CREATE TABLE IF NOT EXISTS shirtspec_stores;
CREATE TABLE IF NOT EXISTS shirtspec_customers;

TRUNCATE
    shirtspec_stores,
    shirtspec_customers
    RESTART IDENTITY CASCADE;