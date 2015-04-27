var Benchmark = require('benchmark'),
    Vdt = require('../src/vdt'),
    _ = require('lodash');

var suite = new Benchmark.Suite;

suite
    .add('vdt.js', function() {
        var template = "<div>{name}</div>";
        template = Vdt(template);
        template.render({name: 'name'});
    })
    .add('lodash', function() {
        var template = "<div><%= name %></div>";
        template = _.template(template);
        template({name: 'name'});
    })
    .on('cycle', function(event) {
        console.log(String(event.target))
    })
    .on('complete', function() {
        console.log('Fastest is ' + this.filter('fastest').pluck('name'));
    })
    .run({async: true});