var parser = new (require('./parser')),
    stringifier = new (require('./stringifier')),
    virtualDom = require('virtual-dom'),
    Delegator = require('dom-delegator');

var delegator = new Delegator();

var Vdt = function(source, autoReturn) {
    var templateFn, tree, node, self;

    templateFn = compile(source, autoReturn);

    return {
        render: function(data, thisArg) {
            self = thisArg;
            this.data = data;
            tree = templateFn.call(self, this.data, Vdt);
            node = virtualDom.create(tree);
            return node;
        },

        update: function(data, thisArg) {
            if (arguments.length) {
                this.data = data;
                if (arguments.length > 1) {
                    self = thisArg;
                }
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
        data: {},

        getTree: function() {
            return tree;
        },

        setTree: function(_tree) {
            tree = _tree;
        },

        getNode: function() {
            return node;
        },

        setNode: function(_node) {
            node = _node;
        }
    };
};

function compile(source, autoReturn) {
    var templateFn;

    switch (typeof source) {
        case 'string':
            var ast = parser.parse(source),
                hscript = stringifier.stringify(ast, autoReturn);

            hscript = '_Vdt || (_Vdt = Vdt); var h = _Vdt.virtualDom.h;\nwith(obj || {}) {\n' + hscript + '\n};';
            templateFn = new Function('obj', '_Vdt', hscript);
            templateFn.source = 'function(obj, _Vdt) {\n' + hscript + '\n}';
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
Vdt.delegator = delegator;

module.exports = Vdt;