module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Datenschutzerklärung — Klarer Gewinn</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 14px; color: #333; max-width: 700px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  h2 { font-size: 16px; margin-top: 32px; margin-bottom: 8px; }
  a { color: #6C63FF; }
  .footer { margin-top: 60px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
</style>
</head>
<body>
<h1>Datenschutzerklärung</h1>
<p>Stand: Juni 2026</p>

<h2>1. Verantwortlicher</h2>
<p>
  Nathan Zinzan Goundar<br>
  Rheinstraße 84<br>
  65185 Wiesbaden<br>
  Deutschland<br>
  Telefon: +49 178 2074363<br>
  E-Mail: <a href="mailto:hello@klarergewinn.de">hello@klarergewinn.de</a>
</p>

<h2>2. Erhebung und Verarbeitung personenbezogener Daten</h2>
<p>Wir erheben und verarbeiten folgende personenbezogene Daten bei der Nutzung der App Klarer Gewinn:</p>
<ul>
  <li>E-Mail-Adresse (für die Registrierung und Anmeldung)</li>
  <li>Finanzdaten (Einnahmen und Ausgaben, die Sie selbst eingeben)</li>
  <li>Belegfotos (wenn Sie die Belegscan-Funktion nutzen)</li>
  <li>Rechnungs- und Angebotsdaten (Empfängername, Anschrift sowie Positionen, wenn Sie Rechnungen oder Angebote erstellen)</li>
  <li>Profil- und Unternehmensdaten (z. B. Firmenname, Anschrift, IBAN, Steuernummer — soweit Sie diese eingeben)</li>
  <li>Abonnement- und Zahlungsstatus (zur Verwaltung kostenpflichtiger Tarife)</li>
</ul>

<h2>3. Zweck der Datenverarbeitung</h2>
<p>Die erhobenen Daten werden ausschließlich zur Bereitstellung der Buchhaltungs-, Rechnungs- und Abonnementfunktionen der App verwendet. Eine Weitergabe an Dritte erfolgt nicht, mit Ausnahme der nachfolgend genannten Dienstleister.</p>

<h2>4. Dienstleister und Drittanbieter</h2>
<p>Wir nutzen folgende Drittanbieter zur Bereitstellung unserer Dienste:</p>
<ul>
  <li><strong>Supabase</strong> (Irland/EU) — Datenbankhosting und Authentifizierung. <a href="https://supabase.com/privacy" target="_blank">supabase.com/privacy</a></li>
  <li><strong>Vercel</strong> (USA) — Hosting der API-Endpunkte. <a href="https://vercel.com/legal/privacy-policy" target="_blank">vercel.com/legal/privacy-policy</a></li>
  <li><strong>Anthropic</strong> (USA) — KI-gestützte Funktionen (KI-Assistent und Belegscan). Bei der Belegscan-Funktion werden hochgeladene Belegbilder zur Datenextraktion an Anthropic übermittelt. <a href="https://www.anthropic.com/privacy" target="_blank">anthropic.com/privacy</a></li>
  <li><strong>Apple</strong> (USA) — Abwicklung von In-App-Käufen und Abonnements innerhalb der iOS-App. <a href="https://www.apple.com/legal/privacy/" target="_blank">apple.com/legal/privacy</a></li>
  <li><strong>RevenueCat</strong> (USA) — Verwaltung von In-App-Abonnements (iOS). <a href="https://www.revenuecat.com/privacy" target="_blank">revenuecat.com/privacy</a></li>
  <li><strong>Stripe</strong> (Irland/EU) — Zahlungsabwicklung ausschließlich für über die Website abgeschlossene Abonnements. <a href="https://stripe.com/privacy" target="_blank">stripe.com/privacy</a></li>
  <li><strong>Brevo</strong> (Sendinblue GmbH, EU) — Versand von E-Mail-Berichten (z. B. EÜR-Export). <a href="https://www.brevo.com/legal/privacypolicy/" target="_blank">brevo.com/legal/privacypolicy</a></li>
</ul>

<h2>5. Datenspeicherung, Sicherheit und Drittlandübermittlung</h2>
<p>Alle Nutzerdaten werden primär auf Servern in der Europäischen Union gespeichert (Supabase,
Region EU West — Irland, eu-west-1). Die Übertragung erfolgt verschlüsselt über HTTPS. Wir treffen
angemessene technische und organisatorische Maßnahmen zum Schutz Ihrer Daten.</p>
<p>Bei der Nutzung einzelner Funktionen werden Daten an Dienstleister mit Sitz in den USA
übermittelt (Vercel, Anthropic, Apple, RevenueCat — siehe Abschnitt 4). Diese Übermittlung
erfolgt auf Grundlage der EU-Standardvertragsklauseln (Standard Contractual Clauses) bzw.,
soweit zertifiziert, des EU-US Data Privacy Framework.</p>

<h2>6. Speicherdauer</h2>
<p>Ihre Daten werden grundsätzlich gespeichert, solange Sie ein aktives Konto bei Klarer Gewinn
haben. Nach Löschung Ihres Kontos werden personenbezogene Daten innerhalb von 30 Tagen gelöscht.</p>
<p><strong>Ausnahme — gesetzliche Aufbewahrungspflichten:</strong> Daten, die steuer- oder
handelsrechtlichen Aufbewahrungspflichten unterliegen (insbesondere Rechnungen, Belege und
buchhalterische Aufzeichnungen gemäß § 147 AO und den GoBD), werden für die gesetzlich
vorgeschriebene Dauer von bis zu 10 Jahren aufbewahrt und erst nach Ablauf dieser Frist gelöscht.
Dies gilt auch nach Löschung des Kontos und besteht unabhängig von einem Löschverlangen nach
Art. 17 DSGVO.</p>

<h2>7. Ihre Rechte</h2>
<p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
<ul>
  <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
  <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
  <li>Recht auf Löschung (Art. 17 DSGVO)</li>
  <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
  <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
  <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
</ul>
<p>Zur Ausübung Ihrer Rechte wenden Sie sich bitte an: <a href="mailto:hello@klarergewinn.de">hello@klarergewinn.de</a></p>

<h2>8. Beschwerderecht</h2>
<p>Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren. Die zuständige Behörde in Hessen ist der Hessische Beauftragte für Datenschutz und Informationsfreiheit: <a href="https://www.datenschutz.hessen.de" target="_blank">www.datenschutz.hessen.de</a></p>

<h2>9. Änderungen dieser Datenschutzerklärung</h2>
<p>Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen. Die aktuelle Version ist stets unter dieser URL abrufbar.</p>

<h2>10. KI-Assistent</h2>
<p>Der KI-Assistent verwendet die Claude API von Anthropic (Anthropic PBC, San Francisco, USA).
Anfragen an den KI-Assistenten werden zur Verarbeitung an Anthropic übermittelt.
Anthropic verarbeitet Daten gemäß ihrer Datenschutzrichtlinie:
<a href="https://www.anthropic.com/privacy" target="_blank">anthropic.com/privacy</a>.</p>
<p><strong>Wichtiger Hinweis:</strong> Der KI-Assistent ist kein zugelassener Steuerberater
und ersetzt keine steuerliche Beratung durch einen zertifizierten Fachmann. Angaben ohne Gewähr.</p>

<h2>11. Rechtsgrundlage — KI-Assistent und StBerG</h2>
<p>Die Nutzung des KI-Assistenten stellt keine Steuerberatung im Sinne des
Steuerberatungsgesetzes (StBerG) dar. Der Assistent liefert ausschließlich allgemeine
Informationen zu Buchhaltungs- und Steuerthemen. Für verbindliche steuerliche Auskünfte
wenden Sie sich bitte an einen zugelassenen Steuerberater.</p>

<h2>12. EU KI-Verordnung (AI Act)</h2>
<p>Gemäß EU KI-Verordnung (EU) 2024/1689 weisen wir darauf hin, dass Klarer Gewinn einen
KI-Assistenten einsetzt, der auf dem Sprachmodell Claude von Anthropic basiert.
Das System ist als allgemeines KI-Werkzeug eingestuft und fällt nicht unter die
Hochrisiko-Kategorie gemäß Anhang III der EU KI-Verordnung.</p>
<p>Zur Ausübung Ihrer Rechte wenden Sie sich bitte an:
<a href="mailto:hello@klarergewinn.de">hello@klarergewinn.de</a></p>

<div class="footer">
  <p>Klarer Gewinn — Buchhaltung für Selbstständige</p>
</div>
</body>
</html>`;

  return res.status(200).send(html);
};
