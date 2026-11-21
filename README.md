# XML to Redis Exporter

Node.js CLI tool and Docker Compose setup to parse an XML configuration file and export `subdomains` and `cookie:<name>:<host>` keys into Redis.

## Usage

```bash
docker compose up -d --build
docker compose exec app ./export.sh -v /app/config.xml
docker compose exec app npm test