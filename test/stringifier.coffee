Parser = require('../src/lib/parser')
Utils = require('../src/lib/utils')
Stringifier = require('../src/lib/stringifier')
should = require('should')

parser = new Parser
stringifier = new Stringifier

# describe 'Stringifier', ->
    # it 'Stringify widget with event', ->
        # source = """
        # <Page title="test" ev-change:size={function() {console.log(1)}}>
            # <div>1</div>
            # <div>2</div>
        # </Page>
        # """
        # stringifier.stringify(parser.parse(source)).should.eql "return Page({'title': 'test', 'ev-change:size': function() {try {return function() {console.log(1)}} catch(e) {_e(e)}}.call(this), 'children': ['\\n    ', h('div',null, ['1']), '\\n    ', h('div',null, ['2']), '\\n']}, widgets)"
