import Parser from './parser';
import Stringifier from './stringifier';
import * as utils from './utils';
import * as miss from 'misstime';

const parser = new Parser();
const stringifier = new Stringifier();

export default function Vdt(source, options) {
    if (!(this instanceof Vdt)) return new Vdt(source, options);

    this.template = compile(source, options);
    this.data = null;
    this.vNode = null;
    this.node = null;
    this.widgets = {};
    this.blocks = {};
}
Vdt.prototype = {
    constructor: Vdt,

    render(data, parentDom, queue, parentVNode, isSVG, blocks) {
        this.renderVNode(data, blocks);
        this.node = miss.render(this.vNode, parentDom, queue, parentVNode, isSVG);

        return this.node;
    },

    renderVNode(data, blocks) {
        if (data !== undefined) {
            this.data = data;
        }
        if (blocks !== undefined) {
            this.blocks = blocks;
        }
        this.vNode = this.template(this.data, Vdt, this.blocks);

        return this.vNode;
    },

    renderString(data, blocks) {
        this.renderVNode(data, blocks);

        return miss.renderString(this.vNode, null, Vdt.configure().disableSplitText);
    },

    update(data, parentDom, queue, parentVNode, isSVG, blocks) {
        var oldVNode = this.vNode;
        this.renderVNode(data, blocks);
        this.node = miss.patch(oldVNode, this.vNode, parentDom, queue, parentVNode, isSVG);

        return this.node;
    },

    hydrate(data, dom, queue, parentDom, parentVNode, isSVG, blocks) {
        this.renderVNode(data, blocks);
        miss.hydrate(this.vNode, dom, queue, parentDom, parentVNode, isSVG);
        this.node = this.vNode.dom;

        return this.node;
    },

    destroy() {
        miss.remove(this.vNode);
    }
};

function compile(source, options) {
    var templateFn;

    // backward compatibility v0.2.2
    if (options === true || options === false) {
        options = {autoReturn: options};
    }

    options = utils.extend({}, utils.configure(), options);

    switch (typeof source) {
        case 'string':
            var ast = parser.parse(source, options),
                hscript = stringifier.stringify(ast, options.autoReturn);

            hscript = [
                '_Vdt || (_Vdt = Vdt);',
                'obj || (obj = {});',
                'blocks || (blocks = {});',
                'var h = _Vdt.miss.h, hc = _Vdt.miss.hc, hu = _Vdt.miss.hu, widgets = this && this.widgets || {}, _blocks = {}, __blocks = {},',
                    '__u = _Vdt.utils, extend = __u.extend, _e = __u.error, _className = __u.className,',
                    '__o = __u.Options, _getModel = __o.getModel, _setModel = __o.setModel,',
                    '_setCheckboxModel = __u.setCheckboxModel, _detectCheckboxChecked = __u.detectCheckboxChecked,',
                    '_setSelectModel = __u.setSelectModel,',
                    (options.server ? 
                        'require = function(file) { return _Vdt.require(file, "' + 
                            options.filename.replace(/\\/g, '\\\\') + 
                        '") }, ' : 
                        ''
                    ) +
                    'self = this.data, scope = obj, Animate = self && self.Animate, parent = this._super',
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
Vdt.compile = compile;
Vdt.utils = utils;
Vdt.setDelimiters = utils.setDelimiters;
Vdt.getDelimiters = utils.getDelimiters;
Vdt.configure = utils.configure;

// for compatibility v1.0
Vdt.virtualDom = miss; 
