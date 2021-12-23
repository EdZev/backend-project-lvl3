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

const sourceData = 'source.html';
const resultData = 'result.html';
const image = 'nodejs.png';

let data;
let expected;
let dest;
let fileData;

beforeAll(async () => {
  data = await readFile(sourceData, 'utf-8');
  fileData = await readFile(image);
  expected = await readFile(resultData, 'utf-8');
});

beforeEach(async () => {
  dest = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('loader formated', async () => {
  nock(/ru\.hexlet\.io/)
    .get(/\/courses/)
    .twice()
    .reply(200, data);
  nock(/ru\.hexlet\.io/)
    .get(/\/assets\/professions\/nodejs\.png/)
    .twice()
    .reply(200, fileData);
  await loadPage('https://ru.hexlet.io/courses/', dest);
  const filePathHtml = path.join(dest, 'ru-hexlet-io-courses.html');
  const actualHtml = await fs.readFile(filePathHtml, 'utf-8');
  const filePathPng = path.join(dest, 'ru-hexlet-io-courses_files', 'ru-hexlet-io-assets-professions-nodejs.png');
  const actualPng = await fs.readFile(filePathPng);
  expect(actualHtml.trim()).toEqual(expected.trim());
  expect(actualPng).toEqual(fileData);
});
