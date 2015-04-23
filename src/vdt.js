var parser = new (require('./lib/parser')),
    stringifier = new (require('./lib/stringifier')),
    virtualDom = require('virtual-dom');

var Vdt = function(source) {
    var ast = parser.parse(source),
        hscript = stringifier.stringify(ast);

    hscript = 'var h = Vdt.virtualDom.h;\nwith(obj) {' + hscript + '};';
    var templateFn = new Function('obj', hscript);

    var tree, node, self;

    var ret = function(data, thisArg) {
        self = thisArg;
        tree = templateFn.call(thisArg, data);
        node = virtualDom.create(tree);
        return node;
    };

    ret.update = function(data) {
        var newTree = templateFn.call(self, data),
            patches = virtualDom.diff(tree, newTree);
        node = virtualDom.patch(node, patches);
        tree = newTree;
        return node;
    };

    ret.source = 'function(obj) {\n' + hscript + '\n}';

    return ret;
};

Vdt.parser = parser;
Vdt.stringifier = stringifier;
Vdt.virtualDom = virtualDom;
Vdt.compile = Vdt;

module.exports = Vdt;