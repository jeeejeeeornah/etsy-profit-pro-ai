module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Impressum — Klarer Gewinn</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 14px; color: #333; max-width: 700px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  h2 { font-size: 16px; margin-top: 32px; margin-bottom: 8px; color: #111; }
  a { color: #6C63FF; }
  .notice { background: #f9f9f9; border-left: 3px solid #6C63FF; padding: 12px 16px; margin: 20px 0; font-size: 13px; }
  .footer { margin-top: 60px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
</style>
</head>
<body>
<h1>Impressum</h1>

<h2>Angaben gemäß § 5 TMG</h2>
<p>
  Nathan Zinzan Goundar<br>
  Rheinstraße 84<br>
  65185 Wiesbaden<br>
  Deutschland
</p>

<h2>Kontakt</h2>
<p>
  Telefon: +49 178 2074363<br>
  E-Mail: <a href="mailto:hello@klarergewinn.de">hello@klarergewinn.de</a>
</p>

<h2>Umsatzsteuer</h2>
<p>
  Kleinunternehmer gemäß § 19 UStG — Es wird keine Umsatzsteuer berechnet.<br>
  Steuer-Nr.: 10984625704
</p>

<h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
<p>
  Nathan Zinzan Goundar<br>
  Rheinstraße 84<br>
  65185 Wiesbaden<br>
  Deutschland
</p>

<h2>Hinweis KI-Assistent</h2>
<div class="notice">
  Der in der App verwendete KI-Assistent stellt keine Steuerberatung im Sinne des
  Steuerberatungsgesetzes (StBerG) dar. Die Funktion dient ausschließlich der allgemeinen
  Information zu Buchhaltungs- und Steuerthemen. Für verbindliche steuerliche Auskünfte
  wenden Sie sich an einen zugelassenen Steuerberater.
</div>

<h2>Streitschlichtung</h2>
<p>
  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:<br>
  <a href="https://ec.europa.eu/consumers/odr/" target="_blank">https://ec.europa.eu/consumers/odr/</a>
</p>
<p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
Verbraucherschlichtungsstelle teilzunehmen.</p>

<h2>Haftung für Inhalte</h2>
<p>Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten
nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
Tätigkeit hinweisen.</p>

<h2>Haftung für Links</h2>
<p>Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
Seiten verantwortlich.</p>

<div class="footer">
  <p>Klarer Gewinn — Buchhaltung für Selbstständige · <a href="https://klarergewinn.de">klarergewinn.de</a></p>
</div>
</body>
</html>`;

  return res.status(200).send(html);
};
