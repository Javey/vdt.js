Vdt = require('../src/vdt')

describe 'Vdt', ->
    it 'Compile JSX to template function', ->
        source = """
        <div>{test}</div>
        """

        output = """
        function(obj, Vdt) {
        var h = Vdt.virtualDom.h;
        with(obj || {}) {return h('div',null, [test])};
        }
        """

        Vdt.compile(source).source.should.be.eql(output)