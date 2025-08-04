const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      main: './proyecto/static/js/main.js',
      dashboard: './proyecto/static/js/modules/dashboard.js',
      actividades: './proyecto/static/js/modules/actividades.js',
      aforos: './proyecto/static/js/modules/aforos.js',
      potreros: './proyecto/static/js/modules/potreros.js',
      ganado: './proyecto/static/js/modules/ganado.js',
      clima: './proyecto/static/js/modules/clima.js'
    },
    output: {
      path: path.resolve(__dirname, 'proyecto/static/dist'),
      filename: isProduction ? '[name].[contenthash].min.js' : '[name].js',
      clean: true
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader'
          ]
        }
      ]
    },
    plugins: [
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: '[name].[contenthash].min.css'
        })
      ] : [])
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction
            }
          }
        })
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'proyecto/static/js')
      }
    }
  };
};