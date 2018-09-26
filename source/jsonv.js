// Copyright Klaus Ganser <https://kganser.com>
// MIT Licensed, with this copyright and permission notice
// <http://opensource.org/licenses/MIT>

(typeof simpl == 'object' ? simpl.add : function(name, mod) { self[name] = mod(); })('jsonv', function() {
    var dom = function(node, parent, clear) {
      if (clear && parent) while (parent.firstChild) parent.removeChild(parent.firstChild);
      switch (typeof node) {
        case 'object':
          if (!node) return;
          if (Array.isArray(node)) {
            node.forEach(function(node) { dom(node, parent); });
            return parent;
          }
          var tag = Object.keys(node)[0],
              elem = document.createElement(tag);
          if (parent) parent.appendChild(elem);
          node = node[tag];
          dom(typeof node == 'object' && node && !Array.isArray(node) ? function attr(node, parent) {
            Object.keys(node).forEach(function(k) {
              if (k == 'children') return;
              var n = node[k];
              if (typeof parent[k] == 'undefined' || typeof n != 'object' || n == null)
                return parent[k] = n;
              attr(n, parent[k], true);
            });
            return node.children;
          }(node, elem) : node, elem);
          return elem;
        case 'function':
          return dom(node(parent), parent);
        case 'string':
        case 'number':
          node = document.createTextNode(node);
          return parent ? parent.appendChild(node) : node;
      }
    };
    var locate = function(n) {
      return n.parent ? locate(n.parent).concat([Array.isArray(n.siblings) ? n.siblings.indexOf(n) : n.key]) : [];
    };
  
    /** jsonv: function(elem: HTMLElement, data: json, options={}: EditorOptions|EventListener) -> Editor
        
        Constructs a JSON editor in the given element with the given JSON data and options. */
  
    /** EditorOptions: {
          listener: EventListener,
          editor=false: boolean,
          collapsed=false: boolean,
          metadata=false: boolean
        }
        
        If `metadata` is true, objects and arrays in the JSON `data` provided to the constructor, `put` and `insert`
        methods, and `get` event callbacks must be wrapped in an object of the form `{data, remaining, collapsed}`, where
        `remaining` is an optional boolean or number indicating whether or how many child elements exist past those in
        `data` (for the purpose of pagination), and `collapsed` is an optional boolean. */
        
    /** EventListener: function(type: string, path: array, value: json|undefined, callback:undefined|function(error:boolean, data:json)) -> boolean
        
        Events are raised when an action is taken from the jsonv UI. Event `type` can be `get`, `put`, `insert`, `delete`,
        or `toggle`. `path` is an array of string keys and numeric indices representing the path to the target element.
        For `put` and `insert` events, `value` is JSON data; for `get` events, it is the last element key/index currently
        displayed in the parent object/array at `path`, or null if empty. For `toggle`, `value` is true if expanded and
        false if collapsed. The event listener for all events except `toggle` can operate asynchronously by returning true
        and issuing `callback` later. As a special case, returning true on `toggle` expand events where the expanded
        object has no entries currently loaded. */
  
    /** Editor: {
          get: function(path),
          delete: function(path),
          put: function(path, data),
          insert: function(path, data),
          toggle: function(path, expand)
        } */
  
    return function(elem, data, options) {
      if (data === undefined) data = JSON.parse(elem.textContent);
      if (!options) options = {};
      
      var listener = typeof options == 'function' ? options : options.listener,
          model = {}, focus;
      
      elem.classList.add('jsonv');
      if (options.editor) elem.classList.add('jsonv-editable');
      
      var input = function(model, method, key, value) {
        return {span: {className: 'jsonv-input', children: [{pre: [{span: value}, {br: null}]}, {textarea: {
          value: value || '',
          oninput: function() {
            this.previousSibling.firstChild.textContent = this.value;
          },
          onkeydown: function(e) {
            var esc = e.keyCode == 27,
                move = e.keyCode == 9 || e.keyCode == 13, // tab, enter
                colon = e.keyCode == 186 || e.keyCode == 59 && e.shiftKey,
                k = typeof key != 'number' && focus.children[1].lastChild,
                v = k && focus.lastChild.lastChild;
            if (esc || this != k && move && !e.shiftKey) { // cancel/submit
              if (esc) this.value = value || '';
              e.preventDefault();
              this.blur();
            } else if (this == k && this.value && (move || colon)) { // move to value
              e.preventDefault();
              v.focus();
            } else if (this == v && !value && move && e.shiftKey) { // move to key
              e.preventDefault();
              k.focus();
            }
          },
          onfocus: function() {
            focus = this.parentNode.parentNode;
          },
          onblur: function() {
            var parent = focus;
            focus = null;
            setTimeout(function() {
              if (focus == parent) return;
              var k = key == null ? parent.children[1].lastChild.value : key,
                  v = parent.children[typeof key == 'number' ? 1 : 2].lastChild.value || value;
              if (value === undefined) parent.parentNode.removeChild(parent);
              if (k != null && v) {
                var data = v;
                try { data = JSON.parse(data); } catch (e) {}
                if (value != v && listener) listener(method, locate(model).concat([k]), data);
                model[method]([k], options.metadata ? function inflate(v) {
                  return !v || typeof v != 'object' ? v : {data: Array.isArray(v) ? v.map(inflate)
                    : Object.keys(v).reduce(function(a, b) { a[b] = inflate(v[b]); return a; }, {})};
                }(data) : data);
              }
            });
          }
        }}]}};
      };
      
      // TODO: error reporting
      dom(function render(data, self) {
        return function(parent) {
          var keys, values, last, elem, list, next;
  
          var item = function(key, value) {
            var model = values[key] = {parent: self, key: key, siblings: values};
            return {li: [
              {button: {className: 'jsonv-delete', children: '×', onclick: function() {
                var path = locate(model);
                if (listener) listener('delete', path, undefined, function() {});
                self.delete(path.slice(-1));
              }}},
              keys && [{span: {className: 'jsonv-key', children: key}}, ': '],
              render(value, model),
              !keys && {button: {className: 'jsonv-add', children: '+', onclick: function() {
                var item = this.parentNode;
                item.parentNode.insertBefore(dom({li: [
                  {button: {className: 'jsonv-delete', children: '×'}},
                  input(self, 'insert', values.indexOf(model)+1)
                ]}), item.nextSibling).children[1].lastChild.focus();
              }}}
            ]};
          };
          var entry = function(value) {
            keys = values = last = list = undefined;
            var type = typeof value,
                name = type;
            if (type == 'object') {
              var meta = options.metadata && value,
                  collapsed = meta && meta.collapsed;
              if (meta && typeof meta.data == 'object') {
                var count = meta.remaining || null;
                if (count) count = count === true ? 'more' : count+' more';
                value = meta.data;
              }
              type = name = Array.isArray(value) ? 'array' : value ? type : 'null';
              if (type != 'null') {
                if (options.collapsed || collapsed) name += ' closed';
                if (type == 'object') {
                  keys = Object.keys(value).sort();
                  last = keys[keys.length-1];
                }
                values = type == 'array' ? [] : {};
              }
            }
            return {span: {className: 'jsonv-'+name, children: function(e) {
              elem = e;
              if (!values && options.editor) e.onclick = function() {
                var current = value;
                try { JSON.parse(current); current = JSON.stringify(value); } catch (e) {}
                var key = Array.isArray(self.siblings) ? self.siblings.indexOf(self) : self.key,
                    field = dom(input(self.parent, 'put', key, current));
                this.parentNode.replaceChild(field, this);
                field.lastChild.focus();
                field.lastChild.select();
              };
              return values ? [
                {span: {className: 'jsonv-toggle', onclick: function() {
                  var expand = self.toggle();
                  if (listener && listener('toggle', locate(self), expand) && !Object.keys(values).length && count) next();
                }}},
                {button: {className: 'jsonv-add', children: '+', onclick: function() {
                  list.insertBefore(dom({li: [
                    {button: {className: 'jsonv-delete', children: '×'}},
                    keys ? [input(self, 'put'), ': ', input(self, 'put')] : input(self, 'insert', 0)
                  ]}), list.firstChild).children[1].lastChild.focus();
                }}},
                keys ? {ul: function(e) { list = e; return keys.map(function(key) { return item(key, value[key]); }); }}
                     : {ol: function(e) { list = e; return value.map(function(value, i) { return item(i, value); }); }},
                count && {div: {className: 'jsonv-next', children: {button: {children: function(e) {
                  next = function() {
                    e.disabled = true;
                    e.textContent = 'loading…';
                    listener('get', locate(self), keys ? last : values.length ? values.length-1 : null, function(error, value) {
                      e.disabled = false;
                      if (error) e.textContent = count;
                      var data = value && value.data;
                      if (!data || typeof data != 'object' || !keys && !Array.isArray(data)) return;
                      if (count = value.remaining) count = count === true ? 'more' : count+' more';
                      if (keys) Object.keys(data).forEach(function(key) {
                        if (key > last || last == null) last = key;
                        self.put([key], data[key]);
                      });
                      else data.forEach(function(item) { self.put([values.length], item); });
                      if (count) e.textContent = count;
                      else e.parentNode.parentNode.removeChild(e.parentNode);
                    });
                  };
                  if (listener) e.onclick = next;
                  return count;
                }}}}}
              ] : String(value);
            }}};
          };
          
          self.get = function(path) {
            return path && path.length
              ? values && values[path[0]].get(path.slice(1))
              : keys
                ? keys.reduce(function(obj, key) { obj[key] = values[key].get(); return obj; }, {})
                : values ? values.map(function(model) { return model.get(); }) : data;
          };
          self.delete = function(path) {
            if (!path || !path.length) {
              dom(null, parent, true);
              return keys = values = last = list = undefined;
            }
            var key = path[0];
            if (typeof key != (keys ? 'string' : 'number')) return;
            var child = values && values[key];
            if (!child) return;
            if (path.length > 1)
              return child.delete(path.slice(1));
            var i = keys ? keys.indexOf(key) : key;
            if (i < 0) return;
            (keys || values).splice(i, 1);
            if (keys) delete values[key];
            list.removeChild(list.children[i]);
          };
          self.put = function(path, value) {
            if (!path || !path.length) {
              dom(entry(value), parent, true);
            } else {
              var key = path[0];
              if (typeof key != (keys ? 'string' : 'number')) return;
              if (!keys) key = Math.max(0, Math.min(values ? values.length : 0, key));
              var child = values && values[key];
              if (path.length > 1)
                return child && child.put(path.slice(1), value);
              var i = keys ? keys.indexOf(key) : key;
              if (child) {
                list.replaceChild(dom(item(key, value)), list.children[i]);
              } else {
                if (keys) {
                  while (++i < keys.length && key > keys[i]);
                  keys.splice(i, 0, key);
                }
                list.insertBefore(dom(item(key, value)), list.children[i]);
              }
            }
          };
          self.insert = function(path, value) {
            if (!path || !path.length) return;
            var key = path[0];
            if (path.length == 1 && typeof key != 'number') return self.put(path, value);
            if (typeof key != (keys ? 'string' : 'number')) return;
            if (!keys) key = Math.max(0, Math.min(values ? values.length : 0, key));
            var child = values && values[key];
            if (path.length > 1)
              return child && child.insert(path.slice(1), value);
            if (child) {
              values.splice(key, 0, null);
              list.insertBefore(dom(item(key, value)), list.children[key]);
            } else {
              list.appendChild(dom(item(key, value)));
            }
          };
          self.toggle = function(path, expand) {
            if (!path || !path.length) return !elem.classList.toggle('closed', expand == null ? undefined : !expand);
            var value = values && values[path[0]];
            if (value) return value.toggle(path.slice(1), expand);
          };
          
          return entry(data);
        };
      }(data, model), elem, true);
      
      return model;
    };
  });