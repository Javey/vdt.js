'use strict';

exports.__esModule = true;

exports['default'] = function (file, baseFile) {
    var Vdt = require('../index');
    if (!_path2['default'].isAbsolute(file)) {
        if (file[0] === '.' && baseFile != undefined) {
            file = _path2['default'].resolve(_path2['default'].dirname(baseFile), file);
        } else if (Vdt.getDefaults('views') != null) {
            file = _path2['default'].join(Vdt.getDefaults('views'), file);
        } else {
            file = _path2['default'].resolve(file);
        }
    }
    if (_path2['default'].extname(file).substring(1) !== Vdt.getDefaults('extname')) {
        file += '.' + Vdt.getDefaults('extname');
    }

    return Vdt.getDefaults('force') ? compile(0) : stat();

    function compile(mtime) {
        try {
            var contents = _fs2['default'].readFileSync(file).toString();
            cache[file] = Vdt.compile(contents, {
                server: true,
                filename: file
            });
            cache[file].mtime = mtime;
            return function () {
                try {
                    return cache[file].apply(this, arguments);
                } catch (e) {
                    e.source || (e.source = []);
                    e.source.push('/* file: ' + file + ' */\n' + cache[file].source);
                    throw e;
                }
            };
        } catch (e) {
            e.message += ' in file: ' + file;
            throw e;
        }
    }

    function stat() {
        var stats = _fs2['default'].statSync(file);
        var obj = cache[file];
        if (obj && obj.mtime) {
            if (obj.mtime < stats.mtime) {
                return compile(stats.mtime);
            } else {
                return obj;
            }
        } else {
            return compile(stats.mtime);
        }
    }
};

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var cache = {};