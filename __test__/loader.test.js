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

const filename = 'example.html';

let data;
let dest;

beforeAll(async () => {
  data = await readFile(filename, 'utf-8');
});

beforeEach(async () => {
  dest = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('loader', async () => {
  nock(/example\.com/)
    .get('/')
    .twice()
    .reply(200, data);
  await loadPage('https://www.example.com', dest);
  const filePath = path.join(dest, 'www-example-com.html');
  const actual = await fs.readFile(filePath, 'utf-8');
  expect(actual.trim()).toEqual(data.trim());
});
