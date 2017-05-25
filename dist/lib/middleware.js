'use strict';

exports.__esModule = true;

exports['default'] = function (options) {
    options = options || {};

    if (typeof options === 'string') {
        options = {
            src: options
        };
    }

    options = Utils.extend({
        src: process.cwd(),
        amd: true,
        force: false,
        autoReturn: true,
        onlySource: true,
        delimiters: Utils.getDelimiters(),
        filterSource: function filterSource(source) {
            return source;
        }
    }, options);

    var cache = {};

    return function (req, res, next) {
        if ('GET' != req.method && 'HEAD' != req.method) return next();

        var path = _url2['default'].parse(req.url).pathname;
        if (!/\.js/.test(path)) return next();

        var vdtFile = _path2['default'].join(options.src, path.replace(/\.js$/, '.vdt'));

        options.force ? compile(0) : stat();

        function error(err) {
            next(err.code === 'ENOENT' ? null : err);
        }

        function compile(mtime) {
            _fs2['default'].readFile(vdtFile, 'utf-8', function (err, contents) {
                if (err) return error(err);
                try {
                    var obj = cache[vdtFile] = _vdt2['default'].compile(contents, options);
                    if (options.amd) {
                        obj.source = 'define(function(require) {\n return ' + obj.source + '\n})';
                    }
                    obj.mtime = mtime;
                    obj.source = options.filterSource(obj.source);
                    return send(obj.source);
                } catch (e) {
                    return error(e);
                }
            });
        }

        function send(source) {
            res.set('Content-Type', 'application/x-javascript').send(source);
        }

        function stat() {
            _fs2['default'].stat(vdtFile, function (err, stats) {
                if (err) return error(err);

                var obj = cache[vdtFile];
                if (obj && obj.mtime) {
                    if (obj.mtime < stats.mtime) {
                        compile(stats.mtime);
                    } else {
                        send(obj.source);
                    }
                } else {
                    compile(stats.mtime);
                }
            });
        }
    };
};

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _vdt = require('./vdt');

var _vdt2 = _interopRequireDefault(_vdt);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _utils = require('./utils');

var Utils = _interopRequireWildcard(_utils);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }