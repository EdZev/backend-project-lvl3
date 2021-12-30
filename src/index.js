import fs from 'fs/promises';
import path from 'path';
import debug from 'debug';
import 'axios-debug-log';
import {
  convertUrlToSlugName,
  getPage,
  downloadElements,
  getSourcesAndProcessedPage,
} from './utils.js';

const log = debug('page-loader');
const appName = 'page-loader';
debug('booting %o', appName);

export default (url, pathOutput) => {
  const targetUrl = new URL(url);
  const pathToProject = path.resolve(process.cwd(), pathOutput || '');
  const outputFileName = `${convertUrlToSlugName(url)}.html`;
  const outputFilePath = path.join(pathToProject, outputFileName);
  const assetsDirName = `${convertUrlToSlugName(url)}_files`;
  const assetsDirPath = path.join(pathToProject, assetsDirName);

  return getPage(url)
    .then((page) => getSourcesAndProcessedPage(assetsDirName, targetUrl, page))
    .then(({ sources, page }) => {
      log('save html to:', outputFilePath);
      return fs.writeFile(outputFilePath, page, 'utf-8').then(() => sources);
    })
    .then((sources) => {
      log('create dir:', assetsDirPath);
      return fs.mkdir(assetsDirPath).then(() => sources);
    })
    .then((sources) => downloadElements(sources, pathToProject))
    .then(() => outputFilePath)
    .catch((err) => {
      throw err;
    });
};
