var commonjs = require('rollup-plugin-commonjs');
var nodeResolve = require('rollup-plugin-node-resolve');
var replace = require('rollup-plugin-replace');

module.exports = {
    entry: 'src/browserify.js',
    dest: 'dist/vdt.js',
    format: 'umd',
    moduleName: 'Vdt',
    external: ['fs', 'path', 'url'],
    legacy: true,
    plugins: [
        nodeResolve({jsnext: true, main: true, browser: true}),
        commonjs(),
        replace({
            'process.env.NODE_ENV': JSON.stringify('production')
        })
    ]
};
