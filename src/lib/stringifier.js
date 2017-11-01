/**
 * @fileoverview stringify ast of jsx to js
 * @author javey
 * @date 15-4-22
 */

import * as Utils from './utils';

const {Type, TypeName} = Utils;

const attrMap = (function() {
    var map = {
        'class': 'className',
        'for': 'htmlFor'
    };
    return function(name) {
        return map[name] || name;
    };
})();
    
const normalizeArgs = function(args) {
    var l = args.length - 1;
    for (var i = l; i >= 0; i--) {
        if (args[i] !== 'null') {
            break;
        }
    }
    return (i === l ? args : args.slice(0, i + 1)).join(', '); 
};

export default function Stringifier() {}

Stringifier.prototype = {
    constructor: Stringifier,

    stringify: function(ast, autoReturn) {
        if (arguments.length === 1) {
            autoReturn = true;
        }
        this.autoReturn = !!autoReturn;
        this.enterStringExpression = false;
        return this._visitJSXExpressionContainer(ast, true);
    },

    _visitJSXExpressionContainer: function(ast, isRoot) {
        var str = '', length = ast.length, hasDestructuring = false;
        Utils.each(ast, function(element, i) {
            // if is root, add `return` keyword
            if (this.autoReturn && isRoot && i === length - 1) {
                str += 'return ' + this._visit(element, isRoot);
            } else {
                str += this._visit(element, isRoot);
            }
        }, this);

        if (!isRoot && !this.enterStringExpression) {
            // special for ... syntaxt
            str = Utils.trimLeft(str); 
            if (str[0] === '.' && str[1] === '.' && str[2] === '.') {
                hasDestructuring = true;
                str = str.substr(3); 
            }
            // add [][0] for return /* comment */
            str = 'function() {try {return [' + str + '][0]} catch(e) {_e(e)}}.call(this)';
            // str = 'function() {try {return (' + str + ')} catch(e) {_e(e)}}.call(this)';
            if (hasDestructuring) {
                str = '...' + str;
            }
        }

        return str;
    },

    _visit: function(element, isRoot) {
        element = element || {};
        switch (element.type) {
            case Type.JS:
                return this._visitJS(element, isRoot);
            case Type.JSXElement:
                return this._visitJSXElement(element);
            case Type.JSXText:
                return this._visitJSXText(element);
            case Type.JSXUnescapeText:
                return this._visitJSXUnescapeText(element);
            case Type.JSXExpressionContainer:
                return this._visitJSXExpressionContainer(element.value);
            case Type.JSXWidget:
                return this._visitJSXWidget(element);
            case Type.JSXBlock:
                return this._visitJSXBlock(element, true);
            case Type.JSXVdt:
                return this._visitJSXVdt(element, isRoot);
            case Type.JSXComment:
                return this._visitJSXComment(element);
            default:
                return 'null';
        }
    },

    _visitJS: function(element) {
        return this.enterStringExpression ? 
            '(' + element.value + ')' : 
            element.value; 
    },

    _visitJSXElement: function(element) {
        if (element.value === 'script' || element.value === 'style') {
            if (element.children.length) {
                element.attributes.push({
                    type: Type.JSXAttribute,
                    typeName: TypeName[Type.JSXAttribute],
                    name: 'innerHTML',
                    value: {
                        type: Type.JS,
                        typeName: TypeName[Type.JS],
                        value: this._visitJSXChildrenAsString(element.children)
                    }
                });
                element.children = [];
            }
        }

        var attributes = this._visitJSXAttribute(element, true, true);
        var ret = "h(" + normalizeArgs([
            "'" + element.value + "'", 
            attributes.props, 
            this._visitJSXChildren(element.children),
            attributes.className,
            attributes.key,
            attributes.ref
        ]) + ')';

        return this._visitJSXDirective(element, ret);
    },

    _visitJSXChildren: function(children) {
        var ret = [];
        Utils.each(children, function(child) {
            // if this.element has be handled return directly
            if (child._skip) return;
            ret.push(this._visit(child));
        }, this);

        return ret.length > 1 ? '[' + ret.join(', ') + ']' : (ret[0] || 'null');
    },

    _visitJSXDirective: function(element, ret) {
        var directiveFor = {
            data: null,
            value: 'value',
            key: 'key'
        };
        Utils.each(element.directives, function(directive) {
            switch (directive.name) {
                case 'v-if':
                    ret = this._visitJSXDirectiveIf(directive, ret, element);
                    break;
                case 'v-else-if':
                case 'v-else':
                    if (element._skip) break;
                    throw new Error(directive.name + ' must be led with v-if. At: {line: ' +
                        element.line + ', column: ' + 
                        element.column + '}'
                    );
                case 'v-for':
                    directiveFor.data = this._visitJSXAttributeValue(directive.value);
                    break;
                case 'v-for-value':
                    directiveFor.value = this._visitJSXText(directive.value, true);
                    break;
                case 'v-for-key':
                    directiveFor.key = this._visitJSXText(directive.value, true);
                    break;
                default:
                    break;
            }
        }, this);
        // if exists v-for
        if (directiveFor.data) {
            ret = this._visitJSXDirectiveFor(directiveFor, ret);
        }

        return ret;
    },

    _visitJSXDirectiveIf: function(directive, ret, element) {
        var result = this._visitJSXAttributeValue(directive.value) + ' ? ' + ret + ' : ',
            hasElse = false,
            next = element,
            emptyTextNodes = [], // persist empty text node, skip them if find v-else-if or v-else
            skipNodes = function() {
                Utils.each(emptyTextNodes, function(item) {
                    item._skip = true;
                });
                emptyTextNodes = [];
            };
        while (next = next.next) {
            if (next.type === Utils.Type.JSXText) {
                if (!/^\s*$/.test(next.value)) break;
                // is not the last text node, mark as handled
                else emptyTextNodes.push(next);
            } else if (next.type === Utils.Type.JSXElement ||
                next.type === Utils.Type.JSXWidget ||
                next.type === Utils.Type.JSXVdt
            ) {
                if (!next.directives || !next.directives.length) break;
                var isContinue = false;
                for (var i = 0, l = next.directives.length; i < l; i++) {
                    var dire = next.directives[i],
                        name = dire.name;
                    if (name === 'v-else-if') {
                        // mark this element as handled
                        next._skip = true;
                        result += this._visitJSXAttributeValue(dire.value) + ' ? ' + this._visit(next) + ' : ';
                        isContinue = true;
                        // mark text node before as handled
                        skipNodes();
                        break;
                    } else if (name === 'v-else') {
                        // mark this element as handled
                        next._skip = true;
                        result += this._visit(next);
                        hasElse = true;
                        // mark text node before as handled
                        skipNodes();
                        break;
                    }
                }
                if (!isContinue) break;
            }
        }
        if (!hasElse) result += 'undefined';
        return result;
    },

    _visitJSXDirectiveFor: function(directive, ret) {
        return '_Vdt.utils.map(' + directive.data + ', function(' + directive.value + ', ' + directive.key + ') {\n' +
            'return ' + ret + ';\n' +
        '}, this)';
    },

    _visitJSXChildrenAsString: function(children) {
        var ret = [];
        this.enterStringExpression = true;
        Utils.each(children, function(child) {
            ret.push(this._visit(child));
        }, this);
        this.enterStringExpression = false;
        return ret.join('+');
    },

    _visitJSXAttribute: function(element, individualClassName, individualKeyAndRef) {
        var ret = [],
            attributes = element.attributes,
            className,
            key,
            ref,
            type = 'text',
            hasModel = false,
            addition = {trueValue: true, falseValue: false};
        Utils.each(attributes, function(attr) {
            if (attr.type === Type.JSXExpressionContainer) {
                return ret.push(this._visitJSXAttributeValue(attr));
            }
            var name = attrMap(attr.name),
                value = this._visitJSXAttributeValue(attr.value);
            if ((name === 'widget' || name === 'ref') && attr.value.type === Type.JSXText) {
                // for compatility v1.0
                // convert widget="a" to ref=(i) => widgets.a = i
                // convert ref="a" to ref=(i) => widgets.a = i. For Intact
                ref = 'function(i) {widgets[' + value + '] = i}';
                return;
            } else if (name === 'className') {
                // process className individually
                if (attr.value.type === Type.JSXExpressionContainer) {
                    // for class={ {active: true} }
                    value = '_className(' + value + ')';
                }
                if (individualClassName) {
                    className = value;
                    return;
                }
            } else if (name === 'key' && individualKeyAndRef) {
                key = value;
                return;
            } else if (name === 'ref' && individualKeyAndRef) {
                ref = value;
                return;
            } else if (name === 'v-model') {
                hasModel = value;
                return;
            } else if (name === 'v-model-true') {
                addition.trueValue = value;
                return;
            } else if (name === 'v-model-false') {
                addition.falseValue = value;
                return;
            } else if (name === 'type') {
                // save the type value for v-model of input element
                type = value;
            } else if (name === 'value') {
                addition.value = value;
            }
            ret.push("'" + name + "': " + value);
        }, this);

        if (hasModel) {
            this._visitJSXAttributeModel(element, hasModel, ret, type, addition);
        }

        return {
            props: ret.length ? '{' + ret.join(', ') + '}' : 'null',
            className: className || 'null',
            ref: ref || 'null',
            key: key || 'null'
        };
    },

    _visitJSXAttributeModel: function(element, value, ret, type, addition) {
        var valueName = 'value',
            eventName = 'change'; 
        if (element.type === Type.JSXElement) {
            switch (element.value) {
                case 'input':
                    valueName = 'value';
                    switch (type) {
                        case "'file'":
                            eventName = 'change';
                            break;
                        case "'radio'":
                        case "'checkbox'":
                            var trueValue = addition.trueValue,
                                falseValue = addition.falseValue,
                                inputValue = addition.value;
                            if (Utils.isNullOrUndefined(inputValue)) {
                                ret.push(`checked: _getModel(self, ${value}) === ${trueValue}`);
                                ret.push(`'ev-change': function(__e) {
                                    _setModel(self, ${value}, __e.target.checked ? ${trueValue} : ${falseValue});
                                }`);
                            } else {
                                if (type === "'radio'") {
                                    ret.push(`checked: _getModel(self, ${value}) === ${inputValue}`);
                                    ret.push(`'ev-change': function(__e) { 
                                        _setModel(self, ${value}, __e.target.checked ? ${inputValue} : ${falseValue});
                                    }`);
                                } else {
                                    ret.push(`checked: _detectCheckboxChecked(self, ${value}, ${inputValue})`);
                                    ret.push(`'ev-change': function(__e) { 
                                        _setCheckboxModel(self, ${value}, ${inputValue}, ${falseValue}, __e);
                                    }`);
                                }
                            }
                            return;
                        default:
                            eventName = 'input';
                            break;
                    }
                    break;
                case 'select':
                    ret.push(`value: _getModel(self, ${value})`);
                    ret.push(`'ev-change': function(__e) {
                        _setSelectModel(self, ${value}, __e);
                    }`);
                    return;
                case 'textarea':
                    eventName = 'input';
                    break;
                default:
                    break;
            }
            ret.push(`${valueName}: _getModel(self, ${value})`);
            ret.push(`'ev-${eventName}': function(__e) { _setModel(self, ${value}, __e.target.value) }`);
        } else if (element.type === Type.JSXWidget) {
            ret.push(`value: _getModel(self, ${value})`);
            ret.push(`'ev-$change:value': function(__c, __n) { _setModel(self, ${value}, __n) }`);
        }
    },

    _visitJSXAttributeValue: function(value) {
        return Utils.isArray(value) ? this._visitJSXChildren(value) : this._visit(value);
    },

    _visitJSXText: function(element, noQuotes) {
        var ret = element.value.replace(/([\'\"\\])/g, '\\$1').replace(/[\r\n]/g, '\\n');
        if (!noQuotes) {
            ret = "'" + ret + "'";
        }
        return ret;
    },

    _visitJSXUnescapeText: function(element) {
        return 'hu('+ this._visitJSXExpressionContainer(element.value) +')';
    },

    _visitJSXWidget: function(element) {
        const {blocks, children} = this._visitJSXBlocks(element, false);

        element.attributes.push({name: 'children', value: children});
        element.attributes.push({name: '_blocks', value: blocks});

        var attributes = this._visitJSXAttribute(element, false, false);
        return this._visitJSXDirective(
            element, 
            'h(' + normalizeArgs([
                element.value, 
                attributes.props, 
                'null', 'null',
                attributes.key, 
                attributes.ref
            ]) + ')'
        );
    },

    _visitJSXBlock: function(element, isAncestor) {
        return '(_blocks.' + element.value + ' = function(parent) {return ' + this._visitJSXChildren(element.children) + ';}) && (__blocks.' + element.value + ' = function(parent) {\n' +
            'var self = this;\n' +
            'return blocks.' + element.value + ' ? blocks.' + element.value + '.call(this, function() {\n' +
                'return _blocks.' + element.value + '.call(self, parent);\n' +
            '}) : _blocks.' + element.value + '.call(this, parent);\n' +
        '})' + (isAncestor ? ' && __blocks.' + element.value + '.call(this)' : '');
    },

    _visitJSXBlocks: function(element, isRoot) {
        const blocks = [];
        const children = [];
        Utils.each(element.children, function(child) {
            if (child.type === Type.JSXBlock) {
                blocks.push(this._visitJSXBlock(child, false));
            } else {
                children.push(child);
            }
        }, this);

        const _blocks = {
            type: Type.JS,
            value: blocks.length ? [
                'function(blocks) {',
                '    var _blocks = {}, __blocks = extend({}, blocks);',
                `    return ${blocks.join(' && ')} && __blocks;`,
                `}.call(this, ${isRoot ? 'blocks' : '{}'})`
            ].join('\n') : isRoot ? 'blocks' : 'null'
        };
    
        return {blocks: _blocks, children: children.length ? children : null};
    },

    _visitJSXVdt: function(element, isRoot) {
        const {blocks, children} = this._visitJSXBlocks(element, isRoot);
        element.attributes.push({name: 'children', value: children});
        const ret = [
            '(function() {',
            '    var _obj = ' + this._visitJSXAttribute(element, false, false).props + ';',
            '    if (_obj.hasOwnProperty("arguments")) {',
            '        extend(_obj, _obj.arguments === true ? obj : _obj.arguments);',
            '        delete _obj.arguments;',
            '    }',
            '    return ' + element.value + '.call(this, _obj, _Vdt, ' + this._visitJS(blocks) + ')',
            '}).call(this)'
        ].join('\n');

        return this._visitJSXDirective(element, ret);
    },

    _visitJSXComment: function(element) {
        return 'hc(' + this._visitJSXText(element) + ')';
    }
};
