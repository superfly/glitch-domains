# Glitch Custom Domains

This is an edge app that provides an API for adding custom domains + Glitch App ID mappings, and proxies traffic from those domains to Glitch.

## Run it Locally

You'll need an API token from fly.io's Web UI.

```bash
git clone https://github.com/superfly/glitch-domains.git
npm install -g @fly/fly
cd glitch-domains
fly server
```

## API

### Get a Hostname

```bash
curl -H "Content-Type: application/json" https://glitch-dev.edgeapp.net/api/hostnames/testing10.waffles.fm -D - -H "Authorization: Bearer [TOKEN]"
```

```json
{
	"data": {
		"id": "testing10.waffles.fm",
		"type": "hostnames",
		"attributes": {
			"hostname": "testing10.waffles.fm",
			"preview_hostname": "719p1l02ukf58n5z.shw.io",
			"dns_configured": false,
			"glitch_app_id": "1e74c5ba-2935-4f96-bc21-6af0aa2ad8a2"
		}
	}

```

### Create a hostname

```bash
➜  glitch git:(master) ✗ curl -H "Content-Type: application/json" -X POST -d '{"data": { "attributes": { "hostname": "testing10.waffles.fm", "glitch_app_id":"1e74c5ba-2935-4f96-bc21-6af0aa2ad8a2" } } }' http://localhost:3000/api/hostnames -D - -H "Authorization: Bearer [TOKEN]"
```

```json
{
	"data": {
		"id": "testing10.waffles.fm",
		"type": "hostnames",
		"attributes": {
			"hostname": "testing10.waffles.fm",
			"preview_hostname": "719p1l02ukf58n5z.shw.io",
			"dns_configured": false,
			"glitch_app_id": "1e74c5ba-2935-4f96-bc21-6af0aa2ad8a2"
		}
  }
```