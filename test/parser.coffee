Parser = require('../src/lib/parser')
Utils = require('../src/lib/utils')
should = require('should')

parser = new Parser

describe 'Parser', ->
    it 'Unclosed tag should throw a error', ->
        source = """
        <ul class="todo-list">
            {<li class="aa"><li>}
        </ul>
        """
        parser.parse.bind(parser, source).should.throw("""
            expect string </ At: {line: 3, column: 3} Near: "li>}
            </ul>"
        """)

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
        parser.parse.bind(parser, source).should.throw("""
            Unexpected identifier } At: {line: 3, column: 26} Near: " id={item}}>{item}</li>
                })"
        """)

    it 'Redundant { in should throw a error', ->
        source = "<div>{{a}</div>"

        parser.parse.bind(parser, source).should.throw('expect string } At: {line: 1, column: 12} Near: ">{{a}</div>"')

    it 'Escaped quote in string', ->
        source = """
            <div name="name a\'b">{"a'b"}</div>
        """
        parser.parse(source).should.be.eql([{"type":2,"typeName":"JSXElement","value":"div","attributes":[{"type":4,"typeName":"JSXAttribute","name":"name","value":{"type":1,"typeName":"JSXText","value":"name a'b"}}],"children":[{"type":3,"typeName":"JSXExpressionContainer","value":[{"type":0,"typeName":"JS","value":"\"a'b\""}]}]}])

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

    it 'Parse widget which name with one char', ->
        source = """
        <div><A /></div>
        """

        parser.parse(source).should.be.eql [{"type":2,"typeName":"JSXElement","value":"div","attributes":[],"children":[{"type":6,"typeName":"JSXWidget","value":"A","attributes":[],"children":[]}]}]

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

        parser.parse.bind(parser, source).should.throw("""
            Unknown directive c: At: {line: 2, column: 5} Near: "div>
                <c:content />
            </div>"
        """)

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

    it 'Parse vdt template with self-closing tag as parent\'s name', ->
        source = """
        <t:base>
            <b:body>
                home body
            </b:body>
        </t:base>
        """

        parser.parse(source).should.be.eql [{"type":7,"typeName":"JSXVdt","value":"base","attributes":[],"children":[{"type":1,"typeName":"JSXText","value":"\n    "},{"type":8,"typeName":"JSXBlock","value":"body","attributes":[],"children":[{"type":1,"typeName":"JSXText","value":"\n        home body\n    "}]},{"type":1,"typeName":"JSXText","value":"\n"}]}]

    it 'Parse html comment', ->
        source = """
        <div>
            <!-- this is html comment -->
            test
        </div>
        """

        parser.parse(source).should.be.eql [{"type":2,"typeName":"JSXElement","value":"div","attributes":[],"children":[{"value":"\n    ","type":1,"typeName":"JSXText"},{"value":" this is html comment ","type":9,"typeName":"JSXComment"},{"value":"\n    test\n","type":1,"typeName":"JSXText"}]}]

    it 'Parse directive', ->
        source = """
        <div v-if={true} class="test" v-for={data} v-for-value="item" v-for-key="index">show</div>
        """

        parser.parse(source).should.be.eql [{"type":2,"typeName":"JSXElement","value":"div","attributes":[{"name":"class","type":4,"typeName":"JSXAttribute","value":{"value":"test","type":1,"typeName":"JSXText"}}],"directives":[{"name":"v-if","type":10,"typeName":"JSXDirective","value":{"value":[{"value":"true","type":0,"typeName":"JS"}],"type":3,"typeName":"JSXExpressionContainer"}},{"name":"v-for","type":10,"typeName":"JSXDirective","value":{"value":[{"value":"data","type":0,"typeName":"JS"}],"type":3,"typeName":"JSXExpressionContainer"}},{"name":"v-for-value","type":10,"typeName":"JSXDirective","value":{"value":"item","type":1,"typeName":"JSXText"}},{"name":"v-for-key","type":10,"typeName":"JSXDirective","value":{"value":"index","type":1,"typeName":"JSXText"}}],"children":[{"value":"show","type":1,"typeName":"JSXText"}]}]
#    it 'Parse correctly when set delimiters to ["{{", "}}"]', ->
#        source = """
#        <div class={{ className }} style={{{width: '100px'}}}></div>
#        """
#
#        parser.parse(source, {delimiters: ['{{', '}}']}).should.be.eql [{"type":2,"typeName":"JSXElement","value":"div","attributes":[{"name":"class","type":4,"typeName":"JSXAttribute","value":{"value":[{"value":" className ","type":0,"typeName":"JS"}],"type":3,"typeName":"JSXExpressionContainer"}},{"name":"style","type":4,"typeName":"JSXAttribute","value":{"value":[{"value":"{width: '100px'}","type":0,"typeName":"JS"}],"type":3,"typeName":"JSXExpressionContainer"}}],"children":[]}]

