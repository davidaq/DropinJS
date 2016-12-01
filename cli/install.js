const { spawn } = require('child_process');
const browserify = require('browserify');
const fs = require('fs');
const os = require('os');
const path = require('path');
const rimraf = require('rimraf');

const argv = require('yargs').argv;
const mods = argv._.slice(1);

const tmpDir = path.join(os.tmpDir(), `dropin_install_${mods[0]}`);

const otherArgs = [];
if (argv.registry) {
  otherArgs.push(`--registry=${JSON.stringify(argv.registry)}`);
}

rimraf(tmpDir, function() {
  fs.mkdir(tmpDir, function(err) {
    if (err) {
      console.error('Unable to create temporary directory');
    } else {
      mods.reduce(function(promise, mod) {
        return promise.then(function() { return install(mod); });
      }, Promise.resolve()).then(function() {
        return mods.reduce(function(promise, mod) {
          return promise.then(function() { return createFile(mod); });
        }, Promise.resolve());
      }).then(function() {
        rimraf(tmpDir, function() {
          console.log('Done');
        });
      });
    }
  });
});

function install(modName) {
  return new Promise(function(resolve) {
    console.log(`Install from npm: ${modName}`);
    const cp = spawn('npm', ['install', modName].concat(otherArgs), {
      shell: true, stdio: 'inherit', cwd: tmpDir,
    });
    cp.on('close', function(code) {
      if (code !== 0) {
        console.error('Install failed');
      } else {
        resolve();
      }
    });
  });
}

function createFile(modName) {
  return new Promise(function(resolve) {
    const modNameStr = JSON.stringify(modName);
    const content = `
    window.dropin.declare(${modNameStr}, function* () { return require(${modNameStr}) });
    `;
    const entry = path.join(tmpDir, 'index.js');
    fs.writeFile(entry, content, function(err) {
      if (err) {
        console.error('Unable to write temporary file');
      } else {
        var pack = browserify();
        pack.add(entry);
        const output = fs.createWriteStream(`${modName}.lib.js`);
        pack.bundle().pipe(output);
        output.on('finish', function() {
          console.log(`Create ${modName}.lib.js`);
          resolve();
        });
      }
    });
  });
}
