const { XMLParser } = require('fast-xml-parser');

function parseConfigXml(xmlContent) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => name === 'subdomain' || name === 'cookie',
  });

  const parsed = parser.parse(xmlContent);
  const config = parsed?.config;

  if (!config) {
    throw new Error('Invalid XML format: missing <config> root element');
  }

  const rawSubdomains = config.subdomains?.subdomain || [];
  const subdomains = rawSubdomains
    .map((item) => (typeof item === 'string' ? item.trim() : String(item).trim()))
    .filter(Boolean);

  const rawCookies = config.cookies?.cookie || [];
  const cookies = rawCookies.map((item) => {
    const name = item['@_name'];
    const host = item['@_host'];
    const value = item['#text'] !== undefined ? String(item['#text']).trim() : '';

    if (!name || !host) {
      throw new Error('Invalid <cookie> element: missing name or host attribute');
    }

    return {
      key: `cookie:${name}:${host}`,
      value,
    };
  });

  return { subdomains, cookies };
}

module.exports = { parseConfigXml };