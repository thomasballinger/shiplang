parent = require('./webpack.config');

parent.entry = 'mocha!./tests/index.js';
parent.output = { filename: 'test.build.js', };

module.exports = parent;
