const { spawn } = require('child_process');
const browserify = require('browserify');
const fs = require('fs');
const os = require('os');
const path = require('path');
const rimraf = require('rimraf');
const acorn = require('acorn');
const acornWalk = require('acorn/dist/walk');
const escodegen = require('escodegen');
const concat = require('concat-stream');
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
    if (/^https?\:\/\//.test(modName)) {
      const url = modName;
      const match = modName.match(/([a-zA-Z0-9\-_]+)(\.min)?(\.js)?$/);
      if (match) {
        modName = match[1];
      }
      console.log(`Install from url: ${modName}`);
      const proto = /^https/.test(url) ? https : http;
      proto.get(url, res => {
        const output = fs.createWriteStream(path.join(tmpDir, 'download.js'));
        res.pipe(output);
        output.on('finish', () => {
          resolve([modName, './download']);
        });
      });
    } else {
      console.log(`Install from npm: ${modName}`);
      const cp = spawn('npm', ['install', modName].concat(otherArgs), {
        shell: true, stdio: 'inherit', cwd: tmpDir,
      });
      cp.on('close', code => {
        if (code !== 0) {
          console.error('Install failed');
        } else {
          resolve([modName, modName]);
        }
      });
    }
  });
}

function createFile([modName, requireName]) {
  return integrate(modName, requireName)
    .then(ast => {
      return new Promise(resolve => {
        fs.mkdir('dropin_modules', function() {
          const devOutput = `dropin_modules/${modName}`;
          const prodOutput = `dropin_modules/${modName}.min`;
          const promise = [];
          promise.push(new Promise(resolve => {
            console.log(`Generate ${devOutput}`);
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
          code = escodegen.generate(ast, {
            format: {
              compact: true,
              safeConcatenation: true,
            },
          });
          promise.push(new Promise(resolve => {
            console.log(`Generate ${prodOutput}`);
            fs.writeFile(prodOutput + '.js', code.replace('$$MOD_NAME$$', JSON.stringify(prodOutput)), resolve);
          }));
          Promise.all(promise).then(resolve);
        });
      });
    })
    .catch(err => console.error(err.stack));
}

function integrate(modName, requireName) {
  return resolveRequire(requireName).then(result => {
    const body = {
      type: 'BlockStatement',
    };
    const program = {
      type: 'Program',
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
              {
                type: 'Literal',
                value: 'dropin_modules/' + modName,
              },
              {
                type: 'FunctionExpression',
                generator: true,
                params: [
                  {
                    type: 'Identifier',
                    name: 'dReq',
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
      ctx.resolved.counter++;
      ctx.resolved.mods[resolvedPath] = ctx.resolved.counter;
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
                    value: err.stack,
                  },
                ],
              },
            ],
          };
          console.error(err.stack);
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

