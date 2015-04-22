var templateDom = document.getElementById('todo_template'),
    templateStr = templateDom.innerHTML,
    templateFn = Vdt(templateStr);

var list = [{title: 'test', completed: false}];

var dom = templateFn({list: list});
templateDom.parentNode.insertBefore(dom, templateDom);

var input = document.querySelector('.new-todo');
input.addEventListener('change', function(e) {
    list.push({
        title: e.target.value,
        completed: false
    });
    e.target.value = '';
    update();
});

dom.addEventListener('click', function(e) {
    if (e.target.className === 'destroy') {
        var index = e.target.parentNode.parentNode.index;
        list.splice(index, 1);
        update();
    }
});

document.querySelector('.toggle-all').addEventListener('click', function(e) {
    list.forEach(function(item) {
        item.completed = e.target.checked;
    });
    update();
});

dom.addEventListener('click', function(e) {
    if (e.target.className === 'toggle') {
        var index = e.target.parentNode.parentNode.index;
        list[index].completed = e.target.checked;
        update();
    }
});

function update() {
    templateFn.update({list: list});
}