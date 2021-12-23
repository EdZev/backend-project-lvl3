import convertUrlToSlugName from '../src/convertUrlToSlugName.js';

const urls = [
  { url: 'https://example.com/', expected: 'example-com' },
  { url: 'https://ru.hexlet.io/courses', expected: 'ru-hexlet-io-courses' },
];

describe.each(urls)('for url - ($url)', ({ url, expected }) => {
  test(`returns${expected}`, () => {
    expect(convertUrlToSlugName(url)).toEqual(expected);
  });
});
