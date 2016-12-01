const command = require('yargs').argv._[0] || 'help';

if ([
  'help',
  'install',
].indexOf(command) === -1) {
  console.log(`Unrecognized command ${command}. Call help to see available commands`);
} else {
  require(`./${command}`);
}
