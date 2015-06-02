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

    it 'Redundant } in JSXElement should be parsed correctly', ->
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

    it 'Redundant } in JS should throw a error', ->
        source = """
        <ul className="list">
            {[list].map(function(item) {
                return <li id={item}}>{item}</li>
            })}
        </ul>
        """
        parser.parse.bind(parser, source).should.throw('Unexpected identifier }')

    it 'Redundant { in should throw a error', ->
        source = "<div>{{a}</div>"
        parser.parse.bind(parser, source).should.throw('expect string }')

    it 'Parse source with comment', ->
        source = """
        // comment
        var a = 1; // comment
        /* comment */
        /*
         * comment
         */

        <div className="div">
            {/* comment in element */}
            {a}
        </div>
        """
        parser.parse(source).should.be.eql([
            {
                "type":0,
                "typeName":"JS",
                "value":"// comment\nvar a = 1; // comment\n/* comment */\n/*\n * comment\n */\n\n"
            },
            {
                "type":2,
                "typeName":"JSXElement",
                "value":"div",
                "attributes":[
                    {
                        "type":4,
                        "typeName":"JSXAttribute",
                        "name":"className",
                        "value":{
                            "type":1,
                            "typeName":"JSXText",
                            "value":"div"
                        }
                    }
                ],
                "children":[
                    {
                        "type":1,
                        "typeName":"JSXText",
                        "value":"\n    "
                    },
                    {
                        "type":3,
                        "typeName":"JSXExpressionContainer",
                        "value":[
                            {
                                "type":0,
                                "typeName":"JS",
                                "value":"/* comment in element */"
                            }
                        ]
                    },
                    {
                        "type":1,
                        "typeName":"JSXText",
                        "value":"\n    "
                    },
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
                        "value":"\n"
                    }
                ]
            }
        ])

    it 'Parse source with self-closing tags', ->
        source = """
        <div>
            <input type="text">
            <span>aaa</span>
            <hr>
            <img src="aaa"/>
        </div>
        """

        parser.parse(source).should.be.eql [{"type":2,"typeName":"JSXElement","value":"div","attributes":[],"children":[{"type":1,"typeName":"JSXText","value":"\n    "},{"type":2,"typeName":"JSXElement","value":"input","attributes":[{"type":4,"typeName":"JSXAttribute","name":"type","value":{"type":1,"typeName":"JSXText","value":"text"}}],"children":[]},{"type":1,"typeName":"JSXText","value":"\n    "},{"type":2,"typeName":"JSXElement","value":"span","attributes":[],"children":[{"type":1,"typeName":"JSXText","value":"aaa"}]},{"type":1,"typeName":"JSXText","value":"\n    "},{"type":2,"typeName":"JSXElement","value":"hr","attributes":[],"children":[]},{"type":1,"typeName":"JSXText","value":"\n    "},{"type":2,"typeName":"JSXElement","value":"img","attributes":[{"type":4,"typeName":"JSXAttribute","name":"src","value":{"type":1,"typeName":"JSXText","value":"aaa"}}],"children":[]},{"type":1,"typeName":"JSXText","value":"\n"}]}]

    it 'Parse unknown self-closing tags', ->
        source = "<Page />"

        parser.parse(source).should.be.eql [{"type":2,"typeName":"JSXElement","value":"Page","attributes":[],"children":[]}]
