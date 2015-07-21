# Vdt.js

> vdt is short for virtual-dom template

`Vdt` is a template engine based on virtual-dom technology.
It is inspired by [React](https://github.com/facebook/react)/[virtual-dom](https://github.com/Matt-Esch/virtual-dom),
and uses [JSX](https://facebook.github.io/react/docs/jsx-in-depth.html) as template syntax.

See [TodoMVC](http://javey.github.io/vdt-todomvc/) implemented by `Vdt`

# Features

* Just the ui. Just the template further more. But more powerful than common template.
* Virtual-dom. Diff update unlike [Handlebars](https://github.com/daaain/Handlebars)/[mustache.js](https://github.com/janl/mustache.js).
* Lightweight. Rewrite a compiler instead of [jstransform](https://github.com/facebook/jstransform). Discard ES6 syntax sugar and JS analysis, so it's faster.
* Template can be extended. `<t:template>` `<b:block>`
* Easy to use. You can use it with any other js library, such as jQuery. See [vdt-todomvc](https://github.com/Javey/vdt-todomvc)

# Install

```shell
npm install vdt --save
```

# Example

[demo](http://javey.github.io/vdt/demo.html)

```html
<!DOCTYPE html>
<html>
<head lang="en">
    <meta charset="UTF-8">
    <title>vdt template engine demo</title>
</head>
<body>
<script type="text/vdt" id="template">
    var a = 1, // this is a
        showInfo = function(index, name) {
            alert('Click ' + index + ' ' + name);
        }
    <div class="users">
        <input value={input} ev-change={add} ev-input={change}/> input: {input}
        <ul>
            {/* output users */}
            {users.map(function(user, index) {
                return <li className="user" id={user.id} ev-click={
                    // use es5's bind or underscore's bind to pass arguments
                    showInfo.bind(null, index, user.name)
                    // or closure
                    /*function() {
                        showInfo(index, user.name);
                    }*/
                }>{index}: {user.name}</li>
            })}
        </ul>
        {/* custom attributes */}
        <div attributes={{'data-a': a, input: input}} id={a} ev-dblclick={function() {console.log('Dblclick')}}>this is a({a})</div>
    </div>
</script>
<script type="text/javascript" src="../dist/vdt.js"></script>
<script type="text/javascript">
    var vdt = Vdt(document.getElementById('template').innerHTML),
        model = {
            users: [
                {name: 'John', id: '1'},
                {name: 'Javey', id: '2'},
                {name: 'Tom', id: '3'},
                {name: 'Sarah', id: '4'}
            ],
            input: '',

            add: function(e) {
                model.users.push({name: e.target.value, id: model.users.length});
                model.input = '';
                vdt.update();
            },

            change: function(e) {
                model.input = e.target.value;
                vdt.update();
            }
        };

    document.body.appendChild(vdt.render(model));
</script>
</body>
</html>
```

# Custom attributes

See [vnode.md](https://github.com/Matt-Esch/virtual-dom/blob/7cd99a160f8d7c9953e71e0b26a740dae40e55fc/docs/vnode.md#custom-attributes-data-)

You can write template like this to render custom attributes directly.

```html
<div attributes={{'data-a': a, input: input}} id={a}>this is a({a})</div>
```

# Notice

1. ~~Use `className` instead of `class` in html.~~
2. ~~All html tags must be closed. e.g. `<input />`.~~
3. Use `{/* comment */}` instead of `<!-- comment -->`. It is just Javascript comment which is wrapped by `{}`.
4. The last html element will be returned. You must wrap all html in a element. e.g.

    ```html
    <div>
        <h1>title</h1>
        <div>body</div>
    </div>
    ```
    instead of
    ```html
    <h1>title</h1>
    <div>body</div>
    ```
    The second one will return only one element `<div>body</body>`.

# Express middleware

Take vdt as a express middleware.

```javascript
app.use(require('vdt').middleware({
    src: 'vdt/src/path',
    amd: true, // and amd wrapper
    force: false, // force compile
    autoReturn: true // see api of `Vdt` below
}));
```

# Escape & Unescape

Any output will be escaped. If you want prevent it, you can do it likes below:

```javascript
var a = '<h1>title</h1>';
<div>{a}</div> // a will be escaped, -> <div>&lt;h1&gt;title&lt;/h1&gt;</div>
<div innerHTML={a}></div> // a will not be escaped -> <div><h1>title</h1></div>
```

# Event

You can bind event in `vdt` template directly by adding `ev-event` property, likes below:

```javascript
<ul>
    {/* output users */}
    {users.map(function(user, index) {
        return <li className="user" id={user.id} ev-click={
            // use es5's bind or underscore's bind to pass arguments
            showInfo.bind(null, index, user.name)
            // or closure
            /*function() {
                showInfo(index, user.name);
            }*/
        }>{index}: {user.name}</li>
    })}
</ul>
```

# Template Extend

Vdt template can be extended. Use `<t:template>` and `<b:block>` directive.

Use `<t:template>` to extend the parent template function. `template` is a function of parent template.

Use `<t:block`> to set block which can be filled by child.

Use `parent()` to get parent content.

1. **`parent` is a keyword for referencing parent block, so don't name template function as `parent`.**
2. **`<t:template>` can be nested in `<t:block>`; `<b:block>` can be nested in `<b:block>`.**

```jsx
<script type="text/vdt" id="parent">
    <div className="card">
        <div className="head">{title}</div>
        <b:body>
            <div>parent body</div>
        </b:body>
        <b:footer>
            <div>parent footer</div>
        </b:footer>
    </div>
</script>
```

```jsx
<script type="text/vdt" id="child">
    // You can also compile it in node, then require it by require.js
    var father = Vdt.compile(document.getElementById('parent').innerHTML);
    <t:father title="child card title">
        <b:body>
            <div>child body</div>
        </b:body>
        <b:footer>
            {parent()}
            <div>child footer</div>
        </b:footer>
    </t:father>
</script>
```

# Api

## Vdt(source, [options])

Compile `source` then return a vdt object.

* @param `source` {String|Function} JSX template source or a template function returned by `Vdt.compile`
* @param `options.autoReturn=true` {Object|Boolean} If add `return` keyword at end or not. The last element of template have to be a `html tag element` if is `true`.
* @return {Object} a vdt object

## Vdt.compile(source, [options])

Compile JSX template source then return a template function which should pass to `Vdt`.

The returned function has a property named source. You can use it to pre-process JSX.

* @param `source` {String} JSX template source
* @param `options.autoReturn=true` {Object|Boolean} If add `return` keyword at end or not. The last element of template have to be a `html tag element` if is `true`.
* @return {Function} a template function should pass to `Vdt`.

### template.source

The source code of template function.

## The `vdt` object

The object returned by `Vdt`.

### vdt.render(data)

Handle data and return a dom.

* @param `data` {Object} data passed to template
* ~~@param `thisArg` {Object} the binding of this in template.~~ `this` is `data` in template.
* @return {Dom} html dom

### vdt.update([data])

Update the dom using the new data.

* @param `data` {Object} the whole data passed to template. If it is not provided, `vdt.data` will be used.
* @return {Dom} html dom which has updated

### vdt.data

The data passed to vdt above. So you can modify it directly.

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

# Benchmark

See [Benchmark](http://javey.github.io/vdt/benchmark/benchmark.html)

## Render(compile every time)

* Vdt.js#render x 5,454 ops/sec ±2.40% (89 runs sampled)
* Lodash#render x 2,390 ops/sec ±3.68% (81 runs sampled)
* Underscore#render x 6,035 ops/sec ±5.86% (81 runs sampled)
* Handlebars#render x 959 ops/sec ±6.16% (77 runs sampled)
* Mustache#render x 4,899 ops/sec ±6.09% (84 runs sampled)

__Fastest is Underscore#render__

## Update(cache compiled result)

* Vdt.js#update x 14,724 ops/sec ±3.61% (87 runs sampled)
* Lodash#update x 7,734 ops/sec ±2.70% (84 runs sampled)
* Underscore#update x 7,989 ops/sec ±4.52% (89 runs sampled)
* Handlebars#update x 7,200 ops/sec ±2.63% (86 runs sampled)
* Mustache#update x 7,747 ops/sec ±2.40% (96 runs sampled)

__Fastest is Vdt.js#update__