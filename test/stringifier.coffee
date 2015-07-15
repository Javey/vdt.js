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

    it 'Stringify without return', ->
        source = """
        <input type="checkbox" checked>
        """
        stringifier.stringify(parser.parse(source), false).should.eql("h('input',{'type': 'checkbox', 'checked': null}, [])")

    it 'Stringify widget', ->
        source = """
        <Page title="test" />
        """
        stringifier.stringify(parser.parse(source)).should.eql("return new Page({'title': 'test', 'children': []}, typeof widgets === \"undefined\" ? {} : widgets)")

    it 'Stringify widget with event', ->
        source = """
        <Page title="test" ev-change:size={function() {console.log(1)}}>
            <div>1</div>
            <div>2</div>
        </Page>
        """
        stringifier.stringify(parser.parse(source)).should.eql("return new Page({'title': 'test', 'ev-change:size': function() {console.log(1)}, 'children': ['     ', h('div',null, ['1']), '     ', h('div',null, ['2']), ' ']}, typeof widgets === \"undefined\" ? {} : widgets)")

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
            return blocks.content ? blocks.content(function() {
            return _blocks.content(parent);
            }) : _blocks.content(parent);
            }) && __blocks.content(), ' '])
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
            return (obj = extend(null || {}, obj)) && parent.call(this, obj, _Vdt, (_blocks.head = function(parent) {return ['         child head     '];}) && (__blocks.head = function(parent) {
            return blocks.head ? blocks.head(function() {
            return _blocks.head(parent);
            }) : _blocks.head(parent);
            }) && (_blocks.body = function(parent) {return ['         ', parent(), '         ', h('div',null, ['child body']), '     '];}) && (__blocks.body = function(parent) {
            return blocks.body ? blocks.body(function() {
            return _blocks.body(parent);
            }) : _blocks.body(parent);
            }) && __blocks);
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
            return (obj = extend(null || {}, obj)) && base.call(this, obj, _Vdt, (_blocks.body = function(parent) {return ['good'];}) && (__blocks.body = function(parent) {
            return blocks.body ? blocks.body(function() {
            return _blocks.body(parent);
            }) : _blocks.body(parent);
            }) && __blocks);
            """)

    it 'Stringify empty template directive', ->
        source = """
        <t:base />
        """

        stringifier.stringify(parser.parse(source)).should.eql("return (obj = extend(null || {}, obj)) && base.call(this, obj, _Vdt, __blocks)")