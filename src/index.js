import fs from 'fs/promises';
import axios from 'axios';
import getFileName from './getOutputFilePath.js';

export default (pathUrl, pathOutput) => axios.get(pathUrl)
  .then(({ data }) => {
    const outputDir = getFileName(pathUrl, pathOutput);
    fs.writeFile(outputDir, data, 'utf-8');
    return outputDir;
  })
  .then((outputDir) => outputDir)
  .catch((err) => {
    throw err;
  });
