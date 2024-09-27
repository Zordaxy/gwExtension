const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
    entry: [
        './src/main.js',
        './src/css/main.css'
    ],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: "Webpack Output",
        }),
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
                                    "useBuiltIns": "entry",
                                    "corejs": "3.8",
                                    "targets": {
                                        "browsers": "defaults, not ie 11, not ie_mob 11"
                                    },
                                    "modules": false
                                }]
                        ]
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: "style-loader"
                    },
                    {
                        loader: "css-loader",
                        options: {
                            modules: true,
                            importLoaders: 1,
                            sourceMap: true,
                        }
                    }
                ]
            }
        ]
    }
};