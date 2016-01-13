Vdt = require('../src/index')
should = require('should')

describe 'Vdt', ->
    it 'Compile JSX to template function', ->
        source = """
        <div>{test}</div>
        """

        Vdt(source).renderString({test: 1}).should.eql("<div>1</div>")

    it 'Compile JSX set autoReturn to false', ->
        source = """
        return <div>{test}</div>
        """

        Vdt(source, {autoReturn: false}).renderString({test: 1}).should.eql("<div>1</div>")

    it 'vdt.data.vdt === vdt', ->
        vdt = Vdt('<div></div>')
        vdt.data.vdt.should.equal(vdt)
        vdt.render()
        vdt.data.vdt.should.equal(vdt)
        vdt.render({})
        vdt.data.vdt.should.equal(vdt)
        vdt.update({})
        vdt.data.vdt.should.equal(vdt)

    it 'Render to string', ->
        vdt = Vdt('<div>{test}</div>')
        vdt.renderString({test: 'test'}).should.be.eql('<div>test</div>')
        vdt.renderString({test: 'aaa'}).should.be.eql('<div>aaa</div>')

    it 'Render to string with style', ->
        vdt = Vdt('<div style={{width: "100px", fontSize: "24px"}} index="1"></div>')
        vdt.renderString().should.eql('<div style="width:100px;font-size:24px;" index="1"></div>')

    it 'Render file', ->
        Vdt.setDefaults({
            delimiters: ['{{', '}}'],
            views: './test/tpl'
        })
        Vdt.renderFile('index', {test: 1}).should.eql("<!DOCTYPE html>\n<html>\n<head>\n    <meta charset=\"utf-8\" />\n    <title>advance-demo</title>\n    <link type=\"text/css\" rel=\"stylesheet\" href=\"/static/css/test.css\" />\n    </head>\n    <body>\n    <h1>index page powered by Advanced uses vdt template engine</h1>\n    <div>{test}</div>\n    <div>AAA</div>\n    <div>BBB</div>\n    <div>&lt;div&gt;{test}&lt;/div&gt;</div>\n    <p>Hello 1</p>\n    <script type=\"text/javascript\">\n        var a = 1\n    </script>\n    \n        test main\n        <div>&lt;div&gt;test&lt;/div&gt;</div>\n    \n    \n        \n        <script type=\"text/javascript\" src=\"/node_modules/vdt/dist/vdt.js\"></script>\n    \n        <script type=\"text/javascript\">\n            var a = 1;\n            console.log(a);\n            if (a < 2) {\n                console.log('less than a');\n            }\n        </script>\n    \n    </body>\n</html>")

    it 'Render html comment', ->
        source = """
        <div>
            <!-- this is a html comment -->
            test
        </div>
        """
        vdt = Vdt(source)

        vdt.renderString().should.eql(source)
