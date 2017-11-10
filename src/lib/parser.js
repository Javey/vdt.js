/**
 * @fileoverview parse jsx to ast
 * @author javey
 * @date 15-4-22
 */

import * as Utils from './utils';

const {Type, TypeName} = Utils;
const elementNameRegexp = /^<\w+:?\s*[\{\w\/>]/;

function isJSXIdentifierPart(ch) {
    return (ch === 58) || (ch === 95) || (ch === 45) || ch === 36 || ch === 46 ||  // : _ (underscore) - $ .
        (ch >= 65 && ch <= 90) ||         // A..Z
        (ch >= 97 && ch <= 122) ||        // a..z
        (ch >= 48 && ch <= 57);         // 0..9
}

export default function Parser() {
    this.source = '';
    this.index = 0;
    this.length = 0;
}

Parser.prototype = {
    constructor: Parser,

    parse: function(source, options) {
        this.source = Utils.trimRight(source);
        this.index = 0;
        this.line = 1;
        this.column = 1;
        this.length = this.source.length;

        this.options = Utils.extend({}, Utils.configure(), options);

        return this._parseTemplate();
    },

    _parseTemplate: function() {
        var elements = [],
            braces = {count: 0};
        while (this.index < this.length && braces.count >= 0) {
            elements.push(this._advance(braces));
        }

        return elements;
    },

    _advance: function(braces) {
        var ch = this._char();
        if (ch !== '<') {
            return this._scanJS(braces);
        } else {
            return this._scanJSX();
        }
    },

    _scanJS: function(braces) {
        var start = this.index,
            Delimiters = this.options.delimiters;

        while (this.index < this.length) {
            var ch = this._char();
            if (ch === '\'' || ch === '"' || ch === '`') {
                // skip element(<div>) in quotes
                this._scanStringLiteral();
            } else if (this._isElementStart()) {
                break;
            } else {
                if (ch === '{') {
                    braces.count++;
                } else if (braces.count > 0 && ch === '}') {
                    braces.count--;
                } else if (this._isExpect(Delimiters[1])) {
                    // for parseTemplate break
                    braces.count--;
                    break;
                } else if (ch === '\n') {
                    this._updateLine();
                }
                this._updateIndex();
            }
        }

        return this._type(Type.JS, {
            value: this.source.slice(start, this.index)
        });
    },

    _scanStringLiteral: function() {
        var quote = this._char(),
            start = this.index,
            str = '';
        this._updateIndex();

        while (this.index < this.length) {
            var ch = this._char();
            if (ch.charCodeAt(0) === 10) {
                this._updateLine();
            }
            this._updateIndex();

            if (ch === quote) {
                quote = '';
                break;
            } else if (ch === '\\') {
                str += this._char(this._updateIndex());
            } else {
                str += ch;
            }
        }
        if (quote !== '') {
            this._error('Unclosed quote');
        }

        return this._type(Type.StringLiteral, {
            value: this.source.slice(start, this.index)
        });
    },

    _scanJSX: function() {
        return this._parseJSXElement();
    },

    _scanJSXText: function(stopChars) {
        var start = this.index,
            l = stopChars.length,
            i,
            charCode;

        loop:
        while (this.index < this.length) {
            charCode = this._charCode();
            if (Utils.isWhiteSpace(charCode)) {
                if (charCode === 10) {
                    this._updateLine();
                }
            } else {
                for (i = 0; i < l; i++) {
                    if (typeof stopChars[i] === 'function' && stopChars[i].call(this) || 
                        this._isExpect(stopChars[i])
                    ) {
                        break loop;
                    }
                }
            }
            this._updateIndex();
        }

        return this._type(Type.JSXText, {
            value: this.source.slice(start, this.index)
        });
    },

    _scanJSXStringLiteral: function() {
        var quote = this._char();
        if (quote !== '\'' && quote !== '"' && quote !== '`') {
            this._error('String literal must starts with a qoute');
        }
        this._updateIndex();
        var token = this._scanJSXText([quote]);
        this._updateIndex();
        return token;
    },

    _parseJSXElement: function() {
        this._expect('<');
        var start = this.index,
            ret = {},
            flag = this._charCode();
        if (flag >= 65 && flag <= 90/* upper case */) {
            // is a widget
            this._type(Type.JSXWidget, ret);
        } else if (this._isExpect('!--')) {
            // is html comment
            return this._parseJSXComment();
        } else if (this._charCode(this.index + 1) === 58/* : */){
            // is a directive
            start += 2;
            switch (flag) {
                case 116: // t
                    this._type(Type.JSXVdt, ret);
                    break;
                case 98: // b
                    this._type(Type.JSXBlock, ret);
                    break;
                default:
                    this._error('Unknown directive ' + String.fromCharCode(flag) + ':');
            }
            this._updateIndex(2);
        } else {
            // is an element
            this._type(Type.JSXElement, ret);
        }

        while (this.index < this.length) {
            if (!isJSXIdentifierPart(this._charCode())) {
                break;
            }
            this._updateIndex();
        }

        ret.value = this.source.slice(start, this.index);

        return this._parseAttributeAndChildren(ret);
    },

    _parseAttributeAndChildren: function(ret) {
        var attrs = this._parseJSXAttribute();
        Utils.extend(ret, {
            attributes: attrs.attributes,
            directives: attrs.directives,
            children: []
        });
        if (!ret.directives.length) delete ret.directives;

        if (ret.type === Type.JSXElement && Utils.isSelfClosingTag(ret.value)) {
            // self closing tag
            if (this._char() === '/') {
                this._updateIndex();
            }
            this._expect('>');
        } else if (this._char() === '/') {
            // unknown self closing tag
            this._updateIndex();
            this._expect('>');
        } else {
            this._expect('>');
            ret.children = this._parseJSXChildren(ret, attrs.hasVRaw);
        }

        return ret;
    },

    _parseJSXAttribute: function() {
        var ret = {
            attributes: [],
            directives: [],
            hasVRaw: false
        };
        while (this.index < this.length) {
            this._skipWhitespace();
            if (this._char() === '/' || this._char() === '>') {
                break;
            } else {
                var Delimiters = this.options.delimiters;
                if (this._isExpect(Delimiters[0])) {
                    // support dynamic attributes
                    ret.attributes.push(this._parseJSXExpressionContainer());
                    continue;
                }
                var attr = this._parseJSXAttributeName();
                if (attr.name === 'v-raw') {
                    ret.hasVRaw = true;
                    continue;
                }
                if (this._char() === '=') {
                    this._updateIndex();
                    attr.value = this._parseJSXAttributeValue();
                } else {
                    // treat no-value attribute as true
                    attr.value = this._type(
                        Type.JSXExpressionContainer, 
                        {value: [this._type(
                            Type.JS,
                            {value: 'true'}
                        )]}
                    );
                }
                ret[attr.type === Type.JSXAttribute ? 
                    'attributes' : 'directives'
                ].push(attr);
            }
        }

        return ret;
    },

    _parseJSXAttributeName: function() {
        var start = this.index;
        if (!isJSXIdentifierPart(this._charCode())) {
            this._error('Unexpected identifier ' + this._char());
        }
        while (this.index < this.length) {
            var ch = this._charCode();
            if (!isJSXIdentifierPart(ch)) {
                break;
            }
            this._updateIndex();
        }
        
        var name = this.source.slice(start, this.index);
        if (Utils.isDirective(name)) {
            return this._type(Type.JSXDirective, {name: name});
        }

        return this._type(Type.JSXAttribute, {name: name});
    },

    _parseJSXAttributeValue: function() {
        var value,
            Delimiters = this.options.delimiters;
        if (this._isExpect(Delimiters[0])) {
            value = this._parseJSXExpressionContainer();
        } else {
            value = this._scanJSXStringLiteral();
        }
        return value;
    },

    _parseJSXExpressionContainer: function() {
        var expression,
            Delimiters = this.options.delimiters;
        this._expect(Delimiters[0]);
        if (this._isExpect(Delimiters[1])) {
            expression = this._parseJSXEmptyExpression();
        } else if (this._isExpect('=')) {
            // if the lead char is '=', then treat it as unescape string
            expression = this._parseJSXUnescapeText();
            this._expect(Delimiters[1]);
            return expression;
        } else {
            expression = this._parseExpression();
        }
        this._expect(Delimiters[1]);

        return this._type(Type.JSXExpressionContainer, {value: expression});
    },

    _parseJSXEmptyExpression: function() {
        return this._type(Type.JSXEmptyExpression, {value: null});
    },

    _parseExpression: function() {
        return this._parseTemplate();
    },

    _parseJSXUnescapeText: function() {
        this._expect('=');
        return this._type(Type.JSXUnescapeText, {
            value: this._parseTemplate()
        });
    },

    _parseJSXChildren: function(element, hasVRaw) {
        var children = [],
            endTag = element.value + '>',
            current = null;

        switch (element.type) {
            case Type.JSXBlock:
                endTag = '</b:' + endTag;
                break;
            case Type.JSXVdt:
                endTag = '</t:' + endTag;
                break;
            case Type.JSXElement:
            default:
                endTag = '</' + endTag;
                break;
        }

        if (hasVRaw) {
            while (this.index < this.length) {
                if (this._isExpect(endTag)) {
                    break;
                }
                children.push(this._scanJSXText([endTag]));
            }
        } else {
            this._skipWhitespaceBetweenElements(endTag);
            while (this.index < this.length) {
                if (this._isExpect(endTag)) {
                    break;
                }
                current = this._parseJSXChild(element, endTag, current);
                children.push(current);
            }
        }
        this._parseJSXClosingElement();
        return children;
    },

    _parseJSXChild: function(element, endTag, prev) {
        var ret,
            Delimiters = this.options.delimiters;

        if (this._isExpect(Delimiters[0])) {
            ret = this._parseJSXExpressionContainer();
        } else if (Utils.isTextTag(element.value)) {
            ret = this._scanJSXText([endTag, Delimiters[0]]);
        } else if (this._isElementStart()) {
            ret = this._parseJSXElement();
            this._skipWhitespaceBetweenElements(endTag);
        } else {
            ret = this._scanJSXText([function() {
                return this._isExpect(endTag) || this._isElementStart();
            }, Delimiters[0]]);
        }

        ret.prev = undefined;
        ret.next = undefined;
        if (prev) {
            prev.next = ret;
            ret.prev = prev;
        }
        
        return ret;
    },

    _parseJSXClosingElement: function() {
        this._expect('</');

        while (this.index < this.length) {
            if (!isJSXIdentifierPart(this._charCode())) {
                break;
            }
            this._updateIndex();
        }

        this._skipWhitespace();
        this._expect('>');
    },

    _parseJSXComment: function() {
        this._expect('!--');
        var start = this.index;
        while (this.index < this.length) {
            if (this._isExpect('-->')) {
                break;
            } else if (this._charCode() === 10) {
                this._updateLine();
            }
            this._updateIndex();
        }
        var ret = this._type(Type.JSXComment, {
            value: this.source.slice(start, this.index)
        });
        this._expect('-->');

        return ret;
    },

    _char: function(index = this.index) {
        return this.source.charAt(index);
    },

    _charCode: function(index = this.index) {
         return this.source.charCodeAt(index);
    },

    _skipWhitespaceBetweenElements: function(endTag) {
        if (!this.options.skipWhitespace) return;

        let start = this.index;
        while (start < this.length) {
            const code = this._charCode(start);
            if (Utils.isWhiteSpace(code)) {
                start++;
            } else if (this._isExpect(endTag, start) || this._isElementStart(start)) {
                this._skipWhitespace();
                break;
            } else {
                break;
            }
        }
    },

    _skipWhitespace: function() {
        while (this.index < this.length) {
            var code = this._charCode();
            if (!Utils.isWhiteSpace(code)) {
                break;
            } else if (code === 10) {
                // is \n
                this._updateLine();
            }
            this._updateIndex();
        }
    },

    _expect: function(str) {
        if (!this._isExpect(str)) {
            this._error('expect string ' + str);
        }
        this._updateIndex(str.length);
    },

    _isExpect: function(str, index = this.index) {
        return this.source.slice(index, index + str.length) === str;
    },

    _isElementStart: function(index = this.index) {
        return this._char(index) === '<' && 
            (
                this._isExpect('<!--') || 
                elementNameRegexp.test(this.source.slice(index))
            );
    },

    _type: function(type, ret) {
        ret || (ret = {});
        ret.type = type;
        ret.typeName = TypeName[type];
        ret.line = this.line;
        ret.column = this.column;
        return ret;
    },

    _updateLine: function() {
        this.line++;
        this.column = 0;
    },

    _updateIndex: function(value) {
        value === undefined && (value = 1);
        var index = this.index;
        this.index = this.index + value;
        this.column = this.column + value;
        return index;
    },

    _error: function(msg) {
        throw new Error(
            msg + ' At: {line: ' + this.line + ', column: ' + this.column +
            '} Near: "' + this.source.slice(this.index - 10, this.index + 20) + '"'
        );
    }
};
