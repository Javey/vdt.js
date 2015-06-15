var url = require('url'),
    Vdt = require('./vdt'),
    fs = require('fs'),
    _ = require('lodash'),
    Path = require('path');

module.exports = function(options) {
    options = options || {};

    if (typeof options === 'string') {
        options = {
            src: options
        }
    }

    options = _.extend({
        amd: true,
        force: false,
        autoReturn: true
    }, options);

    var cache = {};

    return function(req, res, next) {
        if ('GET' != req.method && 'HEAD' != req.method) return next();

        var path = url.parse(req.url).pathname;
        if (!/\.js/.test(path)) return next();

        var vdtFile = Path.join(options.src, path.replace(/\.js$/, '.vdt'));

        options.force ? compile(0) : stat();

        function error(err) {
            next(err.code === 'ENOENT' ? null : err);
        }

        function compile(mtime) {
            var obj = cache[vdtFile] = {};
            fs.readFile(vdtFile, 'utf-8', function(err, contents) {
                if (err) return error(err);
                try {
                    obj.source = Vdt.compile(contents, options.autoReturn).source;
                    if (options.amd) {
                        obj.source = 'define(function(require) {\n return ' + obj.source + '\n})';
                    }
                    obj.mtime = mtime;
                    return send(obj.source);
                } catch (err) {
                    return error(err);
                }
            });
        }

        function send(source) {
            res.set('Content-Type', 'application/x-javascript')
                .send(source);
        }

        function stat() {
            fs.stat(vdtFile, function(err, stats) {
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
    }
};