var parser = new (require('./parser')),
    stringifier = new (require('./stringifier')),
    // miss = require('miss'),
    miss = require('inferno'),
    utils = require('./utils');

var Vdt = function(source, options) {
    var node = document.createElement('div');
    var vdt = {
        render: function(data) {
            vdt.renderTree.apply(vdt, arguments); 
            vdt.node = node;
            miss.render(vdt.tree, node);
            return vdt.node;
        },

        renderTree: function(data) {
            if (arguments.length) {
                vdt.data = data;
            }
            vdt.data.vdt = vdt;
            // pass vdt as `this`, does not dirty data.
            vdt.tree = vdt.template.call(vdt, vdt.data, Vdt);
            return vdt.tree;
        },

        renderString: function(data) {
            var node = vdt.render.apply(vdt, arguments);
            return node.outerHTML || node.toString();
        },

        update: function(data) {
            var oldTree = vdt.tree;
            console.time('a')
            // vdt.renderTree.apply(vdt, arguments);
            vdt.tree = vdt.template(vdt.data, Vdt);
            console.timeEnd('a')
            // vdt.node = miss.patch(oldTree, vdt.tree);
            miss.render(vdt.tree, node);
            console.timeEnd('a')
            return vdt.node;
        },

        /**
         * Restore the data, so you can modify it directly.
         */
        data: {},
        tree: {},
        patches: {},
        widgets: {},
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
    // vdt.data.vdt = vdt;

    return vdt;
};

function compile(source, options) {
    var templateFn;

    // backward compatibility v0.2.2
    if (options === true || options === false) {
        options = {autoReturn: options};
    }

    options = utils.extend({
        autoReturn: true,
        onlySource: false,
        delimiters: utils.getDelimiters(),
        // remove `with` statement
        noWith: false,
        // whether rendering on server or not
        server: false
    }, options);

    switch (typeof source) {
        case 'string':
            var ast = parser.parse(source, {delimiters: options.delimiters}),
                hscript = stringifier.stringify(ast, options.autoReturn);

            hscript = [
                '_Vdt || (_Vdt = Vdt);',
                'obj || (obj = {});',
                'blocks || (blocks = {});',
                'var h = _Vdt.miss.h, hc = _Vdt.miss.hc, widgets = this && this.widgets || {}, _blocks = {}, __blocks = {},',
                    'extend = _Vdt.utils.extend, _e = _Vdt.utils.error,' +
                    (options.server ? 
                        'require = function(file) { return _Vdt.utils.require(file, "' + 
                            options.filename.replace(/\\/g, '\\\\') + 
                        '") }, ' : 
                        ''
                    ) +
                    'self = this.data, scope = obj;',
                options.noWith ? hscript : [
                    'with (obj) {',
                        hscript,
                    '}'
                ].join('\n')
            ].join('\n');
            templateFn = options.onlySource ? function() {} : new Function('obj', '_Vdt', 'blocks', hscript);
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
Vdt.miss = miss;
Vdt.miss.h = miss.createVNode;
Vdt.compile = compile;
Vdt.utils = utils;
Vdt.setDelimiters = utils.setDelimiters;
Vdt.getDelimiters = utils.getDelimiters;

// for compatibility v1.0
Vdt.virtualDom = miss; 

module.exports = Vdt;
