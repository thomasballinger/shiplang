var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: ['babel-polyfill', './entry.js'],
  output: {
    filename: 'bundle.js'
  },
  devtool: 'source-map',
  externals: {
    // in browsers: provided by hotswapping-js-interp/deepcopy.js
    'deepcopy': "deepCopy",
    // in browsers: provided by hotswapping-js-interp/interpreter.js
    'Interpreter': "Interpreter",

    // Boolean for debug mode
    'DEBUGMODE': "DEBUGMODE",
  },
  resolve: {
    modules: [path.resolve(__dirname), 'node_modules/'],
    extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
  },
  node: {
    fs: "empty"
  },
  module: {
    rules: [
      {
        test: /\.tsx?$|.js$/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: [require.resolve('babel-preset-es2015')]
            //TODO why is require.resolve necessary here?
          }
        }]
      }, {
        test: /\.grammar$/,
        loader: 'raw-loader'
      }, {
        test: /\.css$/,
        loader: "style-loader!css-loader"
      }, {
        enforce: 'pre',
        test: /\.tsx?$/,
        loader: 'ts-loader'
      }
    ],
  }
};
