(function() {
  var map = {};
  var deps = {};
  var exports = {};

  var counter = 0;
  function define(name) {
    name = name || 'unamed-' + (++counter);
    if (map[name]) {
      throw new Error('Duplicate module: ' + name);
    }
    var mod = map[name] = {
      deps: 0,
      func: null,
      check: function() {
        if (this.deps > 0) {
          return;
        }
        if (this.func) {
          exports[name] = this.func(exports);
        }
        if (deps[name]) {
          deps[name].forEach(function(up) {
            map[up].deps--;
            map[up].check();
          });
        }
      },
    };
    return function() {
      for (var i = 0; i < arguments.length; i++) {
        var item = arguments[i];
        if (typeof item === 'function') {
          mod.func = item;
          break;
        } else if (!map[item] || map[item].deps) {
          mod.deps++;
          if (!deps[item]) {
            deps[item] = [];
            var scr = document.createElement('script');
            scr.src = item + '.js';
            console.info('load ' + item);
            document.head.appendChild(scr);
          }
          deps[item].push(name);
        }
      }
      mod.check();
    };
  }
  window.define = define;
})();
