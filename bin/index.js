#!/usr/bin/env node

const run = require('../lib/index.js');

run().catch(error => {
    console.error(error);
    process.exit(1);
});