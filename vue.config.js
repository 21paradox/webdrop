const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      // configuration options
      fallback: {
        "path": false,
        stream: require.resolve("stream-browserify"),
        "crypto": require.resolve("crypto-browserify")
        // "stream": false
      },
      //  alias: {
      //   process: "process/browser"
      // } 
    }, 
    plugins: [
      //...
      new webpack.ProvidePlugin({
        process: 'process/browser.js',
      }),
      new webpack.ProvidePlugin({
        //...
        Buffer: ['buffer', 'Buffer']
      }), 
    ],
  }
})

