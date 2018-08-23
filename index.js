import db from "@fly/data"
import proxy from "@fly/proxy"
import hostnameAPI from "./src/api"

const origin = proxy("https://example.glitch.me", { forwardHostHeader: true })

// HTTP entry point
fly.http.respondWith(async function (req) {
  const url = new URL(req.url);

  // this probably needs a dedicated hostname so we don't stomp on peoples' /api/ paths
  if (url.pathname.startsWith("/api/")) {
    return hostnameAPI(req)
  }

  // proxy to glitch if we can.
  return serveGlitchApp(req)
})

const fourOhFour = new Response("not found", { status: 404 })
async function serveGlitchApp(req) {
  console.log("Serving glitch app")
  const h = req.headers.get("host")
  if (!h) return fourOhFour

  // check to see if we know this hostname
  const record = await db.collection("hostnames").get(h)
  if (!record || !record.app_id) {
    console.error("hostname record not found:", h)
    return fourOhFour
  }

  // get domain from Glitch API
  const project = await getGlitchProject(record.app_id)
  if (!project) {
    console.error("Glitch project not found:", project)
    return fourOhFour
  }

  req.headers.set("X-Forwarded-Host", h)
  req.headers.set("Host", `${project.domain}.glitch.me`)

  // do proxying
  return origin(req)
}


// get Glitch Project from API
async function getGlitchProject(id) {
  const resp = await fetch(`https://api.glitch.com/projects/${id}`)
  if (!resp.status === 200) return null
  return await resp.json()
}