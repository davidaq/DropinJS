/**
 * DropinJS v1.0.2
 *
 * Embrace ES6 and and develope web pages the easy way just as the old times.
 *
 * CAVEAT: This library take absolutely no effort on supporting lagacy browsers.
 *         Browser without full ES6 support will not work properly.
 *
 */
(defs => {
  const M = {}, cache = {};
  Object.keys(defs).forEach(key => {
    const get = () => {
      if (!cache[key]) {
        cache[key] = { mod: defs[key](M) };
      }
      return cache[key].mod;
    };
    Object.defineProperty(M, key, { get });
  });
  window.Dropin = M.Dropin;
})({

  /**
   * The main library entry
   */
  Dropin(M) {
    const co = M.co;
    const requireFactory = M.requireFactory;
    const moduleUtils = M.moduleUtils;

    const defaultCtx = {
      modPath: '<temporary scope>',
      dir: '',
    };
    const Dropin = (func, ctx = defaultCtx) => {
      const proc = func(requireFactory(ctx), moduleUtils);
      if (!proc || typeof proc.next !== 'function') {
        throw new Error('Dropin modules must be a generator function');
      }
      return co(proc);
    };
    const currentScript = document.currentScript;
    const debugAttr = currentScript.getAttribute('debug');
    Dropin.debug = ['false', 'no', '0', 0, null].indexOf(debugAttr) === -1;
    Dropin.base = '';
    Dropin.libBase = '';
    Dropin.createInternalRequire = M.createInternalRequire;
    Dropin.declare = M.declare;
    Dropin.package = M.package;
    Dropin.getLoadedModules = M.getLoadedModules;
    return Dropin;
  },

  /**
   * Some global states or constants used in multiple modules
   */
  globals() {
    return {
      modCache: {},
      modDeclare: {},
      modUri: {},
      loadedScript: {},
      FactoryLabel: Symbol('Factory Module'),
    };
  },

  /**
   * Factory for creating require functions used 
   */
  requireFactory(M) {
    const { modCache, loadedScript, modUri, modDeclare, FactoryLabel } = M.globals;

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

    return (ctx) => {
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
          if (typeof ret === 'function' && ret[FactoryLabel]) {
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
    };
  },

  /**
   * Define a module, annonymous modules will be auto named using its file name
   */
  declare(M) {
    const { modDeclare } = M.globals;
    return (modName, func) => {
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
    };
  },

  /**
   * Define packages
   */
  package(M) {
    const { modUri } = M.globals;
    return (uri, mods) => {
      if (Array.isArray(mods)) {
        mods.forEach(mod => modUri[mod] = uri);
      } else if (mods) {
        modUri[mods] = uri;
      }
    };
  },

  /**
   * Create require function for installed dependency modules
   */
  createInternalRequire(M) {
    const createRequire = (mods, deps) => (requireName) => {
      const mod = mods[deps[requireName]];
      if (mod) {
        if (!mod.cache) {
          mod.cache = { exports: {} };
          mod.define(createRequire(mods, mod.deps), mod.cache, mod.cache.exports);
        }
        return mod.cache.exports;
      } else {
        throw new Error(`Unable to require ${requireName}`);
      }
    };
    return createRequire;
  },

  /**
   * Utililty functions passed to modules
   */
  moduleUtils(M) {
    const { FactoryLabel } = M.globals;
    return {
      factory(func) {
        if (typeof func === 'function') {
          func[FactoryLabel] = true;
        }
        return func;
      },
      useStyle(css) {
        const ele = document.createElement('style');
        ele.type = 'text/css';
        ele.textContent = css;
        document.getElementsByTagName('head')[0].appendChild(ele);
      },
    };
  },

  getLoadedModules(M) {
    const { modDeclare } = M.globals;
    return () => Object.keys(modDeclare);
  },

  /**
   * A simple implementation of co.js resolving promises in a synchronous fation
   */
  co(M) {
    const im = (func, ...args) => {
      return new Promise(resolve => {
        requestAnimationFrame(() => resolve(func(...args)));
      });
    };
    const co = (proc, err, result) => {
      var step = err ? proc.throw(err) : proc.next(result);
      if (!step.done) {
        var isObj = step.value && typeof step.value === 'object';
        if (isObj && typeof step.value.then === 'function') {
          return step.value.then(
            res => im(co, proc, null, res),
            err => im(co, proc, err, null)
          );
        } else {
          return im(co, proc, null, step.value);
        }
      }
      return Promise.resolve(step.value);
    };
    return co;
  },

});