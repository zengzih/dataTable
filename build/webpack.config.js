const webpack = require('webpack');
const path = require('path');
const htmlwebpackplugin = require('html-webpack-plugin');
const cleanwebpackplugin = require('clean-webpack-plugin');

module.exports = {
  entry: './src/main.js',
  output: {
    filename: "js/dataTable.js",
    path: path.resolve(__dirname, '../dist')
  },
  devServer: {
    open: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: "babel-loader",
            options: { presets:  ['es2015'] }
          }
        ]
      },
      {
        test: /\.css$/,
        use: ['css-loader', 'style-loader']
      }
    ]
  },
  plugins: [
    new htmlwebpackplugin({
      filename: 'index.html',
      template: './src/index.html'
    }),
    new cleanwebpackplugin(['dist']),
    new webpack.LoaderOptionsPlugin({
      options: {
        postcss: [
          //autoprefixer({browsers: browserslist}),
          require('postcss-salad')(require('../salad.config.json'))
        ]
      }
    })
  ]
}