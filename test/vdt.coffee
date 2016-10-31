Vdt = require('../src/index')
should = require('should')

render = (source, data) ->
    vdt = Vdt(source)
    vdt.renderString(data || {})

describe 'Vdt', ->
    it 'Unclosed tag should throw a error', ->
        source = """
        <ul class="todo-list">
            {<li class="aa"><li>}
        </ul>
        """
        Vdt.bind(Vdt, source).should.throw("""
            expect string </ At: {line: 3, column: 6} Near: "li>}
            </ul>"
        """)

    it 'Redundant } in JSXElement should be parsed correctly', ->
        source = "<div>{a}}</div>"
        render(source, {a: 1}).should.be.eql('<div>1}</div>')

    it 'Redundant } in JS should throw a error', ->
        source = """
        <ul className="list">
            {[list].map(function(item) {
                return <li id={item}}>{item}</li>
            })}
        </ul>
        """
        Vdt.bind(Vdt, source).should.throw("""
            Unexpected identifier } At: {line: 3, column: 29} Near: " id={item}}>{item}</li>
                })"
        """)

    it 'Redundant { in should throw a error', ->
        source = "<div>{{a}</div>"

        Vdt.bind(Vdt, source).should.throw('expect string } At: {line: 1, column: 16} Near: "{{a}</div>"')

    it 'Escaped quote in string', ->
        source = """
            <div name="name a\'b">{"a'b"}{"a\\"b"}</div>
        """
        render(source).should.be.eql """
            <div name="name a'b">a'ba"b</div>
        """
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

        render(source, {a: 1}).should.eql """
        <div class="div">
            
            1
        </div>
        """

    it 'Parse source with self-closing tags', ->
        source = """
        <div>
            <input type="text">
            <span>aaa</span>
            <hr>
            <img src="aaa"/>
        </div>
        """

        render(source).should.eql """
        <div>
            <input type="text" />
            <span>aaa</span>
            <hr />
            <img src="aaa" />
        </div>
        """

    it 'Parse unknown self-closing tags', ->
        source = "<page />"

        render(source).should.eql("<page></page>")

    it 'Parse widget', ->
        source = """
        var Page = function(attrs) {
            return <div title={attrs.title}>
                {attrs.children}
            </div>
        }
        <Page title="test">
            <div>1</div>
            <div>2</div>
        </Page>
        """
        
        render(source).should.eql "<div title=\"test\">\n        \n    <div>1</div>\n    <div>2</div>\n\n    </div>"

    it 'Parse widget which named with one char', ->
        source = """
        var A = function() { return <a></a> }
        <div><A /></div>
        """
        render(source).should.eql "<div><a></a></div>"

    it 'Parse attribute whose value is element', ->
        source = """
        var A = function(attrs) {
            return <div>{attrs.data}{attrs.value}</div>
        }
        <A data={[<div>1</div>, <div>2</div>]} value={[1, 2]}></A>
        """
        render(source).should.be.eql "<div><div>1</div><div>2</div>12</div>"

    it 'Render html comment', ->
        source = """
        <div>
            <!-- this is html comment -->
            test
        </div>
        """
        render(source).should.be.eql source

    it 'Render correctly when set delimiters to ["{{", "}}"]', ->
        source = """
        <div class={{ className }} style={{{width: '100px'}}} ev-click={{ function() {  }}}></div>
        """
        delimiters = Vdt.getDelimiters()
        Vdt.setDelimiters(['{{', '}}'])
        render(source, {className: 'a'}).should.eql """<div style="width:100px;" class="a"></div>"""
        Vdt.setDelimiters(delimiters)


    it 'Render simple JSX', ->
        source = """
        <div>{test}</div>
        """

        Vdt(source).renderString({test: 1}).should.eql("<div>1</div>")

    it 'Compile JSX set autoReturn to false', ->
        source = """
        return <div>{test}</div>
        """

        Vdt(source, {autoReturn: false}).renderString({test: 1}).should.eql("<div>1</div>")

    it 'Render to string', ->
        vdt = Vdt('<div>{test}</div>')
        vdt.renderString({test: 'test'}).should.be.eql('<div>test</div>')
        vdt.renderString({test: 'aaa'}).should.be.eql('<div>aaa</div>')

    it 'Render to string with style', ->
        vdt = Vdt('<div style={{width: "100px", fontSize: "24px"}} index="1"></div>')
        vdt.renderString().should.eql('<div style="width:100px;font-size:24px;" index="1"></div>')

    it 'Render html comment', ->
        source = """
        <div>
            <!-- this is a html comment -->
            test
        </div>
        """
        vdt = Vdt(source)

        vdt.renderString().should.eql(source)

    it 'Render attribute which is null or undefined', ->
        vdt = Vdt("<div name={test} a={test} b={test1}></div>")

        vdt.renderString({test: undefined, test1: null}).should.eql("<div></div>")

    it 'Render attribute which is boolean', ->
        vdt = Vdt("<option selected={test}></option>")

        vdt.renderString({test: false}).should.eql("<option></option>")

    it 'Render attribute which is number', ->
        vdt = Vdt("<div name={test}></div>")

        vdt.renderString({test: 1}).should.eql('<div name="1"></div>')

    it 'Render v-if v-else-if v-else', ->
        vdt = Vdt("""
            <div>
                <div v-if={test === 1}>1</div>
                <div v-else-if={test === 2}>2</div>
                <div v-else>default</div>
            </div>
        """)

        vdt.renderString({test: 1}).should.eql("""
            <div>
                <div>1</div>
            </div>
        """)
        vdt.renderString({test: 2}).should.eql("""
            <div>
                <div>2</div>
            </div>
        """)
        vdt.renderString({test: 3}).should.eql("""
            <div>
                <div>default</div>
            </div>
        """)

        vdt = Vdt("""
            <div>
                <div v-if={test === 1}>1</div>

                <div v-else-if={test === 2}>2</div>
            </div>
        """)
        vdt.renderString({test: 2}).should.eql("""
            <div>
                <div>2</div>
            </div>
        """)
        vdt.renderString({test: 3}).should.eql("""
            <div>
                
            </div>
        """)

        Vdt.bind(Vdt, """
            <div>
                <div v-if={test === 1}>1</div>
                sdfsdjf
                <div v-else-if={test === 2}>2</div>
            </div>
        """).should.throw('v-else-if (test === 2) must be led with v-if')

        vdt = Vdt("""
            <div>
                <div v-if={test === 1}>1</div>
                <div v-else-if={test === 2}>2</div>
                <!--<div v-else>default</div>-->
            </div>
        """)
        vdt.renderString({test: 2}).should.eql """
            <div>
                <div>2</div>
                <!--<div v-else>default</div>-->
            </div>
        """
