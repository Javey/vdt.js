var virtualDom = require('virtual-domx'),
    Vdt = require('../src/lib/vdt'),
    Inferno = require('inferno'),
    Benchmark = require('benchmark');

var arr = new Array(10);

function virtualDomRender() {
    var h = virtualDom.h;
    return h('ul', {className: 'test'}, Vdt.utils.map(arr, function(item) {
        return h('li', {className: 'li'}, null);
    }));
}

var vdtRender = (function() {
    var html = '<ul class="test"><li v-for={scope.arr} class="li"></li></ul>';
    var vdtRender = Vdt.compile(html, {noWith: true});
    return vdtRender;
});

function infernoRender() {
    var h = Inferno.createVNode;
    return h(2, 'ul', 'test', Vdt.utils.map(arr, function(item) {
        return h(2, 'li', 'li');
    }));
}

var suite = new Benchmark.Suite({
    onStart: function() {
    },
    onError: function(e) {
        console.log(e.target.error);
    }
});

suite
    .add('virtual-dom', function() {
        // virtualDomRender();
        if (100 & 100) {}
    })
    .add('vdt', function() {
        // vdtRender({arr: arr}, Vdt);
        if ('virtualDom' === 'virtualDom') {}
    })
    // .add('inferno', function() {
        // infernoRender();
    // })
    .on('cycle', function(event) {
        console.log(String(event.target));
    })
    .on('complete', function() {
        console.log('Fastest is ' + this.filter('fastest').pluck('name'));
    })
    .run({async: true});

// console.log(virtualDomRender());
// console.log(infernoRender());
