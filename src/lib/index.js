import fs from 'fs';
import * as utils from './utils';
import Vdt from './vdt';
import compile from './compile';
import middleware from './middleware';

utils.require = compile;

const defaultOptions = {
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

Vdt.utils = utils;
Vdt.middleware = middleware; 
Vdt.renderFile = renderFile;
Vdt.__express = __express;
Vdt.setDefaults = setDefaults;
Vdt.getDefaults = getDefaults;

export default Vdt;
