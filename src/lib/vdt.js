var parser = new (require('./parser')),
    stringifier = new (require('./stringifier')),
    virtualDom = require('virtual-dom'),
    utils = require('./utils'),
    Delegator = require('dom-delegator');

var delegator = new Delegator();

var Vdt = function(source, options) {
    var vdt = {
        render: function(data) {
            if (arguments.length) {
                vdt.data = data;
            }
            vdt.data.vdt = vdt;
            vdt.tree = vdt.template.call(vdt.data, vdt.data, Vdt);
            vdt.node = virtualDom.create(vdt.tree);
            return vdt.node;
        },

        update: function(data) {
            if (arguments.length) {
                vdt.data = data;
            }
            vdt.data.vdt = vdt;
            var newTree = vdt.template.call(vdt.data, vdt.data, Vdt);
            vdt.patches = virtualDom.diff(vdt.tree, newTree);
            vdt.node = virtualDom.patch(vdt.node, vdt.patches);
            vdt.tree = newTree;
            return vdt.node;
        },

        /**
         * Restore the data, so you can modify it directly.
         */
        data: {},
        tree: {},
        patches: {},
        node: null,
        template: compile(source, options),

        getTree: function() {
            return vdt.tree;
        },

        setTree: function(tree) {
            vdt.tree = tree;
        },

        getNode: function() {
            return vdt.node;
        },

        setNode: function(node) {
            vdt.node = node;
        }
    };

    // reference cycle vdt
    vdt.data.vdt = vdt;

    return vdt;
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
                'var h = _Vdt.virtualDom.h, widgets = this.widgets || (this.widgets = {}), _blocks = {}, __blocks = {},',
                    'extend = _Vdt.utils.extend;',
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
Vdt.utils = utils;

module.exports = Vdt;
