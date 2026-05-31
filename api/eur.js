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
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const reportYear = year || new Date().getFullYear();

    const { data: income } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    const totalIncome = (income || []).reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalExpenses = (expenses || []).reduce((sum, r) => sum + (r.amount || 0), 0);
    const profit = totalIncome - totalExpenses;

    const fmt = (n) => n.toFixed(2).replace('.', ',') + ' €';
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('de-DE') : '-';

    let incomeRows = (income || []).map(r =>
      `<tr><td>${fmtDate(r.date)}</td><td>${r.source || '-'}</td><td>${r.note || '-'}</td><td style="text-align:right">${fmt(r.amount || 0)}</td></tr>`
    ).join('');

    let expenseRows = (expenses || []).map(r =>
      `<tr><td>${fmtDate(r.date)}</td><td>${r.category || '-'}</td><td>${r.note || '-'}</td><td style="text-align:right">${fmt(r.amount || 0)}</td></tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 40px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 14px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #f0f0f0; text-align: left; padding: 6px 8px; border: 1px solid #ccc; }
  td { padding: 5px 8px; border: 1px solid #ddd; }
  .summary { margin-top: 24px; border: 2px solid #000; padding: 16px; }
  .summary table { margin: 0; }
  .summary td { border: none; padding: 4px 8px; }
  .total { font-weight: bold; font-size: 14px; }
  .footer { margin-top: 40px; font-size: 10px; color: #666; }
</style>
</head>
<body>
<h1>Einnahmenüberschussrechnung (EÜR)</h1>
<p>Steuerjahr: <strong>${reportYear}</strong> &nbsp;|&nbsp; Erstellt am: <strong>${new Date().toLocaleDateString('de-DE')}</strong></p>
<p>Erstellt mit <strong>Klarer Gewinn</strong></p>

<h2>Einnahmen</h2>
<table>
  <thead><tr><th>Datum</th><th>Quelle</th><th>Notiz</th><th style="text-align:right">Betrag</th></tr></thead>
  <tbody>${incomeRows || '<tr><td colspan="4">Keine Einnahmen</td></tr>'}</tbody>
  <tfoot><tr><td colspan="3"><strong>Gesamt Einnahmen</strong></td><td style="text-align:right"><strong>${fmt(totalIncome)}</strong></td></tr></tfoot>
</table>

<h2>Ausgaben</h2>
<table>
  <thead><tr><th>Datum</th><th>Kategorie</th><th>Notiz</th><th style="text-align:right">Betrag</th></tr></thead>
  <tbody>${expenseRows || '<tr><td colspan="4">Keine Ausgaben</td></tr>'}</tbody>
  <tfoot><tr><td colspan="3"><strong>Gesamt Ausgaben</strong></td><td style="text-align:right"><strong>${fmt(totalExpenses)}</strong></td></tr></tfoot>
</table>

<div class="summary">
  <h2 style="border:none;margin-top:0">Zusammenfassung</h2>
  <table>
    <tr><td>Gesamteinnahmen</td><td style="text-align:right">${fmt(totalIncome)}</td></tr>
    <tr><td>Gesamtausgaben</td><td style="text-align:right">- ${fmt(totalExpenses)}</td></tr>
    <tr class="total"><td><strong>Gewinn / Verlust</strong></td><td style="text-align:right"><strong>${fmt(profit)}</strong></td></tr>
  </table>
</div>

<div class="footer">
  <p>Dieses Dokument wurde automatisch erstellt und dient als Übersicht. Bitte prüfen Sie die Angaben mit Ihrem Steuerberater.</p>
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
