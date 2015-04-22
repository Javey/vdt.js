var parser = new (require('./lib/parser')),
    stringify = new (require('./lib/stringify')),
    virtualDom = require('virtual-dom');

var Vdt = function(source) {
    var ast = parser.parse(source),
        hscript = stringify.stringify(ast);

    hscript = 'var h = Vdt.virtualDom.h;\nwith(obj) {' + hscript + '};';
    var templateFn = new Function('obj', hscript);

    var tree, node;

    var ret = function(data) {
        tree = templateFn(data);
        node = virtualDom.create(tree);
        return node;
    };

    ret.update = function(data) {
        var newTree = templateFn(data),
            patches = virtualDom.diff(tree, newTree);
        node = virtualDom.patch(node, patches);
        tree = newTree;
    };

    ret.source = 'function(obj) {\n' + hscript + '\n}';

    return ret;
};

Vdt.parser = parser;
Vdt.stringify = stringify;
Vdt.virtualDom = virtualDom;

module.exports = Vdt;