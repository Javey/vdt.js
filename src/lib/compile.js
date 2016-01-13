var fs = require('fs'),
    Path = require('path');

var cache = {};

module.exports = function(file) {
    var Vdt = require('../index');
    if (!Path.isAbsolute(file)) {
        file = Path.join(Vdt.getDefaults('views'), file);
    }
    if (Path.extname(file).substring(1) !== Vdt.getDefaults('extname')) {
        file += '.' + Vdt.getDefaults('extname');
    }

    return Vdt.getDefaults('force') ? compile(0) : stat();

    function compile(mtime) {
        try {
            var contents = fs.readFileSync(file).toString();
            cache[file] = Vdt.compile(contents);
            cache[file].mtime = mtime;
            return cache[file];
        } catch (e) {
            e.message += ' in file: ' + file;
            throw e;
        }
    }

    function stat() {
        var stats = fs.statSync(file);
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
