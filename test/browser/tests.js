describe('Template Inherit', function() {
    it('should render parent template correctly', function() {
        var parent = Vdt(document.getElementById('parent').innerHTML),
            $dom = $(parent.render({title: 'parent'})),
            $children = $dom.children();

        $children.length.should.be.eql(4);
        $children.eq(0).hasClass('head').should.be.eql(true);
        $children.eq(0).text().should.be.eql('parent');
        $children.eq(1).text().should.be.eql('parent body');
        $children.eq(2).text().should.be.eql('parent footer');
        $children.eq(3).text().should.be.eql('parent nested footer');
    });

    it('should render child template correctly', function() {
        var child = Vdt(document.getElementById('child').innerHTML),
            $dom = $(child.render()),
            $children = $dom.children();

        $children.length.should.be.eql(6);
        $children.eq(0).hasClass('head').should.be.eql(true);
        $children.eq(0).text().should.be.eql('child title');
        $children.eq(1).text().should.be.eql('child body');
        $children.eq(2).text().should.be.eql('parent footer');
        $children.eq(3).text().should.be.eql('parent nested footer');
        $children.eq(4).text().should.be.eql('child footer');
        $children.eq(5).text().should.be.eql('child nested footer');
    });

    it('should not get data in parent template if not passed', function() {
        var child = Vdt(document.getElementById('child').innerHTML),
            $dom = $(child.render({title: 'child'}));

        $dom.find('.head').text().should.be.eql('child title');
    });

    it('should pass data to parent template correctly', function() {
        var child = Vdt(document.getElementById('pass_arguments').innerHTML),
            $dom = $(child.render({title: 'child'}));

        $dom.find('.head').text().should.be.eql('child');
    });


    it('should render grandson template correctly', function() {
        var grandson = Vdt(document.getElementById('grandson').innerHTML),
            $dom = $(grandson.render()),
            $children = $dom.children();

        $children.length.should.be.eql(8);
        $children.eq(0).text().should.be.eql('grandson title');
        $children.eq(1).text().should.be.eql('grandson body');
        $children.eq(2).text().should.be.eql('parent footer');
        $children.eq(3).text().should.be.eql('parent nested footer');
        $children.eq(4).text().should.be.eql('child footer');
        $children.eq(5).text().should.be.eql('child nested footer');
        $children.eq(6).text().should.be.eql('grandson footer');
        $children.eq(7).hasClass('card').should.be.eql(true);
        $children.eq(7).children().length.should.be.eql(6);
        $children.eq(7).children().eq(0).text().should.be.eql('nested template');
    });

    it('should render directive correctly', function() {
        var vdt = Vdt(document.getElementById('directive').innerHTML),
            $dom = $(vdt.render({data: ['a', 'b', 'c']})),
            $children = $dom.children();
        
        $children.length.should.be.eql(2);
        $children.eq(0).text().should.be.eql('a');
        $children.eq(1).text().should.be.eql('c');
    });

    it('should render object className correctly', function() {
        var vdt = Vdt('<div class={{a: true, "b c": 1}}><div class="{a: 1}"></div></div>'),
            $dom = $(vdt.render());
        $dom.attr('class').should.be.eql('a b c');
        $dom.children().eq(0).attr('class').should.be.eql('{a: 1}');

        vdt = Vdt('var className = {a: true, "b c": 1}; <div class={className}></div>');
        $dom = $(vdt.render());
        $dom.attr('class').should.be.eql('a b c');
        vdt = Vdt('var className = null; <div class={className}></div>');
        $dom = $(vdt.render());
        ($dom.attr('class') === undefined).should.be.true;
        vdt = Vdt('var className = undefined; <div class={className}></div>');
        $dom = $(vdt.render());
        ($dom.attr('class') === undefined).should.be.true;
    });

    it('should render inline style correctly', function() {
        var vdt = Vdt(document.getElementById('inline_style').innerHTML),
            $dom = $(vdt.render({a: 1}));
        $dom.children().each(function() {
            $.trim($(this).attr('style')).should.eql('display: block;');
        });
        vdt.update({a: 2});
        var style1 = $dom.children().eq(0).attr('style'),
            style2 = $dom.children().eq(2).attr('style');
        (style1 === undefined || style1 === '').should.be.true;
        $.trim($dom.children().eq(1).attr('style')).should.eql('display: none;');
        (style2 === undefined || style2 === '').should.be.true;
    });

    it('should render v-model correctly', function() {
        var vdt = Vdt(document.getElementById('v-model').innerHTML),
            $dom = $(vdt.render({
                text: '',
                radioConst: '',
                radioVar: '2',
                variable: '2',
                radioNo: '',
                radioGroup: '2',
                list: ['1', '2', '3']
            }));
        var children = $dom.children();
        console.log(vdt.template.source);

        children[0].value.should.eql('');

        var checked = [false, true, false, false, true, false];
        checked.forEach(function(checked, index) {
            // radio
            children[index + 1].checked.should.eql(checked);
            // checkbox
            children[index + 1 + 6].checked.should.eql(checked);
        });

        $('body').append($dom);
        $dom.children()[0].value = "test";
        var event = new Event('input', {
            'bubbles': true,
            'cancelable': true
        });
        $dom.children()[0].dispatchEvent(event);
        vdt.data.text.should.eql('test');

        children.eq(1).click();
        vdt.data.radioConst.should.eql('1');

        children.eq(3).click();
        vdt.data.radioNo.should.eql(true);

        $dom.children().eq(4).click();
        $dom.children()[4].checked.should.eql(true);
        $dom.children()[5].checked.should.eql(false);
        vdt.data.radioGroup.should.eql('1');

        vdt.update();
        children[4 + 6].checked.should.eql(true);
        children[5 + 6].checked.should.eql(false);
        // $dom.remove();
        window._vdt = vdt;
    });
});
