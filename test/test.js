//var Parser = require('../src/lib/parser');
//var Stringifier = require('../src/lib/stringifier');
//var util = require('util');
//var Utils = require('../src/lib/utils');
//var Vdt = require('../src/index');
//
//var parser = new Parser();
//var stringifier = new Stringifier();

//var source;
//source = "<div class={{ className }} style={{{width: '100px'}}}></div>";
//console.log(JSON.stringify(parser.parse(source, {
//    delimiters: ['{{', '}}']
//})));

//var source = "<script type='text/javascript'>\n\
//    var a = 1;\n\
//    console.log(a);\n\
//    if (a < 2) {\n\
//        console.log('less than {{ a < 2 'a' : 'b' }}');\n\
//    }\n\
//</script>\n\
//";
//
//
//console.log(util.inspect(parser.parse(source), {showHidden: true, depth: null}));


//var source;
//source = "\n<ul \nclassName=\"list\">\n    {[list].map(function(item) {\n        return <li id={item}>{item}</li>\n    })}\n</ul>";
//source = 'var a = "a\\"\\b"; <div class={"a\\" b"} a="a\'b">{a}</div>'
// source = '<div>{{a}</div>';
//source = '<script>var a = "<div>{a}\\a</div>";</script>';
//source = "<ul class=\"todo-list\">\n    {<li class=\"aa\"><li>}\n</ul>";
//source = "<t:card>\n    <b:body>\n        <div>test</div>\n    </b:body>\n</t:card>";
//Utils.setDelimiters(['{{', '}}']);
//source = "<script>\n    var a;\n\n    function aa() {\n        var msg;\n        msg = '<form onsubmit=\"return setPassword();\"';\n        msg += '  style=\"margin-bottom: 0px\">';\n        msg += '<input type=password size=10 id=\"password_input\">';\n        msg += '<\/form>';\n    }\n\n    if (a<1) { console.log(a) }\n\n    var b = \"{{ a }}\";\n</script>";
//source = "<div>\n    <div v-if={test === 1}>1</div>\n   <div v-else-if={test === 2}>2</div>\n    <!--<div v-else>default</div>-->\n</div>";
//source = "<div><div v-if={test === 1}></div> <Div v-else></Div></div>";
//console.log(util.inspect(parser.parse(source), {showHidden: true, depth: null}))
//source = "<Page />"
//console.log(stringifier.stringify(parser.parse(source)));

// var vdt = Vdt('<option selected={test}></option>');
// console.log(vdt.renderString({test: 0}));

var Vdt = require('../dist')
var source = '<div>{= self.content }</div>';
var vdt = Vdt(source);
console.log(vdt.renderString({content: '<div>a</div>'}))

