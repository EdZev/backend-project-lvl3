#!/usr/bin/env node
import program from 'commander';
import loadPage from '../src/index.js';

program
  .description('Page loader utility')
  .version('1.0.0', '-V, --version', 'output the version number')
  .helpOption('-h, --help', 'display help for command')
  .option('-o, --output [path]', 'output dir', process.cwd())
  .arguments('<url>')
  .action((url, option) => {
    loadPage(url, option.output)
      .then((res) => console.log(`Open ${res}`))
      .catch((err) => {
        console.log(err);
        console.error(err.message);
        process.exit(1);
      });
  })
  .parse(process.argv);
