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
