// Relais vers l'API PVGIS (JRC, Commission européenne).
// PVGIS refuse les appels faits directement depuis une page web : ce relais les fait côté serveur.
// Fonction Vercel : GET /api/pvgis?lat=..&lon=..&angle=..&aspect=..&loss=..
// Aussi utilisée par le serveur autonome (server.js).
const BASE = process.env.PVGIS_BASE || 'https://re.jrc.ec.europa.eu/api';
const VERSIONS = ['v5_3', 'v5_2'];
const cache = new Map(); // cache mémoire (le temps de vie du processus)

function num(v, min, max, def) {
  if (v === undefined || v === null || v === '') return def;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

// query : objet de paramètres -> { status, body }
async function pvgis(query) {
  if (query.ping) return { status: 200, body: { ok: true } };
  const lat = num(query.lat, -90, 90);
  const lon = num(query.lon, -180, 180);
  const angle = num(query.angle, 0, 90, 0);
  const aspect = num(query.aspect, -180, 180, 0); // 0 = sud, -90 = est, 90 = ouest
  const loss = num(query.loss, 0, 50, 14);
  if ([lat, lon, angle, aspect, loss].some(v => v === null || v === undefined)) {
    return { status: 400, body: { error: 'Paramètres invalides (lat, lon, angle, aspect, loss).' } };
  }
  const params = new URLSearchParams({
    lat: lat.toFixed(4), lon: lon.toFixed(4), peakpower: '1', loss: String(loss),
    angle: String(Math.round(angle)), aspect: String(Math.round(aspect)),
    mountingplace: 'free', outputformat: 'json'
  });
  const key = params.toString();
  if (cache.has(key)) return { status: 200, body: cache.get(key) };

  let lastError = 'PVGIS injoignable.';
  for (const v of VERSIONS) {
    try {
      const r = await fetch(`${BASE}/${v}/PVcalc?${params}`, { headers: { Accept: 'application/json' } });
      const txt = await r.text();
      if (r.status === 404) { lastError = `Version ${v} indisponible.`; continue; }
      let j = null; try { j = JSON.parse(txt); } catch (e) { /* réponse non JSON */ }
      if (!r.ok) {
        const msg = (j && (j.message || j.error)) || txt.slice(0, 200);
        return { status: r.status === 400 ? 400 : 502, body: { error: 'PVGIS : ' + msg } };
      }
      const monthly = j.outputs.monthly.fixed.map(m => m.E_m); // kWh/kWc par mois
      const body = {
        version: v,
        monthly,
        yearly: j.outputs.totals.fixed.E_y,
        database: j.inputs && j.inputs.meteo_data ? j.inputs.meteo_data.radiation_db : null
      };
      cache.set(key, body);
      return { status: 200, body };
    } catch (e) { lastError = 'PVGIS injoignable : ' + e.message; }
  }
  return { status: 502, body: { error: lastError } };
}

// Point d'entrée Vercel
module.exports = async (req, res) => {
  const query = req.query || {};
  const { status, body } = await pvgis(query);
  if (status === 200 && !query.ping) res.setHeader('Cache-Control', 'public, s-maxage=2592000, stale-while-revalidate=86400');
  res.status(status).json(body);
};
module.exports.pvgis = pvgis;
