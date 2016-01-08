var Parser = require('../src/lib/parser');

var parser = new Parser();

var source = "<ul class=\"todo-list\">\n\
    {<li class=\"aa\"><li>}\n\
</ul>";

console.log(parser.parse(source));