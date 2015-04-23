/**
 * @fileoverview parse jsx to ast
 * @author javey
 * @date 15-4-22
 */

var Utils = require('./utils'),
    Type = Utils.Type,
    TypeName = Utils.TypeName;

function isJSXIdentifierPart(ch) {
    return (ch === 36) || (ch === 95) || (ch === 45) ||  // $ (dollar) and _ (underscore) and -
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
        var start = this.index;

        while (this.index < this.length) {
            var ch = this._char();
            if (ch === '\'' || ch === '"') {
                // skip element(<div>) in quotes
                this._scanStringLiteral();
            } else if (this._char() === '<' && /^<\w+\s*[\w>]/.test(this.source.slice(this.index))) {
                break;
            } else {
                if (ch === '{') {
                    braces.count++;
                } else if (ch === '}') {
                    braces.count--;
                    if (braces.count < 0) {
                        this.index++;
                        break;
                    }
                }
                this.index++;
            }
        }
        return {
            type: Type.JS,
            typeName: TypeName[Type.JS],
            value: this.source.slice(start, braces.count < 0 ? this.index - 1 : this.index)
        };
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
        return {
            type: Type.StringLiteral,
            typeName: TypeName[Type.StringLiteral],
            value: this.source.slice(start, this.index)
        }
    },

    _scanJSX: function() {
        return this._parseJSXElement();
    },

    _scanJSXText: function(stopChars) {
        var start = this.index;
        while (this.index < this.length) {
            var ch = this._char();
            if (~stopChars.indexOf(ch)) {
                break;
            }
            this.index++;
        }
        return {
            type: Type.JSXText,
            typeName: TypeName[Type.JSXText],
            value: this.source.slice(start, this.index)
        }
    },

    _scanJSXStringLiteral: function() {
        var quote = this._char();
        if (quote !== '\'' && quote !== '"') {
            throw new Error('String literal must starts with a qoute')
        }
        this.index++;
        var token = this._scanJSXText([quote]);
        this.index++;
        return token;
    },

    _parseJSXElement: function() {
        this._expect('<');
        var start = this.index;
        while (this.index < this.length) {
            if (!isJSXIdentifierPart(this._charCode())) {
                break;
            }
            this.index++;
        }
        var ret = {
            type: Type.JSXElement,
            typeName: TypeName[Type.JSXElement],
            value: this.source.slice(start, this.index),
            attributes: this._parseJSXAttribute(),
            children: []
        };

        if (this._char() === '/') {
            // self closing tag
            this.index++;
            this._expect('>')
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
        return {
            type: Type.JSXAttribute,
            typeName: TypeName[Type.JSXAttribute],
            name: this.source.slice(start, this.index)
        }
    },

    _parseJSXAttributeValue: function() {
        var value;
        if (this._char() === '{') {
            value = this._parseJSXExpressionContainer();
        } else {
            value = this._scanJSXStringLiteral();
        }
        return value;
    },

    _parseJSXExpressionContainer: function() {
        var expression;
        this._expect('{');
        if (this._char() === '}') {
            expression = this._parseJSXEmptyExpression();
        } else {
            expression = this._parseExpression();
        }
        this._expect('}');
        return {
            type: Type.JSXExpressionContainer,
            typeName: TypeName[Type.JSXExpressionContainer],
            value: expression
        }
    },

    _parseJSXEmptyExpression: function() {
        return {
            type: Type.JSXEmptyExpression,
            typeName: TypeName[Type.JSXEmptyExpression],
            value: null
        }
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
            ch = this._char();
        if (ch === '{') {
            token = this._parseJSXExpressionContainer();
        } else if (ch === '<') {
            token = this._parseJSXElement();
        } else {
            token = this._scanJSXText(['<', '{']);
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

    _char: function(index) {
        index = index || this.index;
        return this.source.charAt(index);
    },

    _charCode: function(index) {
        index = index || this.index;
        return this.source.charCodeAt(index);
    },

    _skipWhitespace: function() {
        while (this.index < this.length) {
            if (Utils.isWhiteSpace(this._charCode())) {
                this.index++;
            } else {
                break;
            }
        }
    },

    _expect: function(str) {
        if (this.source.slice(this.index, this.index + str.length) !== str) {
            throw new Error('expect string ' + str);
        }
        this.index += str.length;
    }
};

module.exports = Parser;
