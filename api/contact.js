// Formulaire de contact : envoie le message par email via Resend.
// Sur Vercel, ce fichier devient automatiquement la route POST /api/contact.
// Variables d'environnement (Vercel > Settings > Environment Variables) :
//   RESEND_API_KEY  (obligatoire)
//   CONTACT_TO      (facultatif, par défaut contactidentitestudio@gmail.com)
//   CONTACT_FROM    (facultatif, expéditeur sur un domaine vérifié dans Resend)

const TO = process.env.CONTACT_TO || 'contactidentitestudio@gmail.com';
const FROM = process.env.CONTACT_FROM || 'Identité Studio <noreply@fidelityapp.fr>';

// Anti-abus simple : 3 messages par heure et par adresse IP (par instance)
const hits = new Map();
function tooMany(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 3;
}

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 20000) throw new Error('too large');
    chunks.push(c);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Méthode non autorisée.' });

  let body;
  try {
    body = await readBody(req);
  } catch {
    return send(res, 400, { error: 'Requête invalide.' });
  }

  // Champ piège rempli par les robots : on fait semblant d'accepter
  if (str(body.website, 200)) return send(res, 200, { ok: true });

  const name = str(body.name, 120);
  const email = str(body.email, 320).toLowerCase();
  const phone = str(body.phone, 30);
  const subject = str(body.subject, 150);
  const message = str(body.message, 5000);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 2) {
    return send(res, 400, { error: 'Nom, email et message sont obligatoires.' });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  if (tooMany(ip)) {
    return send(res, 429, { error: 'Trop de messages en peu de temps. Écrivez-nous par email ou WhatsApp.' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('[contact] RESEND_API_KEY manquante');
    return send(res, 500, { error: "Le formulaire n'est pas encore configuré. Écrivez-nous par email." });
  }

  const text = [
    'Nouveau message depuis identitestudio.com',
    '',
    `De : ${name} <${email}>${phone ? ` — ${phone}` : ''}`,
    subject ? `Activité : ${subject}` : '',
    '',
    message,
    '',
    'Répondez directement à cet email pour lui écrire.',
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');

  const html = `
    <p style="color:#6b7280;font-size:13px">Nouveau message depuis identitestudio.com</p>
    <p><strong>${esc(name)}</strong> — <a href="mailto:${esc(email)}">${esc(email)}</a>${phone ? ` — ${esc(phone)}` : ''}</p>
    ${subject ? `<p><strong>Activité :</strong> ${esc(subject)}</p>` : ''}
    <p style="white-space:pre-wrap">${esc(message)}</p>
    <p style="color:#6b7280;font-size:13px">Répondez directement à cet email pour lui écrire.</p>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: `Nouveau message — ${name}${subject ? ` (${subject})` : ''}`,
        text,
        html,
      }),
    });
    if (!r.ok) {
      console.error('[contact] Resend', r.status, await r.text());
      return send(res, 502, { error: "Le message n'a pas pu être envoyé. Écrivez-nous par email ou WhatsApp." });
    }
  } catch (err) {
    console.error('[contact] erreur', err);
    return send(res, 502, { error: "Le message n'a pas pu être envoyé. Écrivez-nous par email ou WhatsApp." });
  }

  return send(res, 200, { ok: true });
};
