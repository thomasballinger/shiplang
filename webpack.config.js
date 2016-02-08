var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: './entry.js',
  output: {
    filename: 'bundle.js'
  },
  devtool: 'source-map',
  externals: {
    'acorn': "acorn",
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js'],
  },
  node: {
    fs: "empty"
  },
  module: {
    loaders: [
      { test: /\.ts$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015-webpack']
        }
      },
      { test: /\.grammar$/, loader: 'raw-loader' },
      { test: /\.css$/, loader: "style!css" }
    ],
    preLoaders: [
      { test: /\.ts$/, loader: 'ts-loader' },
    ]
  }
};
