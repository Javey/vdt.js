var resultTemplate = $('#template').html(),
    $body = $('body'),
    vdtTemplate = "\
        <div>\
            <ul>\
                {lists.map(function(item) {\
                    return <li>{item}</li>\
                })}\
            </ul>\
            <div className='test'>{test}</div> \
        </div>",
    lodashTemplate = "\
        <div>\
            <ul>\
                <% _.each(lists, function(item) { %>\
                    <li><%= item %></li>\
                <% }) %>\
            </ul>\
            <div class='test'><%= test %></div> \
        </div>";

var options = {
    onStart: function() {
        this.Model = {
            results: [],
            fastest: '',
            error: null
        };
        this.vdt = Vdt(resultTemplate);
        $body.append(this.vdt.render(this.Model));
    },
    onCycle: function(e) {
        var info = String(e.target);
        this.Model.results.push(info);
        console.log(info);
        this.vdt.update(this.Model);
    },
    onError: function(e) {
        console.log(e.target.error);
        this.Model.error = e.target.error.message;
        this.vdt.update(this.Model);
    },
    onComplete: function(e) {
        this.Model.fastest = 'Fastest is ' + this.filter('fastest').pluck('name');
        console.log(this.Model.fastest);
        this.vdt.update(this.Model);
    }
};

var renderSuite = new Benchmark.Suite('render', options);
renderSuite
    .add('Vdt.js#render', function() {
        var template = Vdt(vdtTemplate);
        var $dom = $(template.render({
            lists: ['vdt.js', 'lodash', 'underscore', 'benchmark'],
            test: 'vdt.js'
        }));
        $body.append($dom);
        $dom.remove();
    })
    .add('Lodash#render', function() {
        var template = _.template(lodashTemplate);
        var $dom = $(template({
            lists: ['vdt.js', 'lodash', 'underscore', 'benchmark'],
            test: 'vdt.js'
        }));
        $body.append($dom);
        $dom.remove();
    })
    .run({async: true});

var updateSuite = new Benchmark.Suite('update', _.extend({}, options, {
    onStart: function() {
        options.onStart.call(this);

        this.testVdt = Vdt(vdtTemplate);
        this.testModel = {
            lists: ['vdt.js', 'lodash', 'underscore', 'benchmark'],
            test: 'vdt.js'
        };
        var $dom = this.testVdtDom = $(this.testVdt.render(this.testModel));
        $body.append($dom);

        this.testTemplate = _.template(lodashTemplate);
        var $testDom = this.testLodashDom = $(this.testTemplate(this.testModel));
        $body.append($testDom);
    },

    onComplete: function(e) {
        options.onComplete.call(this, e);
        this.testVdtDom.remove();
        this.testLodashDom.remove();
    }
}));
updateSuite
    .add('Vdt.js#update', function() {
        random(updateSuite.testModel);
        updateSuite.testVdt.update(updateSuite.testModel);
    })
    .add('Lodash#update', function() {
        random(updateSuite.testModel);
        updateSuite.testLodashDom.remove();
        var $testDom = updateSuite.testLodashDom = $(updateSuite.testTemplate(updateSuite.testModel));
        $body.append($testDom);
    })
    .run({async: true});

function random(data) {
    data.lists.sort(function() {
        return Math.random() > 0.5;
    })
}