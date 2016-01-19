var webpack = require('webpack');
var path = require('path');
var fs = require('fs');

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  entry: './runner.ts',
  target: 'node',
  output: {
    libraryTarget: 'commonjs',
    filename: 'backend.js'
  },
  externals: nodeModules,
  devtool: 'source-map',
  plugins: [
    new webpack.BannerPlugin('require("source-map-support").install();',
                             { raw: true, entryOnly: false })
  ],
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js'],
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' },
      { test: /\.grammar$/, loader: 'raw-loader' }
    ]
  }
};
