import { URL } from 'url';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import debug from 'debug';
import 'axios-debug-log';
import Listr from 'listr';
import * as cheerio from 'cheerio';

const log = debug('page-loader');
const appName = 'page-loader';
debug('booting %o', appName);

const resourcesTypes = [
  { tag: 'img', attr: 'src' },
  { tag: 'link', attr: 'href' },
  { tag: 'script', attr: 'src' },
];

export const convertUrlToSlugName = (pathUrl) => {
  const { host, pathname } = new URL(pathUrl);
  return `${host}${pathname}`.replace(/[^A-Za-z0-9]/g, '-').replace(/-$/i, '');
};

export const getSourcesAndProcessedPage = (localPath, targetUrl, page) => {
  log('parse html received from', targetUrl.href);
  const parsePage = ({ tag, attr }) => page(tag).toArray().reduce((acc, element) => {
    const attribs = element.attribs[attr];
    const elementUrl = new URL(attribs, targetUrl.href);

    if ((elementUrl.origin !== targetUrl.origin) || !attribs) return acc;

    const { dir, name, ext } = path.parse(elementUrl.pathname);
    const preparedName = convertUrlToSlugName(path.join(targetUrl.origin, dir, name));
    const filename = `${preparedName}${ext === '' ? '.html' : ext}`;
    const filepath = path.join(localPath, filename);

    const htmlElement = page(element).attr(attr).replace(attribs, filepath);
    page(element).attr(attr, htmlElement);

    return [...acc, { elementUrl, filepath }];
  }, []);

  const sources = resourcesTypes.map((type) => parsePage(type)).flat();

  return { sources, page: page.html() };
};

export const getPage = (url) => {
  log('download', url);
  return axios.get(url)
    .then(({ data }) => cheerio.load(data, { decodeEntities: false }));
};

export const downloadElements = (sources, pathOutput) => {
  log('download & save assets');
  const downloadTasks = sources.map(({ elementUrl, filepath }) => {
    const localPathFile = path.join(pathOutput, filepath);
    return {
      title: `${elementUrl.href} saved to ${localPathFile}`,
      task: () => axios.get(elementUrl.href, { responseType: 'arraybuffer' })
        .then(({ data }) => fs.writeFile(localPathFile, data, 'utf-8')),
    };
  });

  return new Listr(downloadTasks, { concurrent: true, exitOnError: false }).run();
};
