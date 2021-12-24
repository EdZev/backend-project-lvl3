import fs from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';
import path from 'path';
import nock from 'nock';
import axios from 'axios';
import httpAdaptor from 'axios/lib/adapters/http';

import loadPage from '../src/index.js';

nock.disableNetConnect();
axios.defaults.adapter = httpAdaptor;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const readFile = (name, encoding = null) => fs.readFile(getFixturePath(name), encoding);

const htmlData = {
  inputFileData: readFile('source.html', 'utf-8'),
  expectedFileName: 'ru-hexlet-io-courses.html',
  expectedFileData: readFile('result.html', 'utf-8'),
};

const url = /ru\.hexlet\.io/;
const outputAssetsDir = 'ru-hexlet-io-courses_files';

const testData = [
  {
    testName: 'test/img',
    fileData: readFile('nodejs.png', 'utf-8'),
    pathUrl: /\/assets\/professions\/nodejs\.png/,
    outputFilename: 'ru-hexlet-io-assets-professions-nodejs.png',
  },
  {
    testName: 'test/css',
    fileData: readFile('menu.css', 'utf-8'),
    pathUrl: /\/assets\/application\.css/,
    outputFilename: 'ru-hexlet-io-assets-application.css',
  },
  {
    testName: 'test/js',
    fileData: readFile('runtime.js', 'utf-8'),
    pathUrl: /\/packs\/js\/runtime\.js/,
    outputFilename: 'ru-hexlet-io-packs-js-runtime.js',
  },
];

let dest;
let outputHtmlPath;

beforeAll(async () => {
  dest = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  nock(url)
    .get(/\/courses/)
    .twice()
    .reply(200, await htmlData.inputFileData);
  testData.forEach(async ({ fileData, pathUrl }) => {
    nock(url).get(pathUrl).twice().reply(200, await fileData);
  });
  outputHtmlPath = await loadPage('https://ru.hexlet.io/courses/', dest);
});

test('test/html', async () => {
  const actualHtml = await fs.readFile(outputHtmlPath, 'utf-8');
  const expected = await htmlData.expectedFileData;
  expect(actualHtml).toEqual(expected);
});

test.each(testData)('$testName', async ({ fileData, outputFilename }) => {
  const expected = await fileData;
  const filePath = path.join(dest, outputAssetsDir, outputFilename);
  const actual = await fs.readFile(filePath, 'utf-8');
  expect(actual).toEqual(expected);
});
