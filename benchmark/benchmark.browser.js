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
                <% lodash.each(lists, function(item) { %>\
                    <li><%= item %></li>\
                <% }) %>\
            </ul>\
            <div class='test'><%= test %></div> \
        </div>",
    underscoreTemplate = "\
        <div>\
            <ul>\
                <% underscore.each(lists, function(item) { %>\
                    <li><%= item %></li>\
                <% }) %>\
            </ul>\
            <div class='test'><%= test %></div> \
        </div>",
    hbTemplate = "\
        <div>\
            <ul>\
                {{#lists}}\
                    <li>{{this}}</li>\
                {{/lists}}\
            </ul>\
            <div class='test'>{{test}}</div>\
        </div>",
    muTemplate = "\
        <div>\
            <ul>\
                {{#lists}}\
                    <li>{{.}}</li>\
                {{/lists}}\
            </ul>\
            <div class='test'>{{test}}</div>\
        </div>",
    testData = {
        lists: ['vdt.js', 'lodash', 'underscore', 'benchmark'],
        test: 'vdt.js'
    };

var options = {
    onStart: function(e) {
        this.Model = {
            title: this.name,
            results: this.pluck('name'),
            fastest: '',
            error: null
        };
        this.vdt = Vdt(resultTemplate);
        $body.append(this.vdt.render(this.Model));
    },
    onCycle: function(e) {
        var info = String(e.target),
            name = e.target.name;
        this.Model.results[this.Model.results.indexOf(name)] = info;
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

var renderSuite = new Benchmark.Suite('Render(compile every time)', options);
renderSuite
    .add('Vdt.js#render', function() {
        var template = Vdt(vdtTemplate);
        var $dom = $(template.render(testData));
        $body.append($dom);
        $dom.remove();
    })
    .add('Lodash#render', function() {
        var template = lodash.template(lodashTemplate);
        var $dom = $(template(testData));
        $body.append($dom);
        $dom.remove();
    })
    .add('Underscore#render', function() {
        var template = underscore.template(lodashTemplate);
        var $dom = $(template(testData));
        $body.append($dom);
        $dom.remove();
    })
    .add('Handlebars#render', function() {
        var template = Handlebars.compile(hbTemplate);
        var $dom = $(template(testData));
        $body.append($dom);
        $dom.remove();
    })
    .add('Mustache#render', function() {
        Mustache.clearCache();
        Mustache.parse(muTemplate);
        var $dom = $(Mustache.render(muTemplate, testData));
        $body.append($dom);
        $dom.remove();
    })
    .run({async: true});

var updateSuite = new Benchmark.Suite('Update(cache compiled result)', lodash.extend({}, options, {
    onStart: function(e) {
        options.onStart.call(this, e);

        this.testVdt = Vdt(vdtTemplate);
        this.testModel = lodash.extend({}, testData);
        this.testDom = $('<div/>').append($(this.testVdt.render(this.testModel)));
        $body.append(this.testDom);

        this.testTemplate = lodash.template(lodashTemplate);

        this.testUSTemplate = underscore.template(underscoreTemplate);

        this.testHB = Handlebars.compile(hbTemplate);

        this.testMU = Mustache.parse(muTemplate);
    },

    onComplete: function(e) {
        options.onComplete.call(this, e);
        this.testDom.remove();
    }
}));
updateSuite
    .add('Vdt.js#update', function() {
        random(updateSuite.testModel);
        updateSuite.testVdt.update(updateSuite.testModel);
    })
    .add('Lodash#update', function() {
        random(updateSuite.testModel);
        updateSuite.testDom.empty();
        updateSuite.testDom.append($(updateSuite.testTemplate(updateSuite.testModel)));
    })
    .add('Underscore#update', function() {
        random(updateSuite.testModel);
        updateSuite.testDom.empty();
        updateSuite.testDom.append($(updateSuite.testUSTemplate(updateSuite.testModel)));
    })
    .add('Handlebars#update', function() {
        random(updateSuite.testModel);
        updateSuite.testDom.empty();
        updateSuite.testDom.append($(updateSuite.testHB(updateSuite.testModel)));
    })
    .add('Mustache#update', function() {
        random(updateSuite.testModel);
        updateSuite.testDom.empty();
        updateSuite.testDom.append($(Mustache.render(muTemplate, updateSuite.testModel)));
    })
    .run({async: true});

function random(data) {
    data.lists.sort(function() {
        return Math.random() > 0.5;
    })
}