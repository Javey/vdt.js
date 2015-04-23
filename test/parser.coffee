Parser = require('../src/lib/parser')
should = require('should')

parser = new Parser

describe 'Parser', ->
    it 'Unclosed tag should throw a error', ->
        source = """
        <ul class="todo-list">
            {<li class="aa"><li>}
        </ul>
        """
        parser.parse.bind(parser, source).should.throw('expect string </')

    it 'Unmatched {} in JSXElement should be parsed correctly', ->
        source = "<div>{a}}</div>"
        parser.parse(source).should.be.eql([
            {
                "type":2,
                "typeName":"JSXElement",
                "value":"div",
                "attributes":[],
                "children":[
                    {
                        "type":3,
                        "typeName":"JSXExpressionContainer",
                        "value":[
                            {
                                "type":0,
                                "typeName":"JS",
                                "value":"a"
                            }
                        ]
                    },
                    {
                        "type":1,
                        "typeName":"JSXText",
                        "value":"}"
                    }
                ]
            }
        ])

    it 'Unmatched {} in JS should throw a error', ->
        source = """
        <ul class="list">
            {[list].map(function(item) {
                return <li id={item}}>{item}</li>
            })}
        </ul>
        """
        parser.parse.bind(parser, source).should.throw('Unexpected identifier }')