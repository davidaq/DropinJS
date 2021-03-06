const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const rimraf = require('rimraf');
const acorn = require('acorn');
const acornWalk = require('acorn/dist/walk');
const escodegen = require('escodegen');
const concat = require('concat-stream');
const cheerio = require('cheerio');
const http = require('http');
const https = require('https');
const bResolve = require('browser-resolve');

const argv = require('yargs').argv;
const mods = argv._.slice(1);

const tmpDir = path.join(os.tmpDir(), `dropin_install_${Math.floor(Date.now() / 1000) % 60}`);

const otherArgs = [];
if (argv.cn) {
  argv.registry = 'http://registry.npm.taobao.org';
}
if (argv.registry) {
  otherArgs.push(`--registry=${JSON.stringify(argv.registry)}`);
}
const useBootCdn = argv.boot;

prepareTmpDir().then(() => {
  return promiseEach(mods, install);
}).then(installed => {
  return promiseEach(installed, createFile);
}).then(() => {
  rimraf(tmpDir, function() {
    console.log('Done');
  });
});

function promiseEach(array, task) {
  var result = [];
  return array.reduce((promise, item) => {
    return promise.then(() => task(item).then(res => result.push(res)));
  }, Promise.resolve()).then(() => result);
}

function prepareTmpDir() {
  return new Promise(resolve => {
    rimraf(tmpDir, () => {
      fs.mkdir(tmpDir, (err) => {
        if (err && err.code !== 'EEXIST') {
          console.error('Unable to create temporary directory');
        } else {
          fs.readFile(path.join(__dirname, '..', 'package.json'), (err, content) => {
            if (err) {
              console.error('Broken DropinJS installation');
            } else {
              fs.writeFile(path.join(tmpDir, 'package.json'), content, err => {
                if (err) {
                  console.error('Unable to create temporary file');
                } else {
                  resolve();
                }
              });
            }
          });
        }
      });
    });
  }) 
}

function install(modName) {
  return new Promise(resolve => {
    let uri;
    let pathname;
    let libName;
    let protocol;
    let isPrebuilt = false;
    const match = modName.match(/^([a-zA-Z0-9\-_]+)\:((https?|npm|file)\:\/\/(.+))$/i);
    if (match) {
      libName = match[1];
      uri = match[2];
      protocol = match[3];
      pathname = match[4];
      load();
    } else {
      checkPrebuilt();
    }
    function checkPrebuilt() {
      const prebuiltPath = path.join(__dirname, '..', 'prebuilt', modName + '.js');
      fs.exists(prebuiltPath, exists => {
        if (exists) {
          let isPrebuilt = true;
          libName = modName;
          protocol = 'file';
          uri = 'file://' + prebuiltPath;
          pathname = prebuiltPath;
          load();
        } else {
          checkBootCdn();
        }
      });
    }
    function checkBootCdn() {
      if (!useBootCdn) {
        loadNpm();
        return;
      }
      modName = modName.replace(/\.js$/i, '');
      http.get(`http://www.bootcdn.cn/${modName}/`, res => {
        if (res.statusCode === 200) {
          loadBootCdn(res);
        } else {
          fail();
        }
      });
      http.get(`http://www.bootcdn.cn/${modName}.js/`, res => {
        if (res.statusCode === 200) {
          loadBootCdn(res);
        } else {
          fail();
        }
      });
      let loaded = false;
      function loadBootCdn(res) {
        if (loaded) {
          return;
        };
        loaded = true;
        res.pipe(concat(content => {
          content = content.toString();
          const $ = cheerio.load(content);
          const versions = $('a.version-anchor');
          for (let i = 0; i < versions.length; i++) {
            const version = $(versions[i]);
            if (/\b(pre|beta|alpha)\b/.test(version.attr('id'))) {
              continue;
            } else {
              const links = version.next('h3').next('div.package-version').find('.library-url');
              for (let i = 0; i < links.length; i++) {
                const link = $(links[i]).html();
                if (!/\.min\.js$/.test(link)) {
                  continue;
                }
                const url = link.replace(/^.*\/\//, 'http://');
                resolve(install(`${modName}:${url}`));
                return;
              }
              break;
            }
          }
          loadNpm();
        }));
      }
      let fails = 0;
      function fail() {
        fails++;
        if (fails >= 2) {
          loadNpm();
        }
      }
    }
    function loadNpm() {
      libName = modName;
      protocol = 'npm';
      uri = 'npm://' + modName;
      pathname = modName;
      load();
    }
    function load() {
      switch (protocol) {
        case 'file': {
          if (isPrebuilt) {
            console.log(`Install from prebuilt: ${modName}`);
          } else {
            console.log(`Install from file: ${modName}`);
          }
          const tmpname = `tmp-${Date.now()}${Math.random()}`;
          const output = fs.createWriteStream(path.join(tmpDir, `${tmpname}.js`));
          fs.createReadStream(pathname).pipe(output);
          output.on('finish', () => {
            resolve([libName, `./${tmpname}`]);
          });
          break;
        }
        case 'http':
        case 'https': {
          console.log(`Install from url: ${modName}`);
          const proto = /^https/.test(uri) ? https : http;
          proto.get(uri, res => {
            const tmpname = `tmp-${Date.now()}${Math.random()}`;
            const output = fs.createWriteStream(path.join(tmpDir, `${tmpname}.js`));
            res.pipe(output);
            output.on('finish', () => {
              resolve([libName, `./${tmpname}`]);
            });
          });
          break;
        }
        case 'npm': {
          console.log(`Install from npm: ${modName}`);
          const cp = spawn('npm', ['install', pathname].concat(otherArgs), {
            shell: true, stdio: 'inherit', cwd: tmpDir,
          });
          cp.on('close', code => {
            if (code !== 0) {
              console.error('Install failed');
            } else {
              resolve([libName.replace(/\@.*$/, ''), pathname.replace(/\@.*$/, '')]);
            }
          });
          break;
        }
      }
    }
  });
}

function createFile([modName, requireName]) {
  return integrate(requireName)
    .then(ast => {
      return new Promise(resolve => {
        fs.mkdir('dropin_modules', function() {
          const devOutput = `dropin_modules/${modName}`;
          const prodOutput = `dropin_modules/${modName}.min`;
          const promise = [];
          promise.push(new Promise(resolve => {
            console.log(`Generate ${devOutput}`);
            ast.modName.value = `dropin_modules/${modName}`;
            fs.writeFile(devOutput + '.js', escodegen.generate(ast), resolve);
          }));
          acornWalk.simple(ast, {
            MemberExpression(node) {
              if (node.computed || node.property.type !== 'Identifier' || node.property.name !== 'NODE_ENV') {
                return;
              }
              const obj = node.object;
              if (obj.computed || obj.type !== 'MemberExpression') {
                return;
              }
              if (obj.property.type !== 'Identifier' || obj.property.name !== 'env') {
                return;
              }
              if (obj.object.type !== 'Identifier' || obj.object.name !== 'process') {
                return;
              }
              node.type = 'Literal';
              node.value = 'production';
              delete node.property;
              delete node.object;
            },
            BinaryExpression(node) {
              if (
                (node.operator === '==' || node.operator === '===' || node.operator === '!=' || node.operator === '!==') 
                && node.left.type === 'Literal' && node.right.type === 'Literal'
                && node.left.value === node.right.value
              ) {
                node.type = 'Literal';
                node.value = node.operator === '==' || node.operator === '===';
                delete node.operator;
                delete node.left;
                delete node.right;
              }
            },
            IfStatement(node) {
              if (node.test.type === 'Literal') {
                let keep = node.test.value ? node.consequent : node.alternate;
                if (!keep) {
                  keep = {
                    type: 'EmptyStatement',
                  };
                }
                delete node.test;
                delete node.consequent;
                delete node.alternate;
                Object.assign(node, keep);
              }
            },
          });
          ast.modName.value = `dropin_modules/${modName}.min`;
          code = escodegen.generate(ast, {
            format: {
              compact: true,
              safeConcatenation: true,
            },
          });
          promise.push(new Promise(resolve => {
            console.log(`Generate ${prodOutput}`);
            fs.writeFile(prodOutput + '.js', code, resolve);
          }));
          Promise.all(promise).then(resolve);
        });
      });
    })
    .catch(err => console.error(err.stack));
}

function integrate(requireName) {
  return resolveRequire(requireName).then(result => {
    const body = {
      type: 'BlockStatement',
    };
    const modName = {
      type: 'Literal',
    };
    const program = {
      type: 'Program',
      modName,
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'CallExpression',
            callee: {
              type: 'MemberExpression',
              object:{
                type: 'MemberExpression',
                object: {
                  type: 'Identifier',
                  name: 'window',
                },
                property: {
                  type: 'Identifier',
                  name: 'Dropin',
                },
              },
              property: {
                type: 'Identifier',
                name: 'declare',
              },
            },
            arguments: [
              modName,
              {
                type: 'FunctionExpression',
                generator: true,
                params: [
                  {
                    type: 'Identifier',
                    name: 'dReq',
                  },
                  {
                    type: 'Identifier',
                    name: 'DropinUtils',
                  },
                ],
                body,
              },
            ],
          },
        },
      ],
    };
    body.body = [
      {
        type: 'VariableDeclaration',
        kind: 'const',
        declarations: [
          {
            type: 'VariableDeclarator',
            id: {
              type: 'Identifier',
              name: 'process',
            },
            init: {
              type: 'ObjectExpression',
              properties: [
                {
                  type: 'Property',
                  kind: 'init',
                  key: {
                    type: 'Literal',
                    value: 'env',
                  },
                  value: {
                    type: 'ObjectExpression',
                    properties: [],
                  },
                },
              ],
            },
          },
          {
            type: 'VariableDeclarator',
            id: {
              type: 'Identifier',
              name: '$DROPIN_EXTERN$',
            },
            init: {
              type: 'ObjectExpression',
              properties: result.unresolved.map(item => {
                return {
                  type: 'Property',
                  kind: 'init',
                  key: {
                    type: 'Literal',
                    value: item,
                  },
                  value: {
                    type: 'YieldExpression',
                    delegate: false,
                    argument: {
                      type: 'CallExpression',
                      callee: {
                        type: 'Identifier',
                        name: 'dReq',
                      },
                      arguments: [
                        {
                          type: 'Literal',
                          value: item,
                        },
                      ],
                    },
                  },
                };
              }),
            },
          },
          {
            type: 'VariableDeclarator',
            id: {
              type: 'Identifier',
              name: '$DROPIN_MODS$',
            },
            init: {
              type: 'ObjectExpression',
              properties: Object.keys(result.codes).map(modName => {
                const code = result.codes[modName];
                return {
                  type: 'Property',
                  kind: 'init',
                  key: {
                    type: 'Literal',
                    value: result.resolved.mods[modName],
                  },
                  value: {
                    type: 'ObjectExpression',
                    properties: [
                      // {
                      //   type: 'Property',
                      //   kind: 'init',
                      //   key: {
                      //     type: 'Identifier',
                      //     name: 'name',
                      //   },
                      //   value: {
                      //     type: 'Literal',
                      //     value: modName,
                      //   },
                      // },
                      {
                        type: 'Property',
                        kind: 'init',
                        key: {
                          type: 'Identifier',
                          name: 'define',
                        },
                        value: {
                          type: 'FunctionExpression',
                          params: [
                            {
                              type: 'Identifier',
                              name: 'require',
                            },
                            {
                              type: 'Identifier',
                              name: 'module',
                            },
                            {
                              type: 'Identifier',
                              name: 'exports',
                            },
                          ],
                          body: {
                            type: 'BlockStatement',
                            body: code.body,
                          },
                        },
                      },
                      {
                        type: 'Property',
                        kind: 'init',
                        key: {
                          type: 'Identifier',
                          name: 'deps',
                        },
                        value: {
                          type: 'ObjectExpression',
                          properties: Object.keys(code.deps).map(dep => {
                            return {
                              type: 'Property',
                              kind: 'init',
                              key: {
                                type: 'Literal',
                                value: dep,
                              },
                              value : {
                                type: 'Literal',
                                value: code.deps[dep],
                              },
                            };
                          }),
                        },
                      },
                    ],
                  },
                };
              }),
            },
          },
        ],
      },
      {
        type: 'ReturnStatement',
        argument: {
          type: 'CallExpression',
          callee: {
            type: 'CallExpression',
            callee: {
              type: 'MemberExpression',
              object: {
                type: 'Identifier',
                name: 'Dropin',
              },
              property: {
                type: 'Identifier',
                name: 'createInternalRequire',
              },
            },
            arguments: [
              {
                type: 'Identifier',
                name: '$DROPIN_MODS$',
              },
              {
                type: 'ObjectExpression',
                properties: [
                  {
                    type: 'Property',
                    kind: 'init',
                    key: {
                      type: 'Literal',
                      value: 'entry',
                    },
                    value : {
                      type: 'Literal',
                      value: result.resolved.mods[result.resolvedPath],
                    },
                  },
                ],
              }
            ],
          },
          arguments: [
            {
              type: 'Literal',
              value: 'entry',
            }
          ],
        },
      },
    ];
    return program;
  });
}

function resolveRequire(requireName, ctx) {
  ctx = ctx || {
    from: path.join(tmpDir, '__bundle.js'),
    codes: {},
    unresolved: [],
    resolved: {
      counter: 0,
      mods: {},
    },
  };
  return new Promise(resolve => {
    bResolve(requireName, {
      filename: ctx.from,
    }, (err, resolvedPath) => {
      var isExternal = false;
      if (err) {
        if (/^[a-zA-Z0-9\-_\/]+$/.test(requireName)) {
          resolvedPath = requireName;
          isExternal = true;
        } else {
          resolvedPath = path.resolve(path.dirname(ctx.from), requireName);
        }
      }
      ctx.resolvedPath = resolvedPath;
      if (ctx.codes[resolvedPath]) {
        resolve();
        return;
      }
      const relativeToRoot = path.relative(tmpDir, resolvedPath).replace(/\\/g, '/');
      if (/^node_modules\//.test(relativeToRoot)) {
        ctx.resolved.mods[resolvedPath] = relativeToRoot;
      } else {
        ctx.resolved.counter++;
        ctx.resolved.mods[resolvedPath] = ctx.resolved.counter;
      }
      if (err) {
        if (isExternal) {
          ctx.unresolved.push(requireName);
          ctx.codes[resolvedPath] = {
            type: 'Program',
            deps: {},
            body: [
              {
                type: 'ExpressionStatement',
                expression: {
                  type: 'AssignmentExpression',
                  operator: '=',
                  left: {
                    type: 'MemberExpression',
                    object: {
                      type: 'Identifier',
                      name: 'module',
                    },
                    property: {
                      type: 'Identifier',
                      name: 'exports',
                    },
                  },
                  right: {
                    type: 'MemberExpression',
                    computed: true,
                    object: {
                      type: 'Identifier',
                      name: '$DROPIN_EXTERN$',
                    },
                    property: {
                      type: 'Literal',
                      value: requireName,
                    },
                  },
                },
              },
            ],
          };
        } else {
          ctx.codes[resolvedPath] = {
            type: 'Program',
            deps: {},
            body: [
              {
                type: 'ExpressionStatement',
                expression: {
                  type: 'CallExpression',
                  callee: {
                    type: 'MemberExpression',
                    object: {
                      type: 'Identifier',
                      name: 'console',
                    },
                    property: {
                      type: 'Identifier',
                      name: 'error',
                    },
                  },
                  arguments: [
                    {
                      type: 'Literal',
                      value: err.message,
                    },
                  ],
                },
              },
            ],
          };
        }
        resolve();
      } else {
        fs.readFile(resolvedPath, 'utf-8', (err, content) => {
          if (err) {
            console.error(err.stack);
          } else {
            const deps = [];
            const ast = acorn.parse(content);
            ast.deps = {};
            ctx.codes[resolvedPath] = ast;
            acornWalk.simple(ast, {
              CallExpression(node) {
                if (node.callee.type !== 'Identifier' || node.callee.name !== 'require') {
                  return;
                }
                const arg = node.arguments[0];
                if (node.arguments.length !== 1 || arg.type !== 'Literal' || typeof arg.value !== 'string') {
                  return;
                }
                deps.push(arg.value);
              },
            });
            promiseEach(deps, dep =>
              resolveRequire(dep, Object.assign({}, ctx, {
                from: resolvedPath,
                resolvedPath: '',
              })).then(res => {
                ast.deps[dep] = res.resolved.mods[res.resolvedPath];
              })
            ).then(resolve);
          }
        });
      }
    });
  }).then(() => ctx);
}

