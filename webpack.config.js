const path = require('path');
const SpinSdkPlugin = require("@fermyon/spin-sdk/plugins/webpack")
const webpack = require('webpack')

module.exports = {
  entry: './src/index.ts',
  experiments: {
    outputModule: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'bundle.js',
    module: true,
    library: {
      type: "module",
    }
  },
  plugins: [
    new SpinSdkPlugin(),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    })
  ],
  optimization: {
    minimize: false
  },
  performance: {
    hints: false,
  }
};
