'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports['default'] = Vdt;

var _parser = require('./parser');

var _parser2 = _interopRequireDefault(_parser);

var _stringifier = require('./stringifier');

var _stringifier2 = _interopRequireDefault(_stringifier);

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

var _miss = require('miss');

var miss = _interopRequireWildcard(_miss);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var parser = new _parser2['default']();
var stringifier = new _stringifier2['default']();

function Vdt(source, options) {
    if (!(this instanceof Vdt)) return new Vdt(source, options);

    this.template = compile(source, options);
    this.data = null;
    this.vNode = null;
    this.node = null;
    this.widgets = {};
}
Vdt.prototype = {
    constructor: Vdt,

    render: function render(data) {
        this.renderVNode(data);
        this.node = miss.render(this.vNode);

        return this.node;
    },
    renderVNode: function renderVNode(data) {
        if (data !== undefined) {
            this.data = data;
        }
        this.vNode = this.template(this.data, Vdt);

        return this.vNode;
    },
    renderString: function renderString(data) {
        var node = this.render(data);

        return node.outerHTML || node.toString();
    },
    update: function update(data) {
        var oldVNode = this.vNode;
        this.renderVNode(data);
        this.node = miss.patch(oldVNode, this.vNode);

        return this.node;
    }
};

function compile(source, options) {
    var templateFn;

    // backward compatibility v0.2.2
    if (options === true || options === false) {
        options = { autoReturn: options };
    }

    options = utils.extend({}, utils.configure(), options);

    switch (typeof source === 'undefined' ? 'undefined' : _typeof(source)) {
        case 'string':
            var ast = parser.parse(source, { delimiters: options.delimiters }),
                hscript = stringifier.stringify(ast, options.autoReturn);

            hscript = ['_Vdt || (_Vdt = Vdt);', 'obj || (obj = {});', 'blocks || (blocks = {});', 'var h = _Vdt.miss.h, hc = _Vdt.miss.hc, widgets = this && this.widgets || {}, _blocks = {}, __blocks = {},', 'extend = _Vdt.utils.extend, _e = _Vdt.utils.error,' + (options.server ? 'require = function(file) { return _Vdt.utils.require(file, "' + options.filename.replace(/\\/g, '\\\\') + '") }, ' : '') + 'self = this.data, scope = obj;', options.noWith ? hscript : ['with (obj) {', hscript, '}'].join('\n')].join('\n');
            templateFn = options.onlySource ? function () {} : new Function('obj', '_Vdt', 'blocks', hscript);
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

// for compatibility v1.0
Vdt.virtualDom = miss;