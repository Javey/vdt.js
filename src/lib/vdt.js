var parser = new (require('./parser')),
    stringifier = new (require('./stringifier')),
    virtualDom = require('virtual-dom'),
    utils = require('./utils'),
    Delegator = require('dom-delegator');

var delegator = new Delegator();

var Vdt = function(source, options) {
    var templateFn, tree, node;

    templateFn = compile(source, options);

    return {
        render: function(data) {
            this.data = data;
            tree = templateFn.call(data, data, Vdt);
            node = virtualDom.create(tree);
            return node;
        },

        update: function(data) {
            if (arguments.length) {
                this.data = data;
            }
            var newTree = templateFn.call(this.data, this.data, Vdt),
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

function compile(source, options) {
    var templateFn;

    // backward compatibility v0.2.2
    if (options === true || options === false) {
        options = {autoReturn: options};
    } else {
        options = utils.extend({
            autoReturn: true
        }, options);
    }

    switch (typeof source) {
        case 'string':
            var ast = parser.parse(source),
                hscript = stringifier.stringify(ast, options.autoReturn);

            hscript = [
                '_Vdt || (_Vdt = Vdt);',
                'blocks || (blocks = {});',
                'var h = _Vdt.virtualDom.h, widgets = this.widgets || {}, _blocks = {}, __blocks = {},',
                    'hasOwn = Object.prototype.hasOwnProperty,',
                    'extend = function(dest, source) {',
                        'if (source) {',
                            'for (var key in source) {',
                                'if (hasOwn.call(source, key)) {dest[key] = source[key];}',
                            '}',
                        '}',
                        'return dest;',
                    '};',
                'with (obj || {}) {',
                    hscript,
                '}'
            ].join('\n');
            templateFn = new Function('obj', '_Vdt', 'blocks', hscript);
            templateFn.source = 'function(obj, _Vdt, blocks) {\n' + hscript + '\n}';
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