var fs = require('fs'),
    utils = require('./utils'),
    Vdt = require('./vdt'),
    compile = require('./compile'),
    middleware = require('./middleware');

var defaultOptions = {
    doctype: '<!DOCTYPE html>',
    force: false,
    autoReturn: true,
    extname: 'vdt',
    views: 'views',
    delimiters: utils.getDelimiters() 
};

function setDefaults(key, value) {
    var options = {};
    if (typeof key === 'string') {
        options[key] = value;
    } else {
        options = key;
    }
    if (options.hasOwnProperty('delimiters')) {
        utils.setDelimiters(options['delimiters']);
    }
    return utils.extend(defaultOptions, options);
}

function getDefaults(key) {
    if (key == null) {
        return defaultOptions;
    } else {
        return defaultOptions[key];
    }
}

function renderFile(file, options) {
    options || (options = {});
    utils.extend(defaultOptions, options.settings);
    var template = compile(file),
        vdt = Vdt(template);
    return defaultOptions.doctype + '\n' + vdt.renderString(options);
}

function __express(file, options, callback) {
    utils.extend(options.settings, {
        extname: options.settings['view engine'],
        views: options.settings['views'],
        force: !options.settings['view cache']
    });
    try {
        return callback(null, renderFile(file, options));
    } catch (e) {
        return callback(e);
    }
}

module.exports = Vdt;
module.exports.middleware = middleware; 
module.exports.renderFile = renderFile;
module.exports.__express = __express;
module.exports.setDefaults = setDefaults;
module.exports.getDefaults = getDefaults;
