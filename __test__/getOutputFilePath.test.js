import getNewFilePath from '../src/getOutputFilePath.js';

const urls = [
  { url: 'https://example.com/', path: '/var/tmp', expected: '/var/tmp/example-com.html' },
  { url: 'https://ru.hexlet.io/courses', path: '/var/tmp', expected: '/var/tmp/ru-hexlet-io-courses.html' },
];

describe.each(urls)('for url - ($url)', ({ url, path, expected }) => {
  test(`returns${expected}`, () => {
    expect(getNewFilePath(url, path)).toEqual(expected);
  });
});
