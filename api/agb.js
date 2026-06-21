module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AGB — Klarer Gewinn</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 14px; color: #333; max-width: 700px; margin: 40px auto; padding: 0 20px; line-height: 1.7; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  h2 { font-size: 15px; margin-top: 32px; margin-bottom: 8px; color: #111; font-weight: 700; }
  p, li { margin-bottom: 8px; }
  a { color: #6C63FF; }
  .notice { background: #f9f9f9; border-left: 3px solid #6C63FF; padding: 12px 16px; margin: 20px 0; font-size: 13px; }
  .footer { margin-top: 60px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
</style>
</head>
<body>
<h1>Allgemeine Geschäftsbedingungen (AGB)</h1>
<p>Klarer Gewinn — Stand: Juni 2026</p>

<h2>§ 1 Geltungsbereich</h2>
<p>Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") gelten für alle Verträge zwischen</p>
<p>
  Nathan Zinzan Goundar<br>
  Rheinstraße 84, 65185 Wiesbaden<br>
  E-Mail: <a href="mailto:hello@klarergewinn.de">hello@klarergewinn.de</a>
</p>
<p>(nachfolgend „Anbieter") und dem Nutzer der App und Website „Klarer Gewinn" (nachfolgend „Nutzer").</p>
<p>Entgegenstehende oder abweichende Bedingungen des Nutzers werden nicht anerkannt, es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.</p>

<h2>§ 2 Leistungsbeschreibung</h2>
<p>Klarer Gewinn ist eine mobile Buchhaltungsanwendung für Selbstständige und Kleinunternehmer. Die App bietet folgende Leistungen:</p>
<ul>
  <li><strong>Free-Tarif:</strong> Erfassung von Einnahmen und Ausgaben, Dashboard, Steuerrechner</li>
  <li><strong>Pro-Tarif:</strong> Zusätzlich KI-gestützter Belegscanner (GoBD-konform), KI-Assistent, EÜR-Export, automatische E-Mail-Berichte</li>
  <li><strong>Business-Tarif:</strong> Zusätzlich Rechnungs- und Angebotserstellung, Fahrtenbuch, Verwaltung mehrerer Betriebe. (DATEV-Export in Vorbereitung.)</li>
</ul>
<p>Der KI-Assistent liefert allgemeine Informationen zu Buchhaltungs- und Steuerthemen. Er stellt keine Steuerberatung im Sinne des Steuerberatungsgesetzes (StBerG) dar.</p>

<h2>§ 3 Vertragsschluss und Laufzeit</h2>
<p>Der Vertrag kommt durch die Registrierung in der App und ggf. den Abschluss eines kostenpflichtigen Abonnements zustande. Die kostenlose Free-Version ist ohne zeitliche Befristung nutzbar.</p>
<p>Kostenpflichtige Abonnements (Pro, Business) werden auf monatlicher oder jährlicher Basis abgeschlossen. Das Abonnement verlängert sich automatisch, wenn es nicht rechtzeitig gekündigt wird.</p>

<h2>§ 4 Preise und Zahlung</h2>
<p>Die aktuellen Preise für die kostenpflichtigen Tarife sind in der App und auf der Website einsehbar:</p>
<ul>
  <li><strong>Pro monatlich:</strong> €9,99/Monat</li>
  <li><strong>Pro jährlich:</strong> €99/Jahr</li>
  <li><strong>Business monatlich:</strong> €27,99/Monat</li>
  <li><strong>Business jährlich:</strong> €279/Jahr</li>
</ul>
<p>Alle Preise sind Endpreise. Als Kleinunternehmer gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen.</p>
<p><strong>Abonnements innerhalb der iOS-App</strong> werden über Apple (App Store / In-App-Kauf) abgeschlossen und abgerechnet. Es gelten die Zahlungs- und Abonnementbedingungen von Apple. Maßgeblich ist der zum Zeitpunkt des Kaufs im App Store angezeigte Preis. Die Zahlung wird über das im Apple-Konto hinterlegte Zahlungsmittel abgewickelt.</p>
<p><strong>Abonnements über die Website</strong> werden über Stripe (Stripe Payments Europe Limited, Irland) abgerechnet. Akzeptierte Zahlungsmethoden: Kreditkarte, SEPA-Lastschrift. Es gelten ergänzend die Zahlungsbedingungen von Stripe.</p>
<p>Bei jährlichen Abonnements wird der Gesamtbetrag zu Beginn der Laufzeit fällig.</p>

<h2>§ 5 Widerrufsrecht</h2>
<p>Verbraucher haben das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt 14 Tage ab dem Tag des Vertragsabschlusses.</p>
<p>Um das Widerrufsrecht auszuüben, ist eine eindeutige Erklärung gegenüber dem Anbieter erforderlich (z. B. per E-Mail an hello@klarergewinn.de mit dem Betreff „Widerruf Abonnement").</p>
<p><strong>Erlöschen des Widerrufsrechts:</strong> Das Widerrufsrecht erlischt vorzeitig, wenn die Ausführung des Vertrags begonnen hat und der Nutzer ausdrücklich zugestimmt hat, dass mit der Ausführung begonnen wird, und bestätigt hat, dass er sein Widerrufsrecht mit Beginn der Ausführung verliert (§ 356 Abs. 5 BGB).</p>

<h2>§ 6 Kündigung</h2>
<p>Monatliche Abonnements können jederzeit zum Ende des jeweiligen Abrechnungsmonats gekündigt werden. Jährliche Abonnements können jederzeit zum Ende des Vertragsjahres gekündigt werden.</p>
<p>Die Kündigung erfolgt über:</p>
<ul>
  <li>iOS: Einstellungen → Apple-ID → Abonnements → Klarer Gewinn → Abonnement kündigen</li>
  <li>App: Einstellungen → Abonnement → Abonnement verwalten</li>
  <li>E-Mail: hello@klarergewinn.de</li>
</ul>
<p>Nach der Kündigung steht der kostenpflichtige Tarif bis zum Ende der bezahlten Periode zur Verfügung.</p>

<h2>§ 7 Haftungsbeschränkung</h2>
<p>Der Anbieter haftet nur für Schäden, die auf Vorsatz oder grober Fahrlässigkeit beruhen. Die Haftung für leichte Fahrlässigkeit ist — soweit gesetzlich zulässig — ausgeschlossen.</p>
<p>Insbesondere haftet der Anbieter nicht für:</p>
<ul>
  <li>Die Richtigkeit von Steuerberechnungen oder Steuerhinweisen in der App</li>
  <li>Schäden, die durch Fehler in KI-generierten Antworten entstehen</li>
  <li>Datenverlust durch technische Störungen oder höhere Gewalt</li>
  <li>Schäden durch fehlerhafte Eingaben des Nutzers</li>
</ul>

<h2>§ 8 Datenschutz</h2>
<p>Die Erhebung und Verarbeitung personenbezogener Daten erfolgt gemäß der
<a href="https://klarergewinn.de/datenschutz">Datenschutzerklärung</a> des Anbieters.</p>

<h2>§ 9 KI-Assistent — Haftungsausschluss</h2>
<div class="notice">
  <p><strong>Wichtiger Hinweis:</strong></p>
  <p>Der KI-Assistent in Klarer Gewinn stellt keine Steuerberatung im Sinne des
  Steuerberatungsgesetzes (StBerG) dar. Die durch den KI-Assistenten bereitgestellten
  Informationen dienen ausschließlich der allgemeinen Information und ersetzen keine
  individuelle Beratung durch einen zugelassenen Steuerberater.</p>
  <p>Für die Richtigkeit, Vollständigkeit und Aktualität der durch den KI-Assistenten
  generierten Antworten wird keine Haftung übernommen. Angaben ohne Gewähr.</p>
  <p>Für verbindliche steuerliche Auskünfte wenden Sie sich an einen zugelassenen
  Steuerberater oder Ihr zuständiges Finanzamt.</p>
</div>

<h2>§ 10 Anwendbares Recht</h2>
<p>Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts (CISG). Zwingende Verbraucherschutzvorschriften des Landes, in dem der Verbraucher seinen gewöhnlichen Aufenthalt hat, bleiben unberührt.</p>

<h2>§ 11 Gerichtsstand</h2>
<p>Sofern der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist, ist ausschließlicher Gerichtsstand für alle Streitigkeiten aus diesem Vertrag Wiesbaden.</p>
<p>Gegenüber Verbrauchern gilt als Gerichtsstand der Wohnsitz des Verbrauchers.</p>

<h2>§ 12 Schlussbestimmungen</h2>
<p>Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, so berührt dies die Wirksamkeit der übrigen Bestimmungen nicht. An die Stelle unwirksamer Bestimmungen tritt die gesetzliche Regelung.</p>
<p>Änderungen dieser AGB werden dem Nutzer per E-Mail oder In-App-Benachrichtigung mitgeteilt. Widerspricht der Nutzer nicht innerhalb von 30 Tagen nach Benachrichtigung, gelten die geänderten AGB als akzeptiert.</p>
<p>Der Anbieter behält sich vor, den Dienst jederzeit einzustellen. In diesem Fall werden Nutzer mit aktiven Abonnements anteilig erstattet.</p>

<div class="footer">
  <p>Klarer Gewinn — Buchhaltung für Selbstständige · <a href="https://klarergewinn.de">klarergewinn.de</a> · <a href="https://klarergewinn.de/impressum">Impressum</a> · <a href="https://klarergewinn.de/datenschutz">Datenschutz</a></p>
</div>
</body>
</html>`;

  return res.status(200).send(html);
};
