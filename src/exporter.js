const fs = require('fs/promises');
const { parseConfigXml } = require('./parser');

async function exportXmlToRedis({ xmlPath, redisClient, verbose = false, logger = console.log }) {
  const xmlContent = await fs.readFile(xmlPath, 'utf-8');
  const { subdomains, cookies } = parseConfigXml(xmlContent);

  const savedKeys = [];

  await redisClient.set('subdomains', JSON.stringify(subdomains));
  savedKeys.push('subdomains');

  for (const cookie of cookies) {
    await redisClient.set(cookie.key, cookie.value);
    savedKeys.push(cookie.key);
  }

  if (verbose) {
    for (const key of savedKeys) {
      logger(key);
    }
  }

  return savedKeys;
}

module.exports = { exportXmlToRedis };