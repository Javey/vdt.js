Vdt = require('../dist/index')
should = require('should')


render = (source, data) ->
    vdt = Vdt(source)
    vdt.renderString(data || {})

describe 'Vdt', ->
    beforeEach ->
        Vdt.configure({skipWhitespace: false, disableSplitText: true})

    it 'Attribute without value should be rendered', ->
        source = """
        <input type="checkbox" checked />
        """
        render(source).should.be.eql('<input type="checkbox" checked />')

    it 'Render class and className', ->
        source = """
        <div class="aaa"><div className="bbb"></div></div>
        """
        render(source).should.be.eql '<div class="aaa"><div class="bbb"></div></div>'

    it 'Render string with quotes', ->
        source = """
        <div>
            <input placeholder="a'a" />
            <div>{'a\\'a'}</div>
        </div>
        """
        render(source).should.eql """
        <div>
            <input placeholder="a&#039;a" />
            <div>a&#039;a</div>
        </div>
        """

    it 'Render string with back quotes', ->
        source = """
        <div>
            {`a'<div>a`}
        </div>
        """
        render(source).should.eql """
        <div>
            a&#039;&lt;div&gt;a
        </div>
        """

    it 'Render without return', ->
        source = """
        return <div></div>
        """
        Vdt(source, {autoReturn: false}).renderString().should.eql '<div></div>'

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
            <div name="name a&#039;b">a&#039;ba&quot;b</div>
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

    it 'Render block', ->
        source = """
        <div>
            <b:content>
                <div>aaa</div>
            </b:content>
        </div>
        """
        render(source).should.eql """
        <div>
            
                <div>aaa</div>
            
        </div>
        """

    it 'Render template inherit', ->
        parent = """
        <div>
            <b:head>head</b:head>
            <b:body>body</b:body>
        </div>
        """
        source = """
        var a = 1;
        <t:parent>
            <b:head>
                child head
            </b:head>
            <b:body>
                {parent()}
                <div>child body {a}</div>
            </b:body>
        </t:parent>
        """
        parentTemplate = Vdt.compile(parent)
        render(source, {parent: parentTemplate}).should.eql """
        <div>
            
                child head
            
            
                body
                <div>child body 1</div>
            
        </div>
        """

    it 'Render template include', ->
        parent = """
        <div>
            <b:head>head</b:head>
            <b:body>body</b:body>
        </div>
        """
        source = """
        <t:parent />
        """
        parentTemplate = Vdt.compile(parent)
        render(source, {parent: parentTemplate}).should.eql """
        <div>
            head
            body
        </div>
        """

    it 'Render template nested', ->
        parent = """
        <div>
            <b:body>parent body</b:body>
        </div>
        """
        include = """
        <div>
            <b:body>include body</b:body>
        </div>
        """
        source = """
        <t:parent>
            <b:body>
                {parent()}
                <t:include>
                    <b:body>
                        {parent()}
                        child body
                    </b:body>
                </t:include>
            </b:body>
        </t:parent>
        """
        render(source, {
            parent: Vdt.compile(parent),
            include: Vdt.compile(include)
        }).should.eql """
        <div>
            
                parent body
                <div>
            
                        include body
                        child body
                    
        </div>
            
        </div>
        """

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
        render(source, {className: 'a'}).should.eql """<div class="a" style="width:100px;"></div>"""
        Vdt.setDelimiters(delimiters)

    it 'Render correctly when set delimiters to ["{%", "%}"]', ->
        source = """
        <div class={% className %} style={% {width: '100px'} %}>
            {test} {% test ? "test" : '{test}' %}
        </div>
        """
        delimiters = Vdt.getDelimiters()
        Vdt.setDelimiters(['{%', '%}'])
        render(source, {className: 'a', test: 0}).should.eql """
        <div class="a" style="width:100px;">
            {test} {test}
        </div>
        """
        Vdt.setDelimiters(delimiters)

    it '< in textNode', ->
        source = """
        <div>a < b ? a : b; a <2? a : b</div>
        """
        render(source).should.eql '<div>a &lt; b ? a : b; a &lt;2? a : b</div>'

    it 'Render script content', ->
        source = """
        <script type="text/javascript">
            var a = 1;
            console.log(a);
            if (a < 2) {
                console.log('less than {{ a < 2 ? 'a' : 'b' }}');
            }
        </script>
        """
        delimiters = Vdt.getDelimiters()
        Vdt.setDelimiters(['{{', '}}'])
        render(source, {a: 2}).should.eql """
        <script type="text/javascript">
            var a = 1;
            console.log(a);
            if (a < 2) {
                console.log('less than b');
            }
        </script>
        """
        Vdt.setDelimiters(delimiters)

    it 'Render script content with html string', ->
        source = """
        <script>
            var a;

            function aa() {
                var msg;
                msg = '<form onsubmit="return setPassword();"';
                msg += '  style="margin-bottom: 0px">';
                msg += '<input type=password size=10 id="password_input">';
                msg += '</form>';
            }

            if (a<1) { console.log(a) }

            var b = "{{ a }}";
        </script>
        """

        delimiters = Vdt.getDelimiters()
        Vdt.setDelimiters(['{{', '}}'])
        render(source, {a: 2}).should.eql """
        <script>
            var a;

            function aa() {
                var msg;
                msg = '<form onsubmit="return setPassword();"';
                msg += '  style="margin-bottom: 0px">';
                msg += '<input type=password size=10 id="password_input">';
                msg += '</form>';
            }

            if (a<1) { console.log(a) }

            var b = "2";
        </script>
        """
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

    it 'Render with skip whitespace', ->
        vdt = Vdt("""
            <div>
                <div>a</div>
            </div>
        """, {skipWhitespace: true})

        vdt.renderString().should.eql('<div><div>a</div></div>')

    it 'Whitepsace between strings should not be skipped', ->
        vdt = Vdt("""
            <div> aa b <div>c </div> </div>
        """, {skipWhitespace: true})

        vdt.renderString().should.eql('<div> aa b <div>c </div></div>')

    it 'Whitespace between string and expression should not be skipped', ->
        vdt = Vdt("""
            <div> aa {value} b <div>{c} </div> </div>
        """, {skipWhitespace: true})

        vdt.renderString({value: 1, c: 'c'}).should.eql('<div> aa 1 b <div>c </div></div>')

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

    it 'Render v-if v-else-if v-else for <t:template>', ->
        vdt = Vdt("""
            var a = function() { return <div>a</div> }
            var b = function() { return <div>b</div> }
            <div>
                <t:a v-if={test === 1} />
                <t:b v-else />
            </div>
        """)
        
        vdt.renderString({test: 1}).should.eql("""
            <div>
                <div>a</div>
            </div>
        """)

        vdt.renderString({test: 2}).should.eql("""
            <div>
                <div>b</div>
            </div>
        """)

    it 'Render v-if v-else-if v-else with whiteline', ->
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

    it 'Render v-if v-else-if v-else with whiteline and skip whitespace', ->
        vdt = Vdt("""
            <div>
                <div v-if={test === 1}>1</div>

                <div v-else-if={test === 2}>2</div>
            </div>
        """, {skipWhitespace: true})
        vdt.renderString({test: 2}).should.eql("""
            <div><div>2</div></div>
        """)
        vdt.renderString({test: 3}).should.eql("""
            <div></div>
        """)

    it 'Should throw error when render v-if v-else-if v-else with not whiteline', ->
        Vdt.bind(Vdt, """
            <div>
                <div v-if={test === 1}>1</div>
                sdfsdjf
                <div v-else-if={test === 2}>2</div>
            </div>
        """).should.throw('v-else-if must be led with v-if. At: {line: 4, column: 6}')

    it 'Render v-if v-else with comment', ->
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

    it 'Render v-if v-else in widget', ->
        source = """
        function Div(attrs) {return <div>{attrs.a}</div>}
        <div>
            <div v-if={test === 1}></div>
            <Div v-else-if={test === 2} a="2"></Div>
            <div v-else-if={test === 3}></div>
            <Div v-else a="4"></Div>
        </div>
        """
        render(source, {test: 4}).should.eql """
        <div>
            <div>4</div>
        </div>
        """

    it 'Render v-if and v-for', ->
        source = """
        <ul>
            <li v-if={index % 2} class="test" v-for={data} v-for-key="index">{value}</li>
        </ul>
        """
        render(source, {data: [1, 2, 3]}).should.eql """
        <ul>
            <li class="test">2</li>
        </ul>
        """

    it 'Render v-if and v-for in widget', ->
        source = """
        function Li(attrs) {return <li>{attrs.children}</li>}
        <ul>
            <Li v-if={index % 2} v-for={data} v-for-key="index">{value}</Li>
        </ul>
        """
        render(source, {data: [1, 2, 3]}).should.eql """
        <ul>
            <li>2</li>
        </ul>
        """

    it 'Render v-if and v-for in <t:template>', ->
        source = """
            var a = function(scope) { return <div>{scope.value}</div> }
            <div>
                <t:a v-if={key % 2} v-for={data} value={value} />
            </div>
        """
        render(source, {data: [1, 2, 3]}).should.eql """
            <div>
                <div>2</div>
            </div>
        """

    it 'Render object className', ->
        source = """
        <div class={{a: true, 'b c': show}}><i class="{a: 1}"></i></div>
        """
        
        render(source, {show: true}).should.eql """
        <div class="a b c"><i class="{a: 1}"></i></div>
        """

    it 'Render when variable undefined', ->
        source = """
        <div>{a}</div>
        """
        render(source).should.eql "<div></div>"

    it 'Render when function undefined', ->
        source = """
        <div ev-click={a}></div>
        """
        render(source).should.eql "<div></div>"

    it 'Render when subtemplate error', ->
        source = """
        <div a={[<div>{a}</div>]}></div>
        """
        render(source).should.eql "<div></div>"

    it 'Render when variable in new line', ->
        source = """
        <div>{
        a
        }</div>
        """
        render(source, {a: 1}).should.eql "<div>1</div>"

    it 'Render v-raw', ->
        source = """
        <div v-raw>{a}</div>
        """

        render(source).should.eql "<div>{a}</div>"

        source = """
        <div v-raw> {a}<span></span></div>
        """

        render(source).should.eql "<div> {a}&lt;span&gt;&lt;/span&gt;</div>"
