const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, '..', 'dist'),
        filename: 'mvt-painter.js',
        library: 'mvtpainter',
        libraryTarget: 'umd'
    },
    devtool: 'sourcemap',
    mode: 'development'
};
