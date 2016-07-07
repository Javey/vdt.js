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
});
