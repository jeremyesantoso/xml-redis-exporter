const path = require('path');
const Redis = require('ioredis');
const { exportXmlToRedis } = require('./exporter');

function parseArgs(argv) {
  let verbose = false;
  let xmlPath = null;

  for (const arg of argv) {
    if (arg === '-v') {
      verbose = true;
    } else if (!arg.startsWith('-')) {
      xmlPath = arg;
    }
  }

  return { verbose, xmlPath };
}

async function main() {
  const { verbose, xmlPath } = parseArgs(process.argv.slice(2));

  if (!xmlPath) {
    console.error('Usage: export.sh [-v] /path/to/xml');
    process.exit(1);
  }

  const resolvedPath = path.resolve(xmlPath);
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT || 6379),
  });

  try {
    await exportXmlToRedis({ xmlPath: resolvedPath, redisClient: redis, verbose });
  } catch (err) {
    console.error(`Export failed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    redis.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseArgs };