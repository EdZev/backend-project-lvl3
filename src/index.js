import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import convertUrlToSlugName from './convertUrlToSlugName.js';

const getPage = (url) => axios.get(url)
  .then(({ data }) => cheerio.load(data, { decodeEntities: false }));

const parsePage = (localPath, targetUrl, page) => {
  const sources = page('img').toArray().reduce((acc, element) => {
    const src = new URL(element.attribs.src, targetUrl.href);
    const { dir, name, ext } = path.parse(element.attribs.src);
    const filename = `${convertUrlToSlugName(path.join(targetUrl.origin, dir, name))}${ext}`;
    const localSrc = path.join(localPath, `${filename}`);
    const link = page(element).attr('src').replace(src.pathname, localSrc);
    page(element).attr('src', link);
    return [...acc, { src, localSrc }];
  }, []);
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
    .then((data) => parsePage(assetsDirName, targetUrl, data))
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
