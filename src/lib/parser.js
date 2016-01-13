/**
 * @fileoverview parse jsx to ast
 * @author javey
 * @date 15-4-22
 */

var Utils = require('./utils'),
    Type = Utils.Type,
    TypeName = Utils.TypeName;

var elementNameRegexp = /^<\w+:?\s*[\w>]/;

function isJSXIdentifierPart(ch) {
    return (ch === 58) || (ch === 95) || (ch === 45) ||  // : and _ (underscore) and -
        (ch >= 65 && ch <= 90) ||         // A..Z
        (ch >= 97 && ch <= 122) ||        // a..z
        (ch >= 48 && ch <= 57);         // 0..9
}

var Parser = function() {
    this.source = '';
    this.index = 0;
    this.length = 0;
};

Parser.prototype = {
    constructor: Parser,

    parse: function(source) {
        this.source = Utils.trimRight(source);
        this.index = 0;
        this.length = this.source.length;

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
            Delimiters = Utils.getDelimiters();

        while (this.index < this.length) {
            var ch = this._char();
            if (ch === '\'' || ch === '"') {
                // skip element(<div>) in quotes
                this._scanStringLiteral();
            } else if (this._isElementStart()) {
                break;
            } else {
                if (this._isExpect(Delimiters[0])) {
                    braces.count++;
                } else if (this._isExpect(Delimiters[1])) {
                    braces.count--;
                    if (braces.count < 0) {
                        this.index++;
                        break;
                    }
                }
                this.index++;
            }
        }

        return this._type(Type.JS, {value: this.source.slice(start, braces.count < 0 ? this.index - 1 : this.index)});
    },

    _scanStringLiteral: function() {
        var quote = this._char(),
            start = this.index,
            str = '';
        this.index++;

        while (this.index < this.length) {
            var ch = this._char();
            this.index++;

            if (ch === quote) {
                quote = '';
                break;
            } else if (ch === '\\') {
                str += this._char(this.index++);
            } else {
                str += ch;
            }
        }
        if (quote !== '') {
            throw new Error('Unclosed quote');
        }

        return this._type(Type.StringLiteral, {value: this.source.slice(start, this.index)});
    },

    _scanJSX: function() {
        return this._parseJSXElement();
    },

    _scanJSXText: function(stopChars) {
        var start = this.index,
            l = stopChars.length,
            i;
        loop:
        while (this.index < this.length) {
            for (i = 0; i < l; i++) {
                if (typeof stopChars[i] === 'function' && stopChars[i].call(this) || this._isExpect(stopChars[i])) {
                    break loop;
                }
            }
            this.index++;
        }

        return this._type(Type.JSXText, {value: this.source.slice(start, this.index)});
    },

    _scanJSXStringLiteral: function() {
        var quote = this._char();
        if (quote !== '\'' && quote !== '"') {
            throw new Error('String literal must starts with a qoute');
        }
        this.index++;
        var token = this._scanJSXText([quote]);
        this.index++;
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
                    throw new Error('Unknown directive ' + String.fromCharCode(flag) + ':');
            }
            this.index += 2;
        } else {
            // is an element
            this._type(Type.JSXElement, ret);
        }

        while (this.index < this.length) {
            if (!isJSXIdentifierPart(this._charCode())) {
                break;
            }
            this.index++;
        }

        ret.value = this.source.slice(start, this.index);

        return this._parseAttributeAndChildren(ret);
    },

    _parseAttributeAndChildren: function(ret) {
        Utils.extend(ret, {
            attributes: this._parseJSXAttribute(),
            children: []
        });

        if (ret.type === Type.JSXElement && Utils.isSelfClosingTag(ret.value)) {
            // self closing tag
            if (this._char() === '/') {
                this.index++;
            }
            this._expect('>');
        } else if (this._char() === '/') {
            // unknown self closing tag
            this.index++;
            this._expect('>');
        } else {
            this._expect('>');
            ret.children = this._parseJSXChildren();
        }

        return ret;
    },

    _parseJSXAttribute: function() {
        var ret = [];
        while (this.index < this.length) {
            this._skipWhitespace();
            if (this._char() === '/' || this._char() === '>') {
                break;
            } else {
                var attr = this._parseJSXAttributeName();
                if (this._char() === '=') {
                    this.index++;
                    attr.value = this._parseJSXAttributeValue();
                }
                ret.push(attr);
            }
        }

        return ret;
    },

    _parseJSXAttributeName: function() {
        var start = this.index;
        if (!isJSXIdentifierPart(this._charCode())) {
            throw new Error('Unexpected identifier ' + this._char());
        }
        while (this.index < this.length) {
            var ch = this._charCode();
            if (!isJSXIdentifierPart(ch)) {
                break;
            }
            this.index++;
        }

        return this._type(Type.JSXAttribute, {name: this.source.slice(start, this.index)});
    },

    _parseJSXAttributeValue: function() {
        var value,
            Delimiters = Utils.getDelimiters();
        if (this._isExpect(Delimiters[0])) {
            value = this._parseJSXExpressionContainer();
        } else {
            value = this._scanJSXStringLiteral();
        }
        return value;
    },

    _parseJSXExpressionContainer: function() {
        var expression,
            Delimiters = Utils.getDelimiters();
        this._expect(Delimiters[0]);
        if (this._isExpect(Delimiters[1])) {
            expression = this._parseJSXEmptyExpression();
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
        var ret = this._parseTemplate();
        this.index--;
        return ret;
    },

    _parseJSXChildren: function() {
        var children = [];
        while (this.index < this.length) {
            if (this._char(this.index) === '<' && this._char(this.index + 1) === '/') {
                break;
            }
            children.push(this._parseJSXChild());
        }
        this._parseJSXClosingElement();
        return children;
    },

    _parseJSXChild: function() {
        var token,
            Delimiters = Utils.getDelimiters();
        if (this._isExpect(Delimiters[0])) {
            token = this._parseJSXExpressionContainer();
        } else if (this._isElementStart()) {
            token = this._parseJSXElement();
        } else {
            token = this._scanJSXText([function() {
                return this._isExpect('</') || this._isElementStart();
            }, Delimiters[0]]);
        }

        return token;
    },

    _parseJSXClosingElement: function() {
        this._expect('</');

        while (this.index < this.length) {
            if (!isJSXIdentifierPart(this._charCode())) {
                break;
            }
            this.index++;
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
            }
            this.index++;
        }
        var ret = this._type(Type.JSXComment, {value: this.source.slice(start, this.index)});
        this._expect('-->');

        return ret;
    },

    _char: function(index) {
        arguments.length === 0 && (index = this.index);
        return this.source.charAt(index);
    },

    _charCode: function(index) {
        arguments.length === 0 && (index = this.index);
        return this.source.charCodeAt(index);
    },

    _skipWhitespace: function() {
        while (this.index < this.length) {
            if (!Utils.isWhiteSpace(this._charCode())) {
                break;
            }
            this.index++;
        }
    },

    _expect: function(str) {
        if (!this._isExpect(str)) {
            throw new Error('expect string ' + str);
        }
        this.index += str.length;
    },

    _isExpect: function(str) {
        return this.source.slice(this.index, this.index + str.length) === str;
    },

    _isElementStart: function() {
        return this._char() === '<' && (this._isExpect('<!--') || elementNameRegexp.test(this.source.slice(this.index)));
    },

    _type: function(type, ret) {
        ret || (ret = {});
        ret.type = type;
        ret.typeName = TypeName[type];
        return ret;
    }
};

module.exports = Parser;
