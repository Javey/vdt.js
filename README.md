# Vdt.js

一个基于虚拟DOM的模板引擎，详情请访问：[Documents](http://javey.github.io/vdt.html)

[![npm version](https://badge.fury.io/js/vdt.svg)](https://badge.fury.io/js/vdt)
[![Build Status](https://travis-ci.org/Javey/vdt.js.svg?branch=master)](https://travis-ci.org/Javey/vdt.js)

# 功能特性

* 基于虚拟DOM，更新速度快
* 支持模板继承，包含，宏定义等功能
* 文件大小在gzip压缩后大概13KB（包含浏览器实时编译模块）
* 支持前后端渲染

# 安装

```shell
npm install vdt --save
```

# 例子

```jsx
<div>
    <h1>{title}</h1>
    <div ev-click={onClick.bind(self)}>Clicked: {count}</div>
    <ul v-for={items}>
        <li>{key}: {value}</li>
    </ul>
</div>
```

```js
var vdt = Vdt(template);
var dom = vdt.render({
    title: 'vdt',
    items: {
        a: 1,
        b: 2
    },
    count: 0,

    onClick: function() {
        this.count++;
        vdt.update();
    }
});

document.body.appendChild(dom);
```

# 相关库

1. [misstime](https://github.com/Javey/misstime) vdt基于的virtual dom库
2. [Intact](http://javey.github.io/intact/) 基于vdt的mvvm框架
3. [vdt-loader](https://github.com/Javey/vdt-loader) vdt模板文件的webpack loader

# 基准测试 

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

# 许可

MIT
