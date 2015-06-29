Vdt = require('../src/lib/vdt')

describe 'Vdt', ->
    it 'Compile JSX to template function', ->
        source = """
        <div>{test}</div>
        """

        output = """
        function(obj, _Vdt) {
        _Vdt || (_Vdt = Vdt); var h = _Vdt.virtualDom.h;
        with(obj || {}) {
        return h('div',null, [test])
        };
        }
        """

        Vdt.compile(source).source.should.be.eql(output)

    it 'Compile JSX set autoReturn to false', ->
        source = """
        <div>{test}</div>
        """

        output = """
        function(obj, _Vdt) {
        _Vdt || (_Vdt = Vdt); var h = _Vdt.virtualDom.h;
        with(obj || {}) {
        h('div',null, [test])
        };
        }
        """

        Vdt.compile(source, {autoReturn: false}).source.should.be.eql(output)