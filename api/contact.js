const RESEND_API_URL = 'https://api.resend.com/emails';

const serviceLabels = {
  validation: 'Idea Validation Sprint',
  design: 'UI / UX Design',
  mobile: 'Mobile App Development',
  web: 'Web Development',
  software: 'Custom Software Development',
  ai: 'AI & Automation',
  full: 'Full Build (Strategy to Launch)',
  other: 'Something else',
};

const budgetLabels = {
  under5k: 'Under $5,000',
  '5-15k': '$5,000 - $15,000',
  '15-50k': '$15,000 - $50,000',
  '50-150k': '$50,000 - $150,000',
  '150k+': '$150,000+',
  discuss: 'Prefer to discuss',
};

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function clean(value = '') {
  return String(value).trim().slice(0, 5000);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getPayload(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;

  try {
    return JSON.parse(req.body);
  } catch {
    return {};
  }
}

function buildHtml(data) {
  const rows = [
    ['Name', data.name],
    ['Email', data.email],
    ['Company / Startup', data.company || 'Not provided'],
    ['Phone', data.phone || 'Not provided'],
    ['Service', serviceLabels[data.service] || data.service],
    ['Budget', budgetLabels[data.budget] || data.budget || 'Not provided'],
  ];

  const detailRows = rows
    .map(([label, value]) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e5de;color:#6f6a5f;font-size:13px;">${escapeHtml(label)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e5de;color:#111009;font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
      </tr>
    `)
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;color:#111009;line-height:1.6;">
      <h1 style="font-size:24px;margin:0 0 16px;">New project enquiry</h1>
      <p style="margin:0 0 20px;color:#6f6a5f;">A client submitted the Aurora Systems contact form.</p>
      <table style="border-collapse:collapse;width:100%;max-width:640px;border:1px solid #e8e5de;">${detailRows}</table>
      <h2 style="font-size:16px;margin:28px 0 8px;">Project message</h2>
      <div style="white-space:pre-wrap;background:#faf9f7;border:1px solid #e8e5de;padding:16px;border-radius:8px;">${escapeHtml(data.message)}</div>
    </div>
  `;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || 'support@aurorasystems.co.zw';
  const fromEmail = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return res.status(500).json({ error: 'Email service is not configured.' });
  }

  const payload = getPayload(req);

  if (payload.website) {
    return res.status(200).json({ ok: true });
  }

  const data = {
    name: clean(payload.name),
    email: clean(payload.email),
    company: clean(payload.company),
    phone: clean(payload.phone),
    service: clean(payload.service),
    budget: clean(payload.budget),
    message: clean(payload.message),
  };

  if (!data.name || !isEmail(data.email) || !data.service || !data.message) {
    return res.status(400).json({ error: 'Please complete the required fields.' });
  }

  try {
    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: data.email,
        subject: `New project enquiry from ${data.name}`,
        html: buildHtml(data),
        text: [
          'New project enquiry',
          '',
          `Name: ${data.name}`,
          `Email: ${data.email}`,
          `Company / Startup: ${data.company || 'Not provided'}`,
          `Phone: ${data.phone || 'Not provided'}`,
          `Service: ${serviceLabels[data.service] || data.service}`,
          `Budget: ${budgetLabels[data.budget] || data.budget || 'Not provided'}`,
          '',
          'Project message:',
          data.message,
        ].join('\n'),
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      console.error('Resend failed:', error);
      return res.status(502).json({ error: 'We could not send your message. Please email support@aurorasystems.co.zw directly.' });
    }
  } catch (error) {
    console.error('Resend request failed:', error);
    return res.status(502).json({ error: 'We could not send your message. Please email support@aurorasystems.co.zw directly.' });
  }

  return res.status(200).json({ ok: true });
};
