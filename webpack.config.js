var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: './entry.js',
  output: {
    filename: 'bundle.js'
  },
  devtool: 'source-map',
  externals: {
    // in browsers: provided by hotswapping-js-interp/acorn.js
    'acorn': "acorn",
    // in browsers: provided by hotswapping-js-interp/deepcopy.js
    'deepcopy': "deepCopy",
    // in browsers: provided by hotswapping-js-interp/acorn.js
    'Interpreter': "Interpreter",

    // Boolean for debug mode
    'DEBUGMODE': "DEBUGMODE",
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
  },
  node: {
    fs: "empty"
  },
  module: {
    loaders: [
      { test: /\.tsx?$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015-webpack']
        }
      },
      { test: /\.grammar$/, loader: 'raw-loader' },
      { test: /\.css$/, loader: "style!css" }
    ],
    preLoaders: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
    ]
  }
};
