Parser = require('../src/lib/parser')
Stringifier = require('../src/lib/stringifier')
should = require('should')

parser = new Parser
stringifier = new Stringifier

describe 'Stringifier', ->
    it 'stringify attribute without value', ->
        source = """
        <input type="checkbox" checked />
        """
        stringifier.stringify(parser.parse(source)).should.eql("return h('input',{'type': 'checkbox', 'checked': null}, [])")