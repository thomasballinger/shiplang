// These tests may only run in node, or do not require a webpack build.
require('./test_imageprocess');  // uses native (from C++) code
require('./test_loaders');  // tests code that could prevent a build
