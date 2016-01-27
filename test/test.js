var Parser = require('../src/lib/parser');
var Stringifier = require('../src/lib/stringifier');
var util = require('util');
var Utils = require('../src/lib/utils');

var parser = new Parser();
var stringifier = new Stringifier();

var source = "<script type='text/javascript'>\n\
    var a = 1;\n\
    console.log(a);\n\
    if (a < 2) {\n\
        console.log('less than {{ a < 2 'a' : 'b' }}');\n\
    }\n\
</script>\n\
";

Utils.setDelimiters(['{{', '}}']);

console.log(util.inspect(parser.parse(source), {showHidden: true, depth: null}));
console.log(stringifier.stringify(parser.parse(source)))

function a(obj, _Vdt, blocks) {
    _Vdt || (_Vdt = Vdt);
    obj || (obj = {});
    blocks || (blocks = {});
    var h = _Vdt.virtualDom.h, widgets = this.widgets || (this.widgets = {}), _blocks = {}, __blocks = {},
        extend = _Vdt.utils.extend;
    obj.require = _Vdt.utils.require || (typeof require === "undefined" ? _Vdt.utils.noRequire : require);
    with (obj) {
        return h('div',null, [test])
    }
}

_Vdt || (_Vdt = Vdt);
obj || (obj = {});
blocks || (blocks = {});
var h = _Vdt.virtualDom.h, widgets = this.widgets || (this.widgets = {}), _blocks = {}, __blocks = {},
    extend = _Vdt.utils.extend;
obj.require = _Vdt.utils.require || (typeof require === "undefined" ? _Vdt.utils.noRequire : require);
with (obj) {
    var header = require('../src/views/header');

    return h('html',null, ['\n', h('head',null, ['\n    ', h('meta',{'charset': 'utf-8'}, []), '\n    ', h('title',null, [(_blocks.title = function(parent) {return [];}) && (__blocks.title = function(parent) {
        var self = this;
        return blocks.title ? blocks.title.call(this, function() {
            return _blocks.title.call(self, parent);
        }) : _blocks.title.call(this, parent);
    }) && __blocks.title.call(this)]), '\n    ', (_blocks.css = function(parent) {return ['\n        ', h('link',{'rel': 'stylesheet', 'type': 'type/css', 'href': '/src/all.css'}, []), '\n    '];}) && (__blocks.css = function(parent)
    {
        var self = this;
        return blocks.css ? blocks.css.call(this, function() {
            return _blocks.css.call(self, parent);
        }) : _blocks.css.call(this, parent);
    }) && __blocks.css.call(this), '\n']), '\n', h('body',{'className':  (_blocks.bodyClass = function(parent) {return [];}) && (__blocks.bodyClass = function(parent) {
        var self = this;
        return blocks.bodyClass ? blocks.bodyClass.call(this, function() {
            return _blocks.bodyClass.call(self, parent);
        }) : _blocks.bodyClass.call(this, parent);
    }) && __blocks.bodyClass.call(this)[0] }, ['\n    ', (_blocks.body = function(parent) {
        return ['\n        ', (_blocks.header = function(parent) {
            return ['\n            ', (function(blocks) {
                var _blocks = {}, __blocks = extend({}, blocks), _obj = {'arguments': null} || {};
                if (_obj.hasOwnProperty("arguments")) {
                    _obj = extend({}, _obj.arguments === null ? obj : _obj.arguments, _obj);
                    delete _obj.arguments;
                }
                return header.call(this, _obj, _Vdt, (_blocks.logoConsole = function(parent) {
                        return [(_blocks.logoConsole = function(parent) {
                            return [];
                        }) && (__blocks.logoConsole = function(parent) {
                            var self = this;
                            return blocks.logoConsole ? blocks.logoConsole.call(this, function() {
                                return _blocks.logoConsole.call(self, parent);
                            }) : _blocks.logoConsole.call(this, parent);
                        }) && __blocks.logoConsole.call(this)];
                    }) && (__blocks.logoConsole = function(parent) {
                        var self = this;
                        return blocks.logoConsole ? blocks.logoConsole.call(this, function() {
                            return _blocks.logoConsole.call(self, parent);
                        }) : _blocks.logoConsole.call(this, parent);
                    }) && __blocks)
            }).call(this, {}), '\n        '];
        }) && (__blocks.header = function(parent) {
            var self = this;
            return blocks.header ? blocks.header.call(this, function() {
                return _blocks.header.call(self, parent);
            }) : _blocks.header.call(this, parent);
        }) && __blocks.header.call(this), '\n        ', (_blocks.main = function(parent) {
            return ['\n            ', h('article', {'className': 'c-main'}, ['\n                ', (_blocks.sidebar = function(parent) {
                return ['\n
                    '];}) && (__blocks.sidebar = function(parent) {
                var self = this;
                return blocks.sidebar ? blocks.sidebar.call(this, function() {
                    return _blocks.sidebar.call(self, parent);
                }) : _blocks.sidebar.call(this, parent);
            }) && __blocks.sidebar.call(this), '\n            ']), '\n        '];
        }) && (__blocks.main = function(parent) {
            var self = this;
            return blocks.main ? blocks.main.call(this, function() {
                return _blocks.main.call(self, parent);
            }) : _blocks.main.call(this, parent);
        }) && __blocks.main.call(this), '\n    '];
    }) && (__blocks.body = function(parent) {
        var self = this;
        return blocks.body ? blocks.body.call(this, function() {
            return _blocks.body.call(self, parent);
