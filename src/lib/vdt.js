var parser = new (require('./parser')),
    stringifier = new (require('./stringifier')),
    virtualDom = require('virtual-dom');

var Vdt = function(source) {
    var templateFn, tree, node, self, _data;

    templateFn = compile(source);

    return {
        render: function(data, thisArg) {
            self = thisArg;
            this.data = data;
            tree = templateFn.call(self, this.data, Vdt);
            node = virtualDom.create(tree);
            return node;
        },

        update: function(data) {
            if (arguments.length) {
                this.data = data;
            }
            var newTree = templateFn.call(self, this.data, Vdt),
                patches = virtualDom.diff(tree, newTree);
            node = virtualDom.patch(node, patches);
            tree = newTree;
            return node;
        },

        /**
         * Restore the data, so you can modify it directly.
         */
        data: {}
    };
};

function compile(source) {
    var templateFn;

    switch (typeof source) {
        case 'string':
            var ast = parser.parse(source),
                hscript = stringifier.stringify(ast);

            hscript = 'var h = Vdt.virtualDom.h;\nwith(obj || {}) {' + hscript + '};';
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