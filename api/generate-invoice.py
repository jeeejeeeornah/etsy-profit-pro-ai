"""
Vercel Python serverless function — ZUGFeRD EN16931 invoice generator.
POST /api/generate-invoice  →  application/pdf

Generation logic is identical to the Mustang-validated create-invoice.py:
  - reportlab TTF PDF + pypdf OutputIntent for PDF/A-3b
  - hand-crafted CII XML with BR-CO-25 (due date) and BR-CO-26 (seller ID)
  - factur-x embed with XSD + schematron validation

Fonts: Bitstream Vera (Vera.ttf / VeraBd.ttf) bundled with reportlab.
  License: freely redistributable and embeddable in commercial software.
  See reportlab/fonts/bitstream-vera-license.txt.
ICC profile: api/assets/sRGB.icc (path relative to this file).
"""

from http.server import BaseHTTPRequestHandler
import json, sys, io, os, html, traceback
from datetime import datetime

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from pypdf import PdfReader, PdfWriter
from pypdf.generic import (
    ArrayObject, DictionaryObject, DecodedStreamObject,
    NameObject, NumberObject, create_string_object,
)

import facturx
import reportlab.fonts as _rl_fonts_pkg

# ── Asset paths (all relative — no system-path fallbacks) ─────────────────────

_HERE       = os.path.dirname(os.path.abspath(__file__))
_RL_FONTS   = os.path.dirname(_rl_fonts_pkg.__file__)

ICC_PROFILE = os.path.join(_HERE, 'assets', 'sRGB.icc')
SANS_REG    = os.path.join(_RL_FONTS, 'Vera.ttf')    # Bitstream Vera Sans
SANS_BOLD   = os.path.join(_RL_FONTS, 'VeraBd.ttf')  # Bitstream Vera Sans Bold

# ── Constants ──────────────────────────────────────────────────────────────────

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

VAT_EXEMPTION = 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.'

_fonts_registered = False


# ── Helpers ────────────────────────────────────────────────────────────────────

def _iso_to_xml(iso):
    """'2025-06-14' → '20250614'"""
    return datetime.fromisoformat(iso).strftime('%Y%m%d')

def _iso_to_display(iso):
    return datetime.fromisoformat(iso).strftime('%d.%m.%Y')

def _e(s):
    return html.escape(str(s), quote=False)

def _fmt(v):
    return f'{float(v):.2f}'


# ── XML builder ────────────────────────────────────────────────────────────────

def build_xml(d):
    seller   = d['seller']
    buyer    = d['buyer']
    inv      = d['invoice']
    items    = d['line_items']
    currency = inv.get('currency', 'EUR')

    issue_dt = _iso_to_xml(inv['date'])
    due_dt   = _iso_to_xml(inv['due_date'])

    line_totals = [round(float(i['quantity']) * float(i['unit_price']), 2) for i in items]
    net_total   = round(sum(line_totals), 2)

    lines_xml = ''
    for idx, (item, lt) in enumerate(zip(items, line_totals), 1):
        lines_xml += f"""
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>{idx}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>{_e(item['description'])}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>{_fmt(item['unit_price'])}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="{_e(item['unit'])}">{_fmt(item['quantity'])}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>E</ram:CategoryCode>
          <ram:RateApplicablePercent>0</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>{_fmt(lt)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>"""

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">

  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <rsm:ExchangedDocument>
    <ram:ID>{_e(inv['number'])}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">{issue_dt}</udt:DateTimeString>
    </ram:IssueDateTime>
    <ram:IncludedNote>
      <ram:Content>{_e(VAT_EXEMPTION)}</ram:Content>
    </ram:IncludedNote>
  </rsm:ExchangedDocument>

  <rsm:SupplyChainTradeTransaction>
{lines_xml}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:ID>{_e(seller['registration_id'])}</ram:ID>
        <ram:Name>{_e(seller['name'])}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>{_e(seller['zip'])}</ram:PostcodeCode>
          <ram:LineOne>{_e(seller['address'])}</ram:LineOne>
          <ram:CityName>{_e(seller['city'])}</ram:CityName>
          <ram:CountryID>{_e(seller['country'])}</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="FC">{_e(seller['tax_number'])}</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>{_e(buyer['name'])}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>{_e(buyer['zip'])}</ram:PostcodeCode>
          <ram:LineOne>{_e(buyer['address'])}</ram:LineOne>
          <ram:CityName>{_e(buyer['city'])}</ram:CityName>
          <ram:CountryID>{_e(buyer['country'])}</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>

    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">{issue_dt}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>

    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>{_e(currency)}</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>0.00</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:ExemptionReason>{_e(VAT_EXEMPTION)}</ram:ExemptionReason>
        <ram:BasisAmount>{_fmt(net_total)}</ram:BasisAmount>
        <ram:CategoryCode>E</ram:CategoryCode>
        <ram:RateApplicablePercent>0</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">{due_dt}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>{_fmt(net_total)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>{_fmt(net_total)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="{_e(currency)}">0.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>{_fmt(net_total)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>{_fmt(net_total)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>

  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
""".encode('utf-8')


# ── PDF/A-3b base builder ──────────────────────────────────────────────────────

def build_base_pdf(d):
    global _fonts_registered
    if not _fonts_registered:
        pdfmetrics.registerFont(TTFont('Sans',      SANS_REG))
        pdfmetrics.registerFont(TTFont('Sans-Bold', SANS_BOLD))
        _fonts_registered = True

    seller = d['seller']
    buyer  = d['buyer']
    inv    = d['invoice']
    items  = d['line_items']

    buf = io.BytesIO()
    c   = canvas.Canvas(buf, pagesize=A4)
    W, H = A4

    def text(x_mm, y_mm, s, bold=False, size=10):
        c.setFont('Sans-Bold' if bold else 'Sans', size)
        c.drawString(x_mm * mm, H - y_mm * mm, str(s))

    def rtext(x_mm, y_mm, s, bold=False, size=10):
        c.setFont('Sans-Bold' if bold else 'Sans', size)
        c.drawRightString(x_mm * mm, H - y_mm * mm, str(s))

    def hline(y_mm):
        c.line(20 * mm, H - y_mm * mm, 190 * mm, H - y_mm * mm)

    text(20, 22, f"Rechnung Nr. {inv['number']}", bold=True, size=16)
    text(20, 32, f"Datum: {_iso_to_display(inv['date'])}  |  Zahlungsziel: {_iso_to_display(inv['due_date'])}", size=9)

    text(20,  52, 'Auftragnehmer:', bold=True)
    text(20,  60, seller['name'])
    text(20,  68, seller['address'])
    text(20,  76, f"{seller['zip']} {seller['city']}")
    text(20,  84, f"Steuernr.: {seller['tax_number']}", size=9)

    text(115, 52, 'Rechnungsempfaenger:', bold=True)
    text(115, 60, buyer['name'])
    text(115, 68, buyer['address'])
    text(115, 76, f"{buyer['zip']} {buyer['city']}")

    hline(108)
    text(20,  115, 'Pos.',        bold=True)
    text(35,  115, 'Leistung',    bold=True)
    text(120, 115, 'Menge',       bold=True)
    rtext(160, 115, 'EP (EUR)',   bold=True)
    rtext(190, 115, 'Ges. (EUR)', bold=True)
    hline(119)

    y = 127
    net_total = 0.0
    for idx, item in enumerate(items, 1):
        lt = round(float(item['quantity']) * float(item['unit_price']), 2)
        net_total += lt
        text(20,  y, str(idx))
        text(35,  y, item['description'])
        text(120, y, f"{item['quantity']} {item['unit']}")
        rtext(160, y, f"{float(item['unit_price']):.2f}")
        rtext(190, y, f"{lt:.2f}")
        y += 8

    hline(y - 1)
    text(120,  y + 6, 'Gesamtbetrag (netto):', bold=True)
    rtext(190, y + 6, f'{net_total:.2f} EUR',  bold=True)
    text(20,   y + 20, VAT_EXEMPTION, size=9)

    c.showPage()
    c.save()
    rl_bytes = buf.getvalue()

    # Inject OutputIntent (sRGB ICC) — required for PDF/A-3b conformance
    with open(ICC_PROFILE, 'rb') as f:
        icc_data = f.read()

    reader = PdfReader(io.BytesIO(rl_bytes))
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)

    icc_stream = DecodedStreamObject()
    icc_stream.set_data(icc_data)
    icc_stream = icc_stream.flate_encode()
    icc_stream.update({NameObject('/N'): NumberObject(3)})
    icc_ref = writer._add_object(icc_stream)

    oi = DictionaryObject({
        NameObject('/Type'): NameObject('/OutputIntent'),
        NameObject('/S'):    NameObject('/GTS_PDFA1'),
        NameObject('/OutputConditionIdentifier'): create_string_object('sRGB IEC61966-2.1'),
        NameObject('/Info'):                      create_string_object('sRGB IEC61966-2.1'),
        NameObject('/DestOutputProfile'): icc_ref,
    })
    oi_ref = writer._add_object(oi)
    writer._root_object[NameObject('/OutputIntents')] = ArrayObject([oi_ref])

    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


# ── Validation ─────────────────────────────────────────────────────────────────

def validate(d):
    errs = []
    for key in ('seller', 'buyer', 'invoice', 'line_items'):
        if key not in d:
            errs.append(f'Missing required field: {key}')
    if errs:
        return errs

    for f in ('name', 'address', 'zip', 'city', 'country', 'tax_number', 'registration_id'):
        if not d['seller'].get(f):
            errs.append(f'Missing seller.{f}')
    for f in ('name', 'address', 'zip', 'city', 'country'):
        if not d['buyer'].get(f):
            errs.append(f'Missing buyer.{f}')
    for f in ('number', 'date', 'due_date'):
        if not d['invoice'].get(f):
            errs.append(f'Missing invoice.{f}')

    items = d.get('line_items')
    if not isinstance(items, list) or not items:
        errs.append('line_items must be a non-empty array')
    else:
        for i, item in enumerate(items):
            for f in ('description', 'quantity', 'unit', 'unit_price'):
                if item.get(f) is None:
                    errs.append(f'Missing line_items[{i}].{f}')
    return errs


# ── HTTP handler ───────────────────────────────────────────────────────────────

class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(204)
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()

    def do_POST(self):
        # Parse body
        try:
            length = int(self.headers.get('Content-Length', 0))
            data   = json.loads(self.rfile.read(length))
        except Exception:
            return self._json(400, {'error': 'Invalid JSON body'})

        # Field validation
        errs = validate(data)
        if errs:
            return self._json(400, {'error': 'Validation failed', 'details': errs})

        # Asset check (fail fast before expensive generation)
        missing = [name for name, path in [
            ('api/assets/sRGB.icc',          ICC_PROFILE),
            ('reportlab Vera.ttf',           SANS_REG),
            ('reportlab VeraBd.ttf',         SANS_BOLD),
        ] if not os.path.exists(path)]
        if missing:
            return self._json(500, {
                'error': 'Missing required assets on server',
                'missing': missing,
            })

        # Generate
        try:
            xml_bytes = build_xml(data)
            facturx.xml_check_xsd(xml_bytes, flavor='factur-x', level='en16931')
            facturx.xml_check_schematron(xml_bytes, flavor='factur-x', level='en16931')
            base_pdf  = build_base_pdf(data)
            inv_num   = data['invoice']['number']
            result    = facturx.generate_from_binary(
                base_pdf, xml_bytes,
                flavor='factur-x', level='en16931',
                check_xsd=False, check_schematron=False,
                lang='de-DE',
                pdf_metadata={
                    'author':  data['seller']['name'],
                    'title':   f"Rechnung {inv_num}",
                    'subject': f"ZUGFeRD EN16931 Rechnung {inv_num}",
                },
            )
        except Exception:
            return self._json(500, {'error': traceback.format_exc()})

        safe = ''.join(c if c.isalnum() or c in '-_' else '_' for c in data['invoice']['number'])
        filename = f'Rechnung_{safe}.pdf'

        self.send_response(200)
        self.send_header('Content-Type', 'application/pdf')
        self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
        self.send_header('Content-Length', str(len(result)))
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(result)

    def _json(self, code, payload):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass  # suppress default request logging to stderr
