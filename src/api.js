
import db from "@fly/data"
import mount from "@fly/fetch/mount"

const routes = mount({
  "/api/hostnames": hostnamesAPI
})

export default async function api(req, init) {
  return routes(req, init)
}

// API endpoint for hostnames, proxies to Fly REST API + Adds stuff
// Use fly.io Token in `Authorization: Bearer [TOKEN]` header
async function hostnamesAPI(req, init) {
  const url = new URL(req.url);
  const path = url.pathname.substr(4) /* strip /api */
  if (path.match(/^\/hostnames\/[^\/]+$/)) {
    if (req.method === "GET") return getHostname(path, req)
    if (req.method === "DELETE") return deleteHostname(path, req)
  }
  if (path === "/hostnames" && req.method === "POST") {
    return createHostname(path, req)
  }
  return new Response("not found: " + path, { status: 404 })
}

/**
 * Creates a hostnames from post data like:
 * 
 * ```json
 * {
 *    "data":{
 *      "attributes": {
 *        "hostname": "testing10.waffles.fm",
 *        "glitch_app_id":"1e74c5ba-2935-4f96-bc21-6af0aa2ad8a2"
 *      }   
 *    }
 * }
 */
async function createHostname(path, req) {
  const record = await req.clone().json()
  const app_id = record.data.attributes.glitch_app_id
  if (!app_id) {
    return new Response("createHostname requires a glitch app id", { status: 422 })
  }
  const resp = await flyAPI(path, req)
  if (resp.status === 201) {
    await db.collection("hostnames").put(record.data.attributes.hostname, { app_id: app_id })
  }
  return stitchGlitch(resp)
}

/**
 * Gets a hostname from API, returns response like:
 * 
 * {
 *    "data": {
 *      "id": "testing10.waffles.fm",
 *      "type": "hostnames",
 *      "attributes": {
 *        "hostname": "testing10.waffles.fm",
 *        "preview_hostname": "719p1l02ukf58n5z.shw.io",
 *        "dns_configured": false,
 *        "glitch_app_id": "1e74c5ba-2935-4f96-bc21-6af0aa2ad8a2"
 *    }
 * }
 */
async function getHostname(path, req) {
  console.log("Getting hostname:", path)
  let resp = await flyAPI(path, req)
  if (resp.status === 200) {
    resp = await stitchGlitch(resp)
  }
  return resp
}

/**
 * Deletes a hostname, call with DELETE method
 */
async function deleteHostname(path, req) {
  const [, hostname] = path.split("/")
  const resp = await flyAPI(path, req)
  if (resp.status === 200) {
    await db.collection("hostnames").del(hostname)
  }
  return resp
}

/**
 * Adds glitch_app_id to hostname responses
 */
async function stitchGlitch(resp, hostname) {
  if (!resp.ok) return resp
  try {
    const record = await resp.json()
    console.log(resp.status, record)
    if (!hostname) {
      hostname = record.data.attributes.hostname
    }
    const meta = await db.collection("hostnames").get(hostname)
    console.log("hostname meta:", hostname, meta)
    if (meta) {
      record.data.attributes.glitch_app_id = meta.app_id
    }
    const body = JSON.stringify(record, null, "\t")
    resp = new Response(body, resp)
    resp.headers.set("content-length", body.length)
    return resp
  } catch (err) {
    console.error("Error stitching Glitch:", err)
    return resp
  }
}

/**
 * Proxies to Fly REST API
 */
const apiURL = new URL(app.config.flyAppEndpoint)
async function flyAPI(req, init) {
  if (typeof req === "string") {
    if (req.startsWith("/")) req = req.substring(1)
    console.log("fly API path: ", req)
    req = new Request(new URL(req, apiURL).toString(), init) // make a relative URL work
  }
  console.log(req.url)
  req.headers.delete('host')
  req.headers.delete('x-forwarded-host')
  req.headers.set("content-type", "application/json")
  return fetch(req)
}