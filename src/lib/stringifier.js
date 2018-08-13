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

const getLineAndColumn = function(code) {
    const lines = code.split(/\n/);

    return {
        line: lines.length,
        column: lines[lines.length - 1].length,
    };
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
        this.head = ''; // save import syntax

        this.indent = 0;

        this.buffer = [];
        this.mappings = [];

        this.line = 1;
        this.column = 1;

        const ret = this._visitJSXExpressionContainer(ast, true);
        console.log(this.buffer.join(''), this.mappings);
        return ret;
    },

    _addMapping(element) {
        this.mappings.push({
            generated: {
                line: this.line,
                column: this.column, 
            },
            original: {
                line: element.line,
                column: element.column,
            },
            element
        });
    },

    _visitJSXExpressionContainer: function(ast, isRoot) {
        let length = ast.length;
        let hasDestructuring = false;

        Utils.each(ast, function(element, i) {
            // if is root, add `return` keyword
            if (this.autoReturn && isRoot && i === length - 1) {
                this._append('return ');
            }

            let str = this._visit(element, isRoot);
            // if (isRoot && element.type === Type.JSImport) {
                // this.head += `${str}\n`;
            // }

            // if (!isRoot && !this.enterStringExpression) {
                // // special for ... syntaxt
                // if (str[0] === '.' && str[1] === '.' && str[2] === '.') {
                    // hasDestructuring = true;
                    // str = str.substr(3); 
                // }
                // str = 'function() {try {return (' + str + ')} catch(e) {_e(e)}}.call($this)';
                // if (hasDestructuring) {
                    // str = '...' + str;
                // }
            // }

            // if (isRoot) {
                // this._append(str, element);
            // }
        }, this);
    },

    _visit: function(element, isRoot) {
        element = element || {};
        let ret;
        switch (element.type) {
            case Type.JS:
            case Type.JSImport:
                ret = this._visitJS(element);
                break;
            case Type.JSXElement:
                ret = this._visitJSXElement(element);
                break;
            case Type.JSXText:
                ret = this._visitJSXText(element);
                break;
            case Type.JSXUnescapeText:
                ret = this._visitJSXUnescapeText(element);
                break;
            case Type.JSXExpressionContainer:
                ret = this._visitJSXExpressionContainer(element.value);
                break;
            case Type.JSXWidget:
                ret = this._visitJSXWidget(element);
                break;
            case Type.JSXBlock:
                ret = this._visitJSXBlock(element, true);
                break;
            case Type.JSXVdt:
                ret = this._visitJSXVdt(element, isRoot);
                break;
            case Type.JSXComment:
                ret = this._visitJSXComment(element);
                break;
            case Type.JSXTemplate:
                ret = this._visitJSXTemplate(element);
                break;
            case Type.JSXString:
                ret = this._visitJSXString(element);
                break;
            default:
                ret = 'null';
                break;
        }

        return ret;
    },

    _visitJS: function(element) {
        const ret = this.enterStringExpression ? 
            '(' + element.value + ')' : 
            element.value; 

        this._append(ret, element);
    },

    _visitJSXElement: function(element) {
        if (element.value === 'template') {
            // <template> is a fake tag, we only need handle its children and itself directives
            return this._visitJSXDirective(element, this._visitJSXChildren(element.children));
        }

        this._append(`h('${element.value}', `, element);

        const attributes = this._visitJSXAttribute(element, true, true);
        this._append(', ');

        this._visitJSXChildren(element.children);
        this._append(', ');
        if (attributes.className) {
            this._visitJSXAttributeClassName(attributes.className);
        } else {
            this._append('null');
        }
        this._append(', ');
        if (attributes.key) {
            this._visitJSXAttributeValue(attributes.key);
        } else {
            this._append('null');
        }
        this._append(', ');
        if (attributes.ref) {
            this._visitJSXAttributeRef(attributes.ref);
        } else {
            this._append('null');
        }
        this._append(')');

        // return this._visitJSXDirective(element, ret);
        // var ret = "h(" + normalizeArgs([
            // "'" + element.value + "'", 
            // attributes.props, 
            // this._visitJSXChildren(element.children),
            // attributes.className,
            // attributes.key,
            // attributes.ref
        // ]) + ')';

        // return this._visitJSXDirective(element, ret);
    },

    _visitJSXChildren: function(children) {
        const length = children.length;
        if (!length) {
            this._append('null');
        }
        if (length > 1) {
            this._append('[\n');
        }
        Utils.each(children, function(child, index) {
            this._visit(child);
            if (index !== length - 1) {
                this._append(',\n');
            }
        }, this);
        if (length > 1) {
            this._append('\n]');
        }
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

        return this._result(ret);
    },

    _visitJSXDirectiveIf: function(directive, ret, element) {
        var result = this._visitJSXAttributeValue(directive.value) + ' ? ' + ret + ' : ',
            hasElse = false,
            next = element;

        while (next = next.next) {
            const nextDirectives = next.directives;

            if (!nextDirectives) break;

            if (nextDirectives['v-else-if']) {
                result += this._visitJSXAttributeValue(nextDirectives['v-else-if'].value) + ' ? ' + this._visit(next) + ' : ';
                continue;
            }
            if (nextDirectives['v-else']) {
                result += this._visit(next);
                hasElse = true;
            }

            break;
        }
        if (!hasElse) result += 'undefined';

        return result;
    },

    _visitJSXDirectiveFor: function(directive, ret) {
        return '__m(' + directive.data + ', function(' + directive.value + ', ' + directive.key + ') {\n' +
            'return ' + ret + ';\n' +
        '}, $this)';
    },

    _visitJSXString: function(element) {
        var ret = [];
        this.enterStringExpression = true;
        Utils.each(element.value, function(child) {
            ret.push(this._visit(child));
        }, this);
        this.enterStringExpression = false;
        return ret.join('+');
    },

    _visitJSXAttribute: function(element, individualClassName, individualKeyAndRef) {
        var set = {},
            events = {},
            // support bind multiple callbacks for the same event
            addEvent = (name, attr) => {
                const v = events[name];
                if (!v) {
                    events[name] = [];
                }
                events[name].push(attr);
            },
            attributes = element.attributes,
            models = [],
            addition = {trueValue: true, falseValue: false, type: 'text'},
            isFirst;

        const addAttribute = (name, attr) => {
            if (isFirst === undefined) {
                this._append('{\n');
                isFirst = true;
            }
            if (!isFirst) {
                this._append(',\n');
            }
            this._append(`'${name}': `, attr);
            isFirst = false;
        }

        Utils.each(attributes, function(attr) {
            if (attr.type === Type.JSXExpressionContainer) {
                return this._visitJSXAttributeValue(attr);
            }

            let name = attrMap(attr.name);

            if (name === 'className') {
                if (!individualClassName) {
                    addAttribute(name, attr);
                    this._visitJSXAttributeClassName(attr.value);
                }
            } else if (name === 'key') {
                if (!individualKeyAndRef) {
                    addAttribute(name, attr);
                    this._visitJSXAttributeValue(attr.value);
                }
            } else if (name === 'widget' || name === 'ref') {
                if (!individualClassName) {
                    addAttribute('ref', attr);
                    this._visitJSXAttributeRef(attr.value);   
                }
            } else if (Utils.isVModel(name)) {
                let [, model] = name.split(':');

                if (model === 'value') name = 'v-model';
                if (!model) model = 'value';

                models.push({name: model, value: attr.value, attr: attr});
            } else if (name === 'v-model-true') {
                addition.trueValue = attr.value;
            } else if (name === 'v-model-false') {
                addition.falseValue = attr.value;
            } else if (name === 'type' || name === 'value') {
                // save the type value for v-model of input element
                addAttribute(name, attr);
                this._visitJSXAttributeValue(attr.value);
                addition[name] = attr.value;
            } else if (Utils.isEventProp(name)) {
                addEvent(name, attr);
            } else {
                addAttribute(name, attr);
                this._visitJSXAttributeValue(attr.value);
            }

            // for get property directly 
            set[name] = attr.value;
        }, this);

        for (let i = 0; i < models.length; i++) {
            this._visitJSXAttributeModel(element, models[i], addition, addEvent, addAttribute);
        }

        Utils.each(events, (events, name) => {
            addAttribute(name, events[0]);

            const length = events.length;
            if (length > 1) {
                this._append('[\n');
            }
            for (let i = 0; i < length; i++) {
                const event = events[i];
                if (typeof event === 'function') {
                    event();
                } else {
                    this._visitJSXAttributeValue(event.value);
                }
                if (i !== length - 1) {
                    this._append(',\n');
                }
            }
            if (length > 1) {
                this._append('\n]');
            }
        });

        if (isFirst !== undefined) {
            this._append('\n}');
        } else {
            this._append('null');
        }

        return set; 
    },

    _visitJSXAttributeClassName(value) {
        if (value.type === Type.JSXExpressionContainer) {
            // for class={ {active: true} }
            this._append('_className(');
            this._visitJSXAttributeValue(value);
            this._append(')');
        } else {
            this._visitJSXAttributeValue(value);
        }
    },

    _visitJSXAttributeRef(value) {
        if (value.type === Type.JSXText) {
            // for compatility v1.0
            // convert widget="a" to ref=(i) => widgets.a = i
            // convert ref="a" to ref=(i) => widgets.a = i. For Intact
            this._append(`function(i) {widgets[`);
            this._visitJSXAttributeValue(value);
            this._append(`] = i}`);
        } else {
            this._visitJSXAttributeValue(value);
        }
    },

    _visitJSXAttributeModel: function(element, model, addition, addEvent, addAttribute) {
        var valueName = model.name,
            value = model.value,
            eventName = 'change'; 

        const append = (...args) => {
            for (let i = 0; i < args.length; i++) {
                if (i % 2) {
                    this._visitJSXAttributeValue(args[i]);
                } else {
                    this._append(args[i]);
                }
            }
        };

        if (element.type === Type.JSXElement) {
            switch (element.value) {
                case 'input':
                    switch (addition.type) {
                        case "'file'":
                            eventName = 'change';
                            break;
                        case "'radio'":
                        case "'checkbox'":
                            addAttribute('checked', model.attr);
                            var trueValue = addition.trueValue,
                                falseValue = addition.falseValue,
                                inputValue = addition.value;
                            if (Utils.isNullOrUndefined(inputValue)) {
                                append('_getModel(self, ', value, ') === ', trueValue);
                                addEvent('ev-change', () => {
                                    append('function(__e) {\n__e.target.checked ? ', trueValue, ' : ', falseValue, ', $this);\n}');
                                });
                            } else {
                                if (type === "'radio'") {
                                    append(`_getModel(self, `, value, ') === ', trueValue);
                                    addEvent('ev-change', () => {
                                        append('function(__e) {\n_setModel(self, ', value, ', __e.target.checked ? ', inputValue, ' : ', falseValue, ', $this);\n}');
                                    });
                                } else {
                                    append(`_detectCheckboxChecked(self, `, value, ', ', inputValue, '), \n');
                                    addEvent('ev-change', () => {
                                        append('function(__e) {\n_setCheckboxModel(self, ', value, ', ', inputValue, ', ', falseValue, ', __e, $this);\n}');
                                    });
                                }
                            }
                            return;
                        default:
                            eventName = 'input';
                            break;
                    }
                    break;
                case 'select':
                    addAttribute('value', model.attr);
                    append('_getModel(self, ', value, ')');
                    addEvent('ev-change', () => {
                        append('function(__e) {\n__setSelectModel(self, ', value, ', _e, $this);\n}');
                    });
                    return;
                case 'textarea':
                    eventName = 'input';
                    break;
                default:
                    break;
            }
            addEvent(`ev-${eventName}`, () => {
                append('function(__e) { _setModel(self, ', value, ', __e.target.value, $this) }');
            });
        } else if (element.type === Type.JSXWidget) {
            addEvent(`ev-$change:${valueName}`, () => {
                append('function(__c, __n) { _setModel(self, ', value, ', __n, $this) }');
            });
        }
        addAttribute(valueName, model.attr);
        append(`_getModel(self, `, value, ')');
    },

    _visitJSXAttributeValue: function(value) {
        Utils.isArray(value) ? this._visitJSXChildren(value) : this._visit(value, false);
    },

    _visitJSXText: function(element, noQuotes) {
        var ret = element.value.replace(/([\'\"\\])/g, '\\$1').replace(/[\r\n]/g, '\\n');
        if (!noQuotes) {
            ret = "'" + ret + "'";
        }

        this._append(ret, element);
    },

    _visitJSXUnescapeText: function(element) {
        this._append('hu(');
        this._visitJSXExpressionContainer(element.value);
        this._append(')');
    },

    _visitJSXWidget: function(element) {
        const {blocks, children, hasBlock} = this._visitJSXBlocks(element, false);

        element.attributes.push({name: 'children', value: children});
        element.attributes.push({name: '_context', value: {
            type: Type.JS,
            value: '$this'
        }});
        if (hasBlock) {
            element.attributes.push({name: '_blocks', value: blocks});
        }

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
        const {params, args} = this._visitJSXBlockAttribute(element);
        return this._visitJSXDirective(
            element,
            '(_blocks["' + element.value + '"] = function(parent' + (params ? ', ' + params : '') + ') {\n' +
            '    return ' + this._visitJSXChildren(element.children) + ';\n' + 
            '}) && (__blocks["' + element.value + '"] = function(parent) {\n' +
            '    var args = arguments;\n' +
            '    return blocks["' + element.value + '"] ? blocks["' + element.value + '"].apply($this, [function() {\n' +
            '        return _blocks["' + element.value + '"].apply($this, args);\n' +
            '    }].concat(__slice.call(args, 1))) : _blocks["' + element.value + '"].apply($this, args);\n' +
            '})' + (isAncestor ? ' && __blocks["' + element.value + '"].apply($this, ' + 
                (args ? '[__noop].concat(' + args + ')' : '[__noop]') + ')' : '')
        );
    },

    _visitJSXBlockAttribute: function(element) {
        const ret = {};

        Utils.each(element.attributes, function(attr) {
            const name = attr.name;
            let value;
            switch (name) {
                case 'args':
                    value = this._visitJSXAttributeValue(attr.value);
                    break;
                case 'params':
                    value = this._visitJSXText(attr.value, true);
                    break;
                default:
                    return;
            }
            ret[name] = value;
        }, this);
          
        return ret;
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
                `    return (${blocks.join(' && ')}, __blocks);`,
                `}.call($this, ${isRoot ? 'blocks' : '{}'})`
            ].join('\n') : isRoot ? 'blocks' : 'null'
        };
    
        return {blocks: _blocks, children: children.length ? children : null, hasBlock: blocks.length};
    },

    _visitJSXVdt: function(element, isRoot) {
        const {blocks, children} = this._visitJSXBlocks(element, isRoot);
        element.attributes.push({name: 'children', value: children});
        const {props, set} = this._visitJSXAttribute(element, false, false);
        const ret = [
            '(function() {',
            '    var _obj = ' + props + ';',
            set.hasOwnProperty('arguments') ? 
            '    extend(_obj, _obj.arguments === true ? obj : _obj.arguments);\n' +
            '    delete _obj.arguments;' : '',
            '    return ' + element.value + '.call($this, _obj, _Vdt, ' + this._visitJS(blocks) + ', ' + element.value + ')',
            '}).call($this)'
        ].join('\n');

        return this._visitJSXDirective(element, ret);
    },

    _visitJSXComment: function(element) {
        return 'hc(' + this._visitJSXText(element) + ')';
    },

    _result(code) {
        // const {line, column} = getLineAndColumn(code);
        // this.line += line - 1;
        // this.column = line > 1 ? column + 1 : this.column + column + 1; 

        return code;
    },

    _append(code, element) {
        if (element) {
            this._addMapping(element);
        }
        this.buffer.push(code);

        for (let i = 0; i < code.length; i++) {
            if (code[i] === '\n') {
                this.line++;
                this.column = 0;
            } else {
                this.column++;
            }
        }
    },

    _indent() {
        this.indent++;
    },

    _dedent() {
        this.index--;
    },

    _getIndent() {
        new Array(this.indent + 1).join('    ');
    },
};
