module.exports = {
  entry: './eval.ts',
  target: 'node',
  output: {
    libraryTarget: 'commonjs',
    filename: 'bundle.js'
  },
  devtool: 'source-map',
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
