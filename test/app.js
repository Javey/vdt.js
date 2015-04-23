(function($, Vdt) {
    'use strict';

    var Model = {
        list: [
            {title: 'test', completed: false}
        ],

        create: function(title) {
            this.list.push({
                title: title,
                completed: false
            });
            this.trigger('change');
        },

        remove: function(index) {
            this.list.splice(index, 1);
            this.trigger('change');
        },

        update: function(key, value, index) {
            if (index != null) {
                this.list[index][key] = value;
            } else {
                this.list.forEach(function(item) {
                    item[key] = value;
                });
            }
            this.trigger('change');
        },

        _events: {},

        on: function(event, callback) {
            this._events[event] || (this._events[event] = []);
            this._events[event].push(callback);
        },

        trigger: function(event) {
            var events;
            if (events = this._events[event]) {
                events.forEach(function(callback) {
                    callback();
                });
            }
        }
    };

    var View = {
        init: function() {
            var $template = $('#todo_template');
            this.template = Vdt($template.html());
            this.$dom = $(this.template(Model));
            $template.after(this.$dom);

            this._bindEvent();
        },

        _bindEvent: function() {
            this.$dom
                .on('change', '.new-todo', this._add.bind(this))
                .on('click', '.destroy', this._destroy.bind(this))
                .on('click', '.toggle-all', this._toggleAll.bind(this))
                .on('click', '.toggle', this._toggle.bind(this));

            Model.on('change', this._update.bind(this));
        },

        _destroy: function(e) {
            var index = $(e.target).closest('li')[0].index;
            Model.remove(index);
        },

        _update: function() {
            this.template.update(Model);
        },

        _add: function(e) {
            var $input = $(e.target),
                value = $input.val();
            $input.val('');
            Model.create(value);
        },

        _toggleAll: function(e) {
            Model.update('completed', $(e.target).prop('checked'));
        },

        _toggle: function(e) {
            var $target = $(e.target),
                index = $target.closest('li')[0].index;
            Model.update('completed', $target.prop('checked'), index);
        }
    };

    View.init();

})(jQuery, Vdt);