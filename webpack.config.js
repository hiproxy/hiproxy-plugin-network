const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: './src/app.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve('./dist')
  },
  devtool: 'cheap-source-map',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react'],
          plugins: []
        },
        exclude: /(node_modules|bower_components)/
      },
      {
        test: /\.less$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'less-loader']
        })
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader']
        })
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('app.css'),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  ],

  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      // 'react': __dirname + '/source/scripts/react.min.js',
      // 'redux': __dirname + '/source/scripts/redux.min.js',
      // 'react-dom': __dirname + '/source/scripts/react-dom.min.js',
      // 'react-redux': __dirname + '/source/scripts/react-redux.min.js',
      // 'redux-thunk': __dirname + '/source/scripts/redux-thunk.min.js'
    }
  }
};
