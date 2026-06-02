const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dajqkdztttavidnpijda.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const userId = req.body?.userId || req.query?.userId;
    const year = req.body?.year || req.query?.year;
    const steuernummer = req.body?.steuernummer || req.query?.steuernummer || '';
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const reportYear = year || new Date().getFullYear();

    const { data: income } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', userId)
      .order('payment_date', { ascending: true });

    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    const totalIncome = (income || []).reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalExpenses = (expenses || []).reduce((sum, r) => sum + (r.amount || 0), 0);
    const profit = totalIncome - totalExpenses;

    const fmt = (n) => n.toFixed(2).replace('.', ',') + ' €';
    const fmtDate = (d) => {
      if (!d) return '-';
      try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('de-DE');
      } catch(e) { return '-'; }
    };

    const categoryOrder = [
      'Waren / Rohstoffe / Hilfsstoffe',
      'Versandkosten',
      'Etsy-Gebühren',
      'Werbekosten / Marketing',
      'Büromaterial / Arbeitsmittel',
      'Telefon / Internet',
      'Reisekosten / Fahrtkosten',
      'Miete / Pacht',
      'Versicherungen',
      'Bankgebühren',
      'Fortbildungskosten',
      'Abschreibungen (AfA)',
      'Sonstige Betriebsausgaben'
    ];

    const grouped = {};
    (expenses || []).forEach(r => {
      const cat = r.category || 'Sonstige Betriebsausgaben';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(r);
    });

    let expenseRows = '';
    let categorySummaryRows = '';
    const usedCategories = [...new Set([
      ...categoryOrder.filter(c => grouped[c]),
      ...Object.keys(grouped).filter(c => !categoryOrder.includes(c))
    ])];

    usedCategories.forEach(cat => {
      const rows = grouped[cat] || [];
      const catTotal = rows.reduce((sum, r) => sum + (r.amount || 0), 0);
      expenseRows += `<tr style="background:#f5f5f5"><td colspan="5"><strong>${cat}</strong></td></tr>`;
      rows.forEach(r => {
        expenseRows += `<tr><td>${r.beleg_nr || '-'}</td><td>${fmtDate(r.date)}</td><td>${r.category || '-'}</td><td>${r.note || '-'}</td><td style="text-align:right">${fmt(r.amount || 0)}</td></tr>`;
      });
      expenseRows += `<tr style="background:#fafafa"><td colspan="4" style="text-align:right"><em>Summe ${cat}</em></td><td style="text-align:right"><em>${fmt(catTotal)}</em></td></tr>`;
      categorySummaryRows += `<tr><td>${cat}</td><td style="text-align:right">${fmt(catTotal)}</td></tr>`;
    });

    const incomeRows = (income || []).map(r =>
      `<tr><td>${r.beleg_nr || '-'}</td><td>${fmtDate(r.date)}</td><td>${fmtDate(r.payment_date)}</td><td>${r.source || '-'}</td><td>${r.note || '-'}</td><td style="text-align:right">${fmt(r.amount || 0)}</td></tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 40px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 14px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 4px; }
  h3 { font-size: 12px; margin-top: 16px; margin-bottom: 4px; color: #333; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #f0f0f0; text-align: left; padding: 6px 8px; border: 1px solid #ccc; }
  td { padding: 5px 8px; border: 1px solid #ddd; }
  .summary { margin-top: 24px; border: 2px solid #000; padding: 16px; }
  .summary table { margin: 0; }
  .summary td { border: none; padding: 4px 8px; }
  .total { font-weight: bold; font-size: 14px; }
  .footer { margin-top: 40px; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 12px; }
  .cat-summary { margin-top: 24px; border: 1px solid #ccc; padding: 12px; background: #fafafa; }
</style>
</head>
<body>
<h1>Einnahmenüberschussrechnung (EÜR)</h1>
<p>Steuerjahr: <strong>${reportYear}</strong> &nbsp;|&nbsp; Erstellt am: <strong>${new Date().toLocaleDateString('de-DE')}</strong></p>
${steuernummer ? `<p>Steuernummer: <strong>${steuernummer}</strong></p>` : ''}
<p>Erstellt mit <strong>Klarer Gewinn</strong></p>
<p style="font-size:11px; color:#444;">Alle Beträge gemäß Kleinunternehmerregelung nach §19 UStG ohne Umsatzsteuer. Einnahmen nach Zahlungseingangsdatum (Zu- und Abflussprinzip § 11 EStG).</p>

<h2>Betriebseinnahmen</h2>
<table>
  <thead><tr><th>Beleg-Nr.</th><th>Rechnungsdatum</th><th>Zahlungsdatum</th><th>Quelle</th><th>Notiz</th><th style="text-align:right">Betrag</th></tr></thead>
  <tbody>${incomeRows || '<tr><td colspan="6">Keine Einnahmen</td></tr>'}</tbody>
  <tfoot><tr><td colspan="5"><strong>Gesamt Betriebseinnahmen</strong></td><td style="text-align:right"><strong>${fmt(totalIncome)}</strong></td></tr></tfoot>
</table>

<h2>Betriebsausgaben</h2>
<table>
  <thead><tr><th>Beleg-Nr.</th><th>Datum</th><th>Kategorie</th><th>Notiz</th><th style="text-align:right">Betrag</th></tr></thead>
  <tbody>${expenseRows || '<tr><td colspan="5">Keine Ausgaben</td></tr>'}</tbody>
  <tfoot><tr><td colspan="4"><strong>Gesamt Betriebsausgaben</strong></td><td style="text-align:right"><strong>${fmt(totalExpenses)}</strong></td></tr></tfoot>
</table>

<div class="cat-summary">
  <h2 style="border:none;margin-top:0">Ausgaben nach Kategorien (Anlage EÜR)</h2>
  <table>
    <thead><tr><th>Kategorie</th><th style="text-align:right">Summe</th></tr></thead>
    <tbody>${categorySummaryRows}</tbody>
    <tfoot><tr><td><strong>Gesamt</strong></td><td style="text-align:right"><strong>${fmt(totalExpenses)}</strong></td></tr></tfoot>
  </table>
</div>

<div class="summary">
  <h2 style="border:none;margin-top:0">Zusammenfassung</h2>
  <table>
    <tr><td>Gesamteinnahmen</td><td style="text-align:right">${fmt(totalIncome)}</td></tr>
    <tr><td>Gesamtausgaben</td><td style="text-align:right">- ${fmt(totalExpenses)}</td></tr>
    <tr class="total"><td><strong>Gewinn / Verlust</strong></td><td style="text-align:right"><strong>${fmt(profit)}</strong></td></tr>
  </table>
</div>

<div class="footer">
  <p>Alle Beträge gemäß Kleinunternehmerregelung nach §19 UStG ohne Umsatzsteuer.</p>
  <p>Einnahmen werden nach dem Zahlungseingangsdatum erfasst (Zu- und Abflussprinzip gemäß § 11 EStG).</p>
  <p>Dieses Dokument wurde automatisch mit Klarer Gewinn erstellt und dient als Übersicht der Betriebseinnahmen und -ausgaben. Bitte prüfen Sie alle Angaben mit Ihrem Steuerberater vor der Einreichung beim Finanzamt.</p>
  <p>Seite 1 &nbsp;|&nbsp; Erstellt am ${new Date().toLocaleDateString('de-DE')} &nbsp;|&nbsp; Klarer Gewinn</p>
</div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="EUR_${reportYear}.html"`);
    return res.status(200).send(html);

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
