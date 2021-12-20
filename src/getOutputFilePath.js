import path from 'path';

export default (pathUrl, pathfile) => {
  const url = new URL(pathUrl);
  const host = url.host.split('.');
  const pathname = url.pathname.split('/').filter((e) => e !== '');
  const filename = `${[...host, ...pathname].join('-')}.html`;
  return path.join(pathfile, filename);
};
