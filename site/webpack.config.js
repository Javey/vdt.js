var webpackConfig = require('kpc/src/webpack.config');
var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');

webpackConfig.entry.all = path.resolve(__dirname, './js/app/routes.js');
webpackConfig.output.path = path.resolve(__dirname, './dist');
// webpackConfig.output.filename = '[name].[chunkhash:8].js';
process.disableHardSource = true;
process.disableHMR = true;
webpackConfig.module.rules.push({
    test: /\.json$/,
    loader: 'json-loader'
});
webpackConfig.module.noParse = [
    /node_modules\/benchmark/
];
webpackConfig.module.rules[0].exclude = [
    /node_modules(?!([\/\\]kpc)|([\/\\]misstime))/, 
    /node_modules[\/\\]kpc.*lib/
];
// webpackConfig.plugins = webpackConfig.plugins.filter(item => {
    // return !(item instanceof webpack.optimize.UglifyJsPlugin);
// });
webpackConfig.plugins.push(
    // new webpack.ProvidePlugin({
        // Intact: 'kpc/src/js/lib/intact',
        // _: 'kpc/src/js/lib/underscore',
    // }),
    new HtmlWebpackPlugin({
        template: path.resolve(__dirname, './index.html'),
    }),
);

webpackConfig.devServer = {
    contentBase: [path.resolve(__dirname, './dist'), path.resolve(__dirname, '../')],
    port: 9001,
};


module.exports = webpackConfig;

// const webpack = require('webpack');
// const path = require('path');
// const HtmlWebpackPlugin = require('html-webpack-plugin');

// module.exports = {
    // entry: {
        // 'bundle': path.resolve(__dirname, './js/app/routes.js'),
        // // 'bundle': './js/app/routes.js',
    // },
    // output: {
        // path: path.resolve(__dirname, './dist'),
        // filename: '[name].js',
        // chunkFilename: 'static/chunk/[chunkhash].js',
        // // publicPath: process.env.NODE_ENV === 'production' ? './dist/' : '/dist/'
    // },
    // devtool: process.env.NODE_ENV !== 'production' ? '#inline-source-map' : undefined,
    // module: {
        // rules: [
            // {
                // test: /\.js$/,
                // use: [
                    // {
                        // loader: 'babel-loader',
                        // options: {
                            // presets: [["es2015", {"loose": true}], "stage-0"],
                            // plugins: ['add-module-exports', 'transform-decorators-legacy']
                        // }
                    // }
                // ]
            // },
            // {
                // test: /\.vdt$/,
                // use: [
                    // {
                        // loader: 'babel-loader',
                    // },
                    // {
                        // loader: 'vdt-loader',
                        // options: {
                            // delimiters: ['{{', '}}'],
                            // skipWhitespace: true,
                            // noWith: true,
                        // }
                    // },
                // ]
            // },
            // {
                // test: /\.(styl|css)$/,
                // use: [
                    // {
                        // loader: 'style-loader'
                    // },
                    // {
                        // loader: 'css-loader'
                    // },
                    // {
                        // loader: 'stylus-loader',
                        // options: {
                            // 'include css': true
                        // }
                    // },
                // ]
            // },
            // {
                // test: /\.(woff2?|eot|ttf|otf|svg)(\?.*)?$/,
                // use: [
                    // {
                        // loader: 'file-loader',
                        // options: {
                            // outputPath: 'fonts/',
                        // }
                    // }
                // ]
            // },
        // ]
    // },
    // resolve: {
        // extensions: ['.js', '.vdt'],
        // alias: {
            // 'kpc': 'kpc/@stylus'
        // }
        // // mainFields: ['module', 'browserify', 'browser', 'main']
    // },
    // resolveLoader: {
        // moduleExtensions: ['-loader']
    // },
    // plugins: [
        // new webpack.optimize.CommonsChunkPlugin({
            // children: true,
            // async: true,
            // minChunks: 3
        // }),
        // new webpack.ProvidePlugin({
            // Intact: 'intact',
            // $: 'jquery'
        // }),
        // new HtmlWebpackPlugin({
            // template: path.resolve(__dirname, './index.html'),
        // }),
    // ],
    // devServer: {
        // contentBase: [path.resolve(__dirname, './dist'), path.resolve(__dirname, '../')],
        // port: 9001,
    // }
// };

// if (process.env.NODE_ENV === 'production') {
    // module.exports.plugins.push(new webpack.optimize.UglifyJsPlugin({
        // compress: {
            // warnings: false
        // }
    // }));
// }
