var parser = new (require('./lib/parser')),
    stringifier = new (require('./lib/stringifier')),
    virtualDom = require('virtual-dom');

var Vdt = function(source) {
    var templateFn, tree, node, self;

    templateFn = compile(source);

    return {
        render: function(data, thisArg) {
            self = thisArg;
            tree = templateFn.call(self, data, Vdt);
            node = virtualDom.create(tree);
            return node;
        },

        update: function(data) {
            var newTree = templateFn.call(self, data, Vdt),
                patches = virtualDom.diff(tree, newTree);
            node = virtualDom.patch(node, patches);
            tree = newTree;
            return node;
        }
    };
};

function compile(source) {
    var templateFn;

    switch (typeof source) {
        case 'string':
            var ast = parser.parse(source),
                hscript = stringifier.stringify(ast);

            hscript = 'var h = Vdt.virtualDom.h;\nwith(obj) {' + hscript + '};';
            templateFn = new Function('obj', 'Vdt', hscript);
            templateFn.source = 'function(obj, Vdt) {\n' + hscript + '\n}';
            break;
        case 'function':
            templateFn = source;
            break;
        default:
            throw new Error('Expect a string or function');
    }

    return templateFn;
}

Vdt.parser = parser;
Vdt.stringifier = stringifier;
Vdt.virtualDom = virtualDom;
Vdt.compile = compile;

module.exports = Vdt;