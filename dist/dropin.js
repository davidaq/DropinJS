(function(factory, utilsFactory) {
  window.Dropin = factory(utilsFactory());
})(function(utils) {
  const defaultCtx = {
    modPath: '<temporary scope>',
    dir: '',
  };
  const modCache = {};
  const modDeclare = {};
  const modUri = {};
  const loadedScript = {};
  function Dropin(func, ctx = defaultCtx) {
    return co(func(createRequire(ctx), utils));
  }
  function co(proc, err, result) {
    if (!proc || typeof proc.next !== 'function') {
      return Promise.reject(new Error('Dropin modules must be a generator function'));
    }
    var step = err ? proc.throw(err) : proc.next(result);
    if (!step.done) {
      var isObj = step.value && typeof step.value === 'object';
      if (isObj && typeof step.value.then === 'function') {
        return step.value.then(res => {
          return im(this, co, proc, null, res);
        }, err => {
          return im(this, co, proc, err, null);
        });
      } else {
        if (isObj && typeof step.value.next === 'function') {
          console.warn('Detected yielding an object with next(), maybe meant to be yield*');
        }
        return im(this, co, proc, null, step.value);
      }
    }
    return Promise.resolve(step.value);
  }
  function createRequire(ctx) {
    function require(modPath) {
      modPath = require.resolve(modPath);
      if (!modCache[modPath]) {
        const timeOut = Dropin.debug ? setTimeout(() => {
          const extra = /^dropin_modules\//.test(modPath)
            ? 'Maybe you need to install it.'
            : 'Check if the file exists.';
          console.warn(`Load timeout for "${modPath}" used in ${ctx.modPath}. ${extra}`);
        }, 2000) : false;
        modCache[modPath] = waitForMod(modPath).then(function(func) {
          const dir = modPath.split('/');
          dir.pop();
          timeOut && clearTimeout(timeOut);
          return Dropin(func, Object.assign({}, ctx, {
            modPath,
            dir: dir.join('/'),
          }));
        });
      }
      return modCache[modPath].then(ret => {
        if (typeof ret === 'function' && ret[utils.FactoryLabel]) {
          return ret();
        }
        return ret;
      });
    }
    require.resolve = function(modPath) {
      if (/^[\-a-zA-Z0-9]+$/.test(modPath)) {
        if (Dropin.debug) {
          return `dropin_modules/${modPath}`;
        } else {
          return `dropin_modules/${modPath}.min`;
        }
      } else if (/^\//.test(modPath)) {
        return modPath.substr(1);
      } else {
        const path = (ctx.dir + '/' + modPath).split('/');
        const prefix = [];
        const resolved = [];
        let w = 0;
        path.forEach(item => {
          if (!item || item === '.') {
          } else if (item === '..') {
            w--;
            if (w < 0) {
              w = 0;
              prefix.push('..');
            }
          } else {
            resolved[w++] = item;
          }
        });
        return prefix.concat(resolved).join('/');
      }
    };
    require.cache = modCache;
    return require;
  }
  Dropin.base = '';
  Dropin.libBase = '';
  function waitForMod(modPath) {
    if (!modDeclare[modPath]) {
      const url = modUri[modPath] || modPath + '.js';
      if (loadedScript[url]) {
      } else {
        loadedScript[url] = Date.now();
        const ele = document.createElement('script');
        ele.type = 'text/javascript';
        ele.src = /^dropin_modules\//.test(modPath)
            ? (Dropin.libBase || Dropin.base) + url
            : Dropin.base + url;
        document.getElementsByTagName('head')[0].appendChild(ele);
      }
      modDeclare[modPath] = {};
      modDeclare[modPath].promise = new Promise((resolve, reject) => {
        modDeclare[modPath].resolve = resolve;
      });
    }
    return modDeclare[modPath].promise;
  }
  function im(self, func, ...args) {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        resolve(func.call(self, ...args));
      });
    });
  }

  function createInternalRequire(mods, deps) {
    return function(requireName) {
      const mod = mods[deps[requireName]];
      if (mod) {
        if (!mod.cache) {
          mod.cache = { exports: {} };
          mod.define(createInternalRequire(mods, mod.deps), mod.cache, mod.cache.exports);
        }
        return mod.cache.exports;
      } else {
        throw new Error(`Unable to require ${requireName}`);
      }
    };
  }
  Dropin.createInternalRequire = createInternalRequire;
  function declare(modName, func) {
    if (typeof modName === 'function' && arguments.length === 1) {
      func = modName;
      try {
        let src = document.currentScript.attributes.src.value;
        if (src.substr(0, Dropin.base.length) === Dropin.base) {
          src = src.substr(Dropin.base.length).replace(/\.js$/i, '');
          modName = src;
        } else {
          throw new Error('Module not within project scope');
        }
      } catch(err) {
        console.error(err);
        console.warn('Unable to auto resolve module name, please declare module name explicitly');
        return;
      }
    }
    if (modDeclare[modName]) {
      if (modDeclare[modName].resolve) {
        modDeclare[modName].resolve(func);
        delete modDeclare[modName].resolve;
      } else {
        console.warn(`Trying to redeclare ${modName}`);
      }
    } else {
      modDeclare[modName] = {
        promise: Promise.resolve(func),
      };
    }
  }
  Dropin.declare = declare;

  function package(uri, mods) {
    if (Array.isArray(mods)) {
      mods.forEach(mod => modUri[mod] = uri);
    } else if (mods) {
      modUri[mods] = uri;
    }
  }
  Dropin.package = package;
  return Dropin;
}, function() {
  const utils = {
  };
  utils.FactoryLabel = Symbol('DropinFactory');
  utils.factory = function(func) {
    if (typeof func === 'function') {
      func[utils.FactoryLabel] = true;
    }
    return func;
  };
  utils.useStyle = function(css) {
    const ele = document.createElement('style');
    ele.type = 'text/css';
    ele.textContent = css;
    document.getElementsByTagName('head')[0].appendChild(ele);
  };
  return utils;
});
