const path = require('path');
const { webpack } = require('webpack');
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
    mode: "development",
    entry: './src/index.ts',
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
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    optimization: {
        usedExports: true, // <- remove unused function
        minimize: true,
        minimizer: [new TerserPlugin()]
    },
    devServer: {
        static: './dist',
    },
    plugins: [
        // new BundleAnalyzerPlugin(),
    ]
};