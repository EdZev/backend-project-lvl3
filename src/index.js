import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import convertUrlToSlugName from './convertUrlToSlugName.js';

const resourcesTypes = [
  { tag: 'img', attr: 'src' },
  { tag: 'link', attr: 'href' },
  { tag: 'script', attr: 'src' },
];

const getPage = (url) => axios.get(url)
  .then(({ data }) => cheerio.load(data, { decodeEntities: false }));

const getProcessedPage = (
  localPath,
  targetUrl,
  page,
) => {
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

const downloadSources = ({ src, localSrc }, pathOutput) => axios
  .get(src.href, { responseType: 'arraybuffer' })
  .then(({ data }) => {
    const localPathFile = path.join(pathOutput, localSrc);
    fs.writeFile(localPathFile, data, 'utf-8');
    return localPathFile;
  });

export default (url, pathOutput) => {
  const targetUrl = new URL(url);
  const outputFileName = `${convertUrlToSlugName(url)}.html`;
  const outputFilePath = path.join(pathOutput, outputFileName);
  const assetsDirName = `${convertUrlToSlugName(url)}_files`;
  const assetsDirPath = path.join(pathOutput, assetsDirName);

  return getPage(url)
    .then((page) => getProcessedPage(assetsDirName, targetUrl, page))
    .then(({ sources, page }) => {
      fs.writeFile(outputFilePath, page, 'utf-8');
      fs.mkdir(assetsDirPath);
      return sources;
    })
    .then((sources) => {
      const localPathFile = sources.map((source) => downloadSources(source, pathOutput));
      return Promise.all(localPathFile);
    })
    .then(() => outputFilePath)
    .catch((err) => {
      throw err;
    });
};
