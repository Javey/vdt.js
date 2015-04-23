# Vdt.js

Vdt.js is a template engine based on virtual-dom technology.
It is inspired by [React](https://github.com/facebook/react)/[virtual-dom](https://github.com/Matt-Esch/virtual-dom),
and uses [JSX](https://facebook.github.io/react/docs/jsx-in-depth.html) as template syntax.

# Features

* Just the ui. Just the template further more.
* Virtual-dom. Diff update unlike [Handlebars](https://github.com/daaain/Handlebars)/[mustache.js](https://github.com/janl/mustache.js).
* One-way reactive data flow.
* Simple and lightweight. Rewrite a compiler instead of [jstransform](https://github.com/facebook/jstransform). Discard ES6 syntax sugar.

# Example

```html
<!DOCTYPE html>
<html>
<head lang="en">
    <meta charset="UTF-8">
    <title>vdt template engine demo</title>
</head>
<body>
<script type="text/vdt" id="template">
    var a = 1;
    <div className="users">
        <input id="add" value={input} /> input: {input}
        <ul>
            {users.map(function(user, index) {
                return <li className="user" id={user.id}>{index}: {user.name}</li>
            })}
        </ul>
        <div>this is a({a})</div>
    </div>
</script>
<script type="text/javascript" src="../dist/vdt.js"></script>
<script type="text/javascript">
    var data = {
        users: [
            {name: 'John', id: '1'},
            {name: 'Javey', id: '2'},
            {name: 'Tom', id: '3'},
            {name: 'Sarah', id: '4'}
        ],
        input: ''
    };

    var str = document.getElementById('template').innerHTML,
        template = Vdt(str),
        dom = template(data);

    document.body.appendChild(dom);

    var input = document.getElementById('add');
    input.addEventListener('input', function(e) {
        data.input = e.target.value;
        template.update(data);
    });
    input.addEventListener('change', function(e) {
        data.users.push({name: e.target.value, id: data.users.length});
        data.input = '';
        template.update(data);
    });
</script>
</body>
</html>
```

# Api

## Vdt(source)/Vdt.compile(source)

Compile JSX template source then return a function.

* @param `source` {String} JSX template source
* @return {Function} a function used to handle data

## The returned function `template`

The function returned by `Vdt/Vdt.compile`.

### template(data, [thisArg])

* @param `data` {Object} data passed to template
* @param `thisArg` {Object} the binding of this in template
* @return {Dom} html dom

### template.update(data)

* @param `data` {Object} whole data passed to template
* @return {Dom} html dom which has updated

### template.source

The source code of template function.

## Vdt.parse(source)

Parse JSX template to an ast object

* @param `source` {String} JSX template source
* @return {Object} abstract syntax tree object

## Vdt.stringify(ast)

Stringify the ast object to hscript string.

* @param `ast` {Object} abstract syntax tree object
* @return {String} hscript string with a return expression at end

## Vdt.virtualDom

The object exported by [virtual-dom](https://github.com/Matt-Esch/virtual-dom) module.
