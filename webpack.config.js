const path = require('path');
const { webpack } = require('webpack');
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
    mode: "development",
    entry: {
        main: './src/index.ts',
        editor: '/src/editor.ts',
        learn: '/src/learn.ts'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.md$/i,
                type: 'asset/source',
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
	optimization: {
        chunkIds: 'deterministic',
	},
    output: {
        filename: '[name].bundle.js',
        chunkFilename: 'chunk/[id].chunk.js',
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