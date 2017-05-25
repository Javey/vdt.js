'use strict';

exports.__esModule = true;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

var _vdt = require('./vdt');

var _vdt2 = _interopRequireDefault(_vdt);

var _compile = require('./compile');

var _compile2 = _interopRequireDefault(_compile);

var _middleware = require('./middleware');

var _middleware2 = _interopRequireDefault(_middleware);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

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
    var template = (0, _compile2['default'])(file),
        vdt = (0, _vdt2['default'])(template);
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

_vdt2['default'].middleware = _middleware2['default'];
_vdt2['default'].renderFile = renderFile;
_vdt2['default'].__express = __express;
_vdt2['default'].setDefaults = setDefaults;
_vdt2['default'].getDefaults = getDefaults;

exports['default'] = _vdt2['default'];