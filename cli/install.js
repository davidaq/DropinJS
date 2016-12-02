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
        if (err) {
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
      const match = modName.match(/([a-zA-Z0-9\-]+)(\.min)?(\.js)?$/);
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
  return new Promise(resolve => {
    const content = `
    window.dropin.declare(${JSON.stringify(modName)}, function* () {
      return require(${JSON.stringify(requireName)});
    });
    `;
    const entry = path.join(tmpDir, 'index.js');
    fs.writeFile(entry, content, err => {
      if (err) {
        console.error('Unable to write temporary file');
      } else {
        var pack = browserify();
        pack.add(entry);
        const devOutput = `${modName}.lib.js`;
        const prodOutput = `${modName}.lib.min.js`;
        pack.bundle().pipe(concat(code => {
          code = code.toString();
          const promise = [];
          promise.push(new Promise(resolve => {
            fs.writeFile(devOutput, code, resolve);
          }));
          const ast = acorn.parse(code);
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
            fs.writeFile(prodOutput, code, resolve);
          }));
          Promise.all(promise).then(resolve);
        }));
      }
    });
  });
}
