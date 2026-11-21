const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { parseConfigXml } = require('../src/parser');
const { exportXmlToRedis } = require('../src/exporter');
const { parseArgs } = require('../src/index');

const SAMPLE_XML = `
<config>
  <subdomains>
    <subdomain>http://secureline.tools.avast.com</subdomain>
    <subdomain>http://gf.tools.avast.com</subdomain>
  </subdomains>
  <cookies>
    <cookie name="dlp-avast" host="amazon">mmm_amz_dlp_777_ppc_m</cookie>
    <cookie name="dlp-avg" host="baixaki">mmm_bxk_dlp_779_ppc_m</cookie>
  </cookies>
</config>
`;

test('parseConfigXml extracts subdomains and cookie key-value pairs', () => {
  const result = parseConfigXml(SAMPLE_XML);

  assert.deepEqual(result.subdomains, [
    'http://secureline.tools.avast.com',
    'http://gf.tools.avast.com',
  ]);
  assert.deepEqual(result.cookies, [
    { key: 'cookie:dlp-avast:amazon', value: 'mmm_amz_dlp_777_ppc_m' },
    { key: 'cookie:dlp-avg:baixaki', value: 'mmm_bxk_dlp_779_ppc_m' },
  ]);
});

test('parseConfigXml throws on missing <config> root', () => {
  assert.throws(() => parseConfigXml('<invalid></invalid>'), /missing <config>/i);
});

test('exportXmlToRedis saves expected keys to Redis and prints keys when verbose is true', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'xml-redis-'));
  const xmlFile = path.join(tmpDir, 'config.xml');
  await fs.writeFile(xmlFile, SAMPLE_XML, 'utf-8');

  const store = new Map();
  const mockRedis = {
    async set(key, value) {
      store.set(key, value);
    },
  };

  const printed = [];
  const savedKeys = await exportXmlToRedis({
    xmlPath: xmlFile,
    redisClient: mockRedis,
    verbose: true,
    logger: (msg) => printed.push(msg),
  });

  assert.equal(
    store.get('subdomains'),
    JSON.stringify(['http://secureline.tools.avast.com', 'http://gf.tools.avast.com'])
  );
  assert.equal(store.get('cookie:dlp-avast:amazon'), 'mmm_amz_dlp_777_ppc_m');
  assert.equal(store.get('cookie:dlp-avg:baixaki'), 'mmm_bxk_dlp_779_ppc_m');
  assert.deepEqual(printed, savedKeys);

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('parseArgs handles -v flag and xml path in any order', () => {
  assert.deepEqual(parseArgs(['-v', '/path/to/config.xml']), {
    verbose: true,
    xmlPath: '/path/to/config.xml',
  });
  assert.deepEqual(parseArgs(['/path/to/config.xml']), {
    verbose: false,
    xmlPath: '/path/to/config.xml',
  });
});