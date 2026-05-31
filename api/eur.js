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
  th { backgroun
