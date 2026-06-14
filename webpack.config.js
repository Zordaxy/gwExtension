const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
    entry: {
        // CSS is not bundled: main.css ships to the page via the manifest
        // content_scripts.css (copied by CopyPlugin), and popup.css via popup.html.
        bundle: './src/main.js',
        popup: './src/popup.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: './src/assets' },
                { from: './src/css' },
            ],
        })
    ],
    devtool: 'inline-source-map',
    optimization: {
        minimize: false
    },
    resolve: {
        alias: {
            js: path.resolve(__dirname, 'src/js'),  // Maps the `js` alias to `src/js`
            data: path.resolve(__dirname, 'src/data')  // Maps the `js` alias to `src/js`
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        "presets": [
                            ["@babel/preset-env",
                                {
                                    // No core-js polyfills: the extension only runs in
                                    // current Chrome/Firefox, which support everything used.
                                    "useBuiltIns": false,
                                    "targets": "last 2 Chrome versions, last 2 Firefox versions",
                                    "modules": false
                                }]
                        ]
                    }
                }
            }
        ]
    }
};