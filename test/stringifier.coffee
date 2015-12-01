Parser = require('../src/lib/parser')
Stringifier = require('../src/lib/stringifier')
should = require('should')

parser = new Parser
stringifier = new Stringifier

describe 'Stringifier', ->
    it 'Stringify attribute without value', ->
        source = """
        <input type="checkbox" checked />
        """
        stringifier.stringify(parser.parse(source)).should.eql("return h('input',{'type': 'checkbox', 'checked': null}, [])")

    it 'Stringifier attribute class', ->
        source = """
        <div class="aaa"></div>
        """

        stringifier.stringify(parser.parse(source)).should.eql("return h('div',{'className': 'aaa'}, [])")

    it 'Stringify text with quotes', ->
        source = """
        <input placeholder="a'a" />
        """

        stringifier.stringify(parser.parse(source)).should.eql("return h('input',{'placeholder': 'a\\'a'}, [])")

    it 'Stringify without return', ->
        source = """
        <input type="checkbox" checked>
        """
        stringifier.stringify(parser.parse(source), false).should.eql("h('input',{'type': 'checkbox', 'checked': null}, [])")

    it 'Stringify widget', ->
        source = """
        <Page title="test" />
        """
        stringifier.stringify(parser.parse(source)).should.eql("return Page({'title': 'test', 'children': []}, widgets)")

    it 'Stringify widget with event', ->
        source = """
        <Page title="test" ev-change:size={function() {console.log(1)}}>
            <div>1</div>
            <div>2</div>
        </Page>
        """
        stringifier.stringify(parser.parse(source)).should.eql("return Page({'title': 'test', 'ev-change:size': function() {console.log(1)}, 'children': ['     ', h('div',null, ['1']), '     ', h('div',null, ['2']), ' ']}, widgets)")

    it 'Stringify block directive', ->
        source = """
        <div>
            <b:content>
                <div>aaa</div>
            </b:content>
        </div>
        """

        stringifier.stringify(parser.parse(source)).should.eql("""
            return h('div',null, ['     ', (_blocks.content = function(parent) {return ['         ', h('div',null, ['aaa']), '     '];}) && (__blocks.content = function(parent) {
            var self = this;
            return blocks.content ? blocks.content.call(this, function() {
            return _blocks.content.call(self, parent);
            }) : _blocks.content.call(this, parent);
            }) && __blocks.content.call(this), ' '])
            """)

    it 'Stringify vdt template directive', ->
        source = """
        <t:parent>
            <b:head>
                child head
            </b:head>
            <b:body>
                {parent()}
                <div>child body</div>
            </b:body>
        </t:parent>
        """

        stringifier.stringify(parser.parse(source)).should.eql("""
            return (function(blocks) {
            var _blocks = {}, __blocks = extend({}, blocks), _obj = null || {};
            return parent.call(this, _obj, _Vdt, (_blocks.head = function(parent) {return ['         child head     '];}) && (__blocks.head = function(parent) {
            var self = this;
            return blocks.head ? blocks.head.call(this, function() {
            return _blocks.head.call(self, parent);
            }) : _blocks.head.call(this, parent);
            }) && (_blocks.body = function(parent) {return ['         ', parent(), '         ', h('div',null, ['child body']), '     '];}) && (__blocks.body = function(parent) {
            var self = this;
            return blocks.body ? blocks.body.call(this, function() {
            return _blocks.body.call(self, parent);
            }) : _blocks.body.call(this, parent);
            }) && __blocks)}).call(this, blocks)
            """)

    it 'Stringify vdt template with js', ->
        source = """
        var a = 1;
        <t:base>
            <b:body>good</b:body>
        </t:base>
        """

        stringifier.stringify(parser.parse(source)).should.eql("""
            var a = 1;
            return (function(blocks) {
            var _blocks = {}, __blocks = extend({}, blocks), _obj = null || {};
            return base.call(this, _obj, _Vdt, (_blocks.body = function(parent) {return ['good'];}) && (__blocks.body = function(parent) {
            var self = this;
            return blocks.body ? blocks.body.call(this, function() {
            return _blocks.body.call(self, parent);
            }) : _blocks.body.call(this, parent);
            }) && __blocks)}).call(this, blocks)
            """)

    it 'Stringify empty template directive', ->
        source = """
        <t:base />
        """

        stringifier.stringify(parser.parse(source)).should.eql("return (function(blocks) {\nvar _blocks = {}, __blocks = extend({}, blocks), _obj = null || {};\nreturn base.call(this, _obj, _Vdt, __blocks)}).call(this, blocks)")

    it 'Stringify nested t:directive', ->
        source = """
        <t:base1>
            <b:body>
                <t:base2>
                    <b:body>base2 body</b:body>
                </t:base2>
            </b:body>
        </t:base1>
        """

        stringifier.stringify(parser.parse(source)).should.eql("""
            return (function(blocks) {
            var _blocks = {}, __blocks = extend({}, blocks), _obj = null || {};
            return base1.call(this, _obj, _Vdt, (_blocks.body = function(parent) {return ['         ', (function(blocks) {
            var _blocks = {}, __blocks = extend({}, blocks), _obj = null || {};
            return base2.call(this, _obj, _Vdt, (_blocks.body = function(parent) {return ['base2 body'];}) && (__blocks.body = function(parent) {
            var self = this;
            return blocks.body ? blocks.body.call(this, function() {
            return _blocks.body.call(self, parent);
            }) : _blocks.body.call(this, parent);
            }) && __blocks)}).call(this, {}), '     '];}) && (__blocks.body = function(parent) {
            var self = this;
            return blocks.body ? blocks.body.call(this, function() {
            return _blocks.body.call(self, parent);
            }) : _blocks.body.call(this, parent);
            }) && __blocks)}).call(this, blocks)
            """)