const path = require('path');  // <-- Ensure this is at the top

const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
     // In your webpack.config.js, modify the PostCSS loader configuration
    {
        test: /\.css$/,
        use: [
        'style-loader',
        'css-loader',
        {
            loader: 'postcss-loader',
            options: {
            postcssOptions: {
                plugins: [
                'postcss-import', // If you're using imports
                '@tailwindcss/postcss', // Change this line from 'tailwindcss' to '@tailwindcss/postcss'
                'autoprefixer',
                ],
            },
            },
        },
        ],
     },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  devServer: {
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'public'),
    },
    port: 3000,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
