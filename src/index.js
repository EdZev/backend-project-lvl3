import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import debug from 'debug';
import 'axios-debug-log';
import * as cheerio from 'cheerio';
import Listr from 'listr';
import convertUrlToSlugName from './convertUrlToSlugName.js';

const log = debug('page-loader');
const appName = 'page-loader';
debug('booting %o', appName);

const resourcesTypes = [
  { tag: 'img', attr: 'src' },
  { tag: 'link', attr: 'href' },
  { tag: 'script', attr: 'src' },
];

const getPage = (url) => {
  log('download', url);
  return axios.get(url)
    .then(({ data }) => cheerio.load(data, { decodeEntities: false }));
};

const getProcessedPage = (
  localPath,
  targetUrl,
  page,
) => {
  log('parse html received from', targetUrl.href);
  const parsePage = ({ tag, attr }) => page(tag).toArray().reduce((acc, element) => {
    const attribs = element.attribs[attr];
    const src = new URL(attribs, targetUrl.href);
    if (src.origin !== targetUrl.origin) return acc;
    const { dir, name, ext } = path.parse(src.pathname);
    const filename = `${convertUrlToSlugName(path.join(targetUrl.origin, dir, name))}${ext === '' ? '.html' : ext}`;
    const localSrc = path.join(localPath, `${filename}`);
    const htmlElement = page(element).attr(attr).replace(attribs, localSrc);
    page(element).attr(attr, htmlElement);
    return [...acc, { src, localSrc }];
  }, []);
  const sources = resourcesTypes.map((type) => parsePage(type)).flat();
  return { sources, page: page.html() };
};

const downloadElements = (sources, pathOutput) => {
  log('download & save assets');
  const downloadTasks = sources.map(({ src, localSrc }) => {
    const localPathFile = path.join(pathOutput, localSrc);
    return {
      title: `${src.href} saved to ${localPathFile}`,
      task: () => axios.get(src.href, { responseType: 'arraybuffer' })
        .then(({ data }) => fs.writeFile(localPathFile, data, 'utf-8')),
    };
  });
  return new Listr(downloadTasks, { concurrent: true, exitOnError: false }).run();
};

export default (url, pathOutput) => {
  const targetUrl = new URL(url);
  const outputFileName = `${convertUrlToSlugName(url)}.html`;
  const outputFilePath = path.join(pathOutput, outputFileName);
  const assetsDirName = `${convertUrlToSlugName(url)}_files`;
  const assetsDirPath = path.join(pathOutput, assetsDirName);

  return getPage(url)
    .then((page) => getProcessedPage(assetsDirName, targetUrl, page))
    .then(({ sources, page }) => {
      log('save html to:', outputFilePath);
      return fs.writeFile(outputFilePath, page, 'utf-8').then(() => sources);
    })
    .then((sources) => {
      log('create dir:', assetsDirPath);
      return fs.mkdir(assetsDirPath).then(() => sources);
    })
    .then((sources) => downloadElements(sources, pathOutput))
    .then(() => outputFilePath)
    .catch((err) => {
      throw err;
    });
};
