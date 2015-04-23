(function($, Vdt) {
    'use strict';

    var ENTER_KEY = 13,
        ESCAPE_KEY = 27;

    var Model = {
        list: [
            {title: 'test', completed: false}
        ],

        filterType: 'all',

        editingIndex: -1,

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

        set: function(key, value) {
            this[key] = value;
            this.trigger('change');
        },

        filter: function(item) {
            switch (this.filterType) {
                case 'active':
                    return !item.completed;
                case 'completed':
                    return item.completed;
                default:
                    return true;
            }
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
            this.vdt = Vdt($template.html());

            this._setFilterType();

            this.$el = $(this.vdt(Model));
            $template.after(this.$el);

            this._bindEvent();
        },

        _bindEvent: function() {
            this.$el
                .on('change', '.new-todo', this._add.bind(this))
                .on('click', '.destroy', this._destroy.bind(this))
                .on('click', '.toggle-all', this._toggleAll.bind(this))
                .on('click', '.toggle', this._toggle.bind(this))
                .on('click', '.clear-completed', this._clearCompleted.bind(this))
                .on('dblclick', '.todo-list label', this._edit.bind(this))
                .on('keyup', '.edit', this._editKeyup.bind(this))
                .on('blur', '.edit', this._editDone.bind(this));

            $(window).on('hashchange', this._setFilterType.bind(this));

            Model.on('change', this._update.bind(this));
        },

        _destroy: function(e) {
            Model.remove(this._index($(e.target)));
        },

        _update: function() {
            this.vdt.update(Model);
        },

        _add: function(e) {
            var $input = $(e.target),
                value = $input.val().trim();

            if (value) {
                Model.create(value);
            }
            $input.val('');
        },

        _toggleAll: function(e) {
            Model.update('completed', $(e.target).prop('checked'));
        },

        _toggle: function(e) {
            var $target = $(e.target);

            Model.update('completed', $target.prop('checked'), this._index($target));
        },

        _setFilterType: function() {
            var hash = location.hash.substring(2);
            if (!~['all', 'active', 'completed'].indexOf(hash)) {
                hash = 'all'
            }
            Model.set('filterType', hash);
        },

        _clearCompleted: function() {
            var list = Model.list.filter(function(item) {
                return !item.completed;
            });
            Model.set('list', list);
        },

        _edit: function(e) {
            var $target= $(e.target);

            Model.set('editingIndex', this._index($target));
            $target.closest('li').find('.edit').focus();
        },

        _editKeyup: function(e) {
            var $target = $(e.target);

            if (e.which === ENTER_KEY) {
                $target.blur();
            } else if (e.which === ESCAPE_KEY) {
                $target.val(Model.list[this._index($target)].title);
                $target.blur();
            }
        },

        _editDone: function(e) {
            var $target = $(e.target),
                value = $target.val().trim();

            if (value) {
                Model.update('title', value, this._index($target));
            }
            Model.set('editingIndex', -1);
        },

        _index: function($target) {
            return $target.closest('li')[0].index
        }
    };

    View.init();

})(jQuery, Vdt);