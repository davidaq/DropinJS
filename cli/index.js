const alias = {
  'i': 'install',
  'h': 'help',
};

let command = require('yargs').argv._[0] || 'help';
command = alias[command] || command;

if ([
  'help',
  'install',
].indexOf(command) === -1) {
  console.log(`Unrecognized command ${command}. Call help to see available commands`);
} else {
  require(`./${command}`);
}
