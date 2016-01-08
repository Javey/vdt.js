var fs = require('fs'),
    utils = require('./lib/utils'),
    Vdt = require('./lib/vdt'),
    compile = require('./lib/compile');

var defaultOptions = {
    doctype: '<!DOCTYPE html>',
    force: false,
    autoReturn: true,
    extname: 'vdt',
    views: 'views'
};

function setDefaults(key, value) {
    var options = {};
    if (typeof key === 'string') {
        options[key] = value;
    } else {
        options = key;
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

function renderFile(file, options, callback) {
    setDefaults({
        extname: options.settings['view engine'],
        views: options.settings['views'],
        force: !options.settings['view cache']
    });
    try {
        var template = compile(file),
            vdt = Vdt(template);
        return callback(null, defaultOptions.doctype + '\n' + vdt.renderString(options));
    } catch (e) {
        return callback(e);
    }
}

module.exports = Vdt;
module.exports.middleware = require('./lib/middleware');
module.exports.renderFile = renderFile;
module.exports.setDefaults = setDefaults;
module.exports.getDefaults = getDefaults;
