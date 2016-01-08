Vdt = require('../src/lib/vdt')
should = require('should')

describe 'Vdt', ->
    it 'Compile JSX to template function', ->
        source = """
        <div>{test}</div>
        """

        output = """
        function(obj, _Vdt, blocks) {
        _Vdt || (_Vdt = Vdt);
        blocks || (blocks = {});
        var h = _Vdt.virtualDom.h, widgets = this.widgets || (this.widgets = {}), _blocks = {}, __blocks = {},
        extend = _Vdt.utils.extend;
        with (obj || {}) {
        return h('div',null, [test])
        }
        }
        """

        Vdt.compile(source).source.should.be.eql(output)

    it 'Compile JSX set autoReturn to false', ->
        source = """
        <div>{test}</div>
        """

        output = """
        function(obj, _Vdt, blocks) {
        _Vdt || (_Vdt = Vdt);
        blocks || (blocks = {});
        var h = _Vdt.virtualDom.h, widgets = this.widgets || (this.widgets = {}), _blocks = {}, __blocks = {},
        extend = _Vdt.utils.extend;
        with (obj || {}) {
        h('div',null, [test])
        }
        }
        """

        Vdt.compile(source, {autoReturn: false}).source.should.be.eql(output)

    it 'vdt.data.vdt === vdt', ->
        vdt = Vdt('<div></div>')
        vdt.data.vdt.should.equal(vdt)
        vdt.render()
        vdt.data.vdt.should.equal(vdt)
        vdt.render({})
        vdt.data.vdt.should.equal(vdt)
        vdt.update({})
        vdt.data.vdt.should.equal(vdt)

    it 'Render to string', ->
        vdt = Vdt('<div>{test}</div>')
        vdt.renderString({test: 'test'}).should.be.eql('<div>test</div>')
        vdt.renderString({test: 'aaa'}).should.be.eql('<div>aaa</div>')

    it 'Render to string with style', ->
        vdt = Vdt('<div style={{width: "100px", fontSize: "24px"}} index="1"></div>')
        console.log vdt.renderString()
