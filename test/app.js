var templateDom = document.getElementById('todo_template')
    templateStr = templateDom.innerHTML,
    templateFn = Vdt(templateStr);

var list = [
    {
        title: 'aaa',
        value: '111',
        completed: true
    },
    {
        title: 'bbb',
        value: '222',
        completed: false
    }
];

templateDom.parentNode.insertAfter(templateFn({list: list}), templateDom);