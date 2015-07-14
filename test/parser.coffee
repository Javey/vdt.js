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
        source = "<page />"

        parser.parse(source).should.be.eql [{"type":2,"typeName":"JSXElement","value":"page","attributes":[],"children":[]}]

    it 'Parse widget', ->
        source = """
        <Page title="test">
            <div>1</div>
            <div>2</div>
        </Page>
        """

        parser.parse(source).should.be.eql [{"type":6,"typeName":"JSXWidget","value":"Page","attributes":[{"type":4,"typeName":"JSXAttribute","name":"title","value":{"type":1,"typeName":"JSXText","value":"test"}}],"children":[{"type":1,"typeName":"JSXText","value":"\n    "},{"type":2,"typeName":"JSXElement","value":"div","attributes":[],"children":[{"type":1,"typeName":"JSXText","value":"1"}]},{"type":1,"typeName":"JSXText","value":"\n    "},{"type":2,"typeName":"JSXElement","value":"div","attributes":[],"children":[{"type":1,"typeName":"JSXText","value":"2"}]},{"type":1,"typeName":"JSXText","value":"\n"}]}]

    it 'Parse widget with event', ->
        source = """
        <Page title="test" ev-change:size={function() {console.log(1)}}>
            <div>1</div>
            <div>2</div>
        </Page>
        """

        parser.parse(source).should.be.eql [{"type":6,"typeName":"JSXWidget","value":"Page","attributes":[{"type":4,"typeName":"JSXAttribute","name":"title","value":{"type":1,"typeName":"JSXText","value":"test"}},{"type":4,"typeName":"JSXAttribute","name":"ev-change:size","value":{"type":3,"typeName":"JSXExpressionContainer","value":[{"type":0,"typeName":"JS","value":"function() {console.log(1)}"}]}}],"children":[{"type":1,"typeName":"JSXText","value":"\n    "},{"type":2,"typeName":"JSXElement","value":"div","attributes":[],"children":[{"type":1,"typeName":"JSXText","value":"1"}]},{"type":1,"typeName":"JSXText","value":"\n    "},{"type":2,"typeName":"JSXElement","value":"div","attributes":[],"children":[{"type":1,"typeName":"JSXText","value":"2"}]},{"type":1,"typeName":"JSXText","value":"\n"}]}]

    it 'Parse attribute whose value is element', ->
        source = """
        <div data={[<div>1</div>, <div>2</div>]} value={[1, 2]}></div>
        """
        parser.parse(source).should.be.eql [{"type":2,"typeName":"JSXElement","value":"div","attributes":[{"type":4,"typeName":"JSXAttribute","name":"data","value":{"type":3,"typeName":"JSXExpressionContainer","value":[{"type":0,"typeName":"JS","value":"["},{"type":2,"typeName":"JSXElement","value":"div","attributes":[],"children":[{"type":1,"typeName":"JSXText","value":"1"}]},{"type":0,"typeName":"JS","value":", "},{"type":2,"typeName":"JSXElement","value":"div","attributes":[],"children":[{"type":1,"typeName":"JSXText","value":"2"}]},{"type":0,"typeName":"JS","value":"]"}]}},{"type":4,"typeName":"JSXAttribute","name":"value","value":{"type":3,"typeName":"JSXExpressionContainer","value":[{"type":0,"typeName":"JS","value":"[1, 2]"}]}}],"children":[]}]

    it 'Parse block directive', ->
        source = """
        <div>
            <b:content />
        </div>
        """
        parser.parse(source).should.be.eql [{"type":2,"typeName":"JSXElement","value":"div","attributes":[],"children":[{"type":1,"typeName":"JSXText","value":"\n    "},{"type":8,"typeName":"JSXBlock","value":"content","attributes":[],"children":[]},{"type":1,"typeName":"JSXText","value":"\n"}]}]

    it 'Parse unknown directive should throw a error', ->
        source = """
        <div>
            <c:content />
        </div>
        """

        parser.parse.bind(parser, source).should.throw('Unknown directive c:')

    it 'Parse vdt template directive', ->
        source = """
        <t:card>
            <b:body>
                <div>test</div>
            </b:body>
        </t:card>
        """

        parser.parse(source).should.be.eql [{"type":7,"typeName":"JSXVdt","value":"card","attributes":[],"children":[{"type":1,"typeName":"JSXText","value":"\n    "},{"type":8,"typeName":"JSXBlock","value":"body","attributes":[],"children":[{"type":1,"typeName":"JSXText","value":"\n        "},{"type":2,"typeName":"JSXElement","value":"div","attributes":[],"children":[{"type":1,"typeName":"JSXText","value":"test"}]},{"type":1,"typeName":"JSXText","value":"\n    "}]},{"type":1,"typeName":"JSXText","value":"\n"}]}]

    it 'Parse vdt template with js', ->
        source = """
        var a = 1;
        <t:card>
            <b:body>
                <div>test</div>
            </b:body>
        </t:card>
        """

        parser.parse(source).should.be.eql [{"type":0,"typeName":"JS","value":"var a = 1;\n"},{"type":7,"typeName":"JSXVdt","value":"card","attributes":[],"children":[{"type":1,"typeName":"JSXText","value":"\n    "},{"type":8,"typeName":"JSXBlock","value":"body","attributes":[],"children":[{"type":1,"typeName":"JSXText","value":"\n        "},{"type":2,"typeName":"JSXElement","value":"div","attributes":[],"children":[{"type":1,"typeName":"JSXText","value":"test"}]},{"type":1,"typeName":"JSXText","value":"\n    "}]},{"type":1,"typeName":"JSXText","value":"\n"}]}]
