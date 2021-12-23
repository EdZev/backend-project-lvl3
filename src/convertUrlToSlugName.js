import { URL } from 'url';

export default (pathUrl) => {
  const { host, pathname } = new URL(pathUrl);
  return `${host}${pathname}`.replace(/[^A-Za-z0-9]/g, '-').replace(/-$/i, '');
};
