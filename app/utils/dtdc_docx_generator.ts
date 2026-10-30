import { deflateRawSync } from 'node:zlib'
import type { CleanedAddress } from '../types/address_cleanup.js'
import { DTDC_DOCX_TEMPLATE_FILES } from './dtdc_docx_template.js'

const STATE_NAME_TO_CODE: Record<string, string> = {
  'alabama': 'AL',
  'alaska': 'AK',
  'arizona': 'AZ',
  'arkansas': 'AR',
  'california': 'CA',
  'colorado': 'CO',
  'connecticut': 'CT',
  'delaware': 'DE',
  'district of columbia': 'DC',
  'florida': 'FL',
  'georgia': 'GA',
  'hawaii': 'HI',
  'idaho': 'ID',
  'illinois': 'IL',
  'indiana': 'IN',
  'iowa': 'IA',
  'kansas': 'KS',
  'kentucky': 'KY',
  'louisiana': 'LA',
  'maine': 'ME',
  'maryland': 'MD',
  'massachusetts': 'MA',
  'michigan': 'MI',
  'minnesota': 'MN',
  'mississippi': 'MS',
  'missouri': 'MO',
  'montana': 'MT',
  'nebraska': 'NE',
  'nevada': 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  'ohio': 'OH',
  'oklahoma': 'OK',
  'oregon': 'OR',
  'pennsylvania': 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  'tennessee': 'TN',
  'texas': 'TX',
  'utah': 'UT',
  'vermont': 'VT',
  'virginia': 'VA',
  'washington': 'WA',
  'washington state': 'WA',
  'west virginia': 'WV',
  'wisconsin': 'WI',
  'wyoming': 'WY',
  'puerto rico': 'PR',
  // Canada
  'alberta': 'AB',
  'british columbia': 'BC',
  'manitoba': 'MB',
  'new brunswick': 'NB',
  'newfoundland': 'NL',
  'northwest territories': 'NT',
  'nova scotia': 'NS',
  'nunavut': 'NU',
  'ontario': 'ON',
  'prince edward island': 'PE',
  'quebec': 'PQ',
  'saskatchewan': 'SK',
  'yukon': 'YT',
}

const CRC32_TABLE = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  CRC32_TABLE[i] = c >>> 0
}

function crc32Buffer(buf: Buffer): number {
  let crc = 0xffffffff
  for (const element of buf) {
    crc = CRC32_TABLE[(crc ^ element) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function escapeXml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toTwoLetterState(state: string): string {
  const s = (state ?? '').trim()
  if (!s) return ''
  if (s.length === 2) return s.toUpperCase()
  return STATE_NAME_TO_CODE[s.toLowerCase()] ?? s
}

function formatLabelPhone(addr: CleanedAddress): string {
  const raw = (addr.phone ?? '').trim()
  if (!raw || raw === '000-000-0000') return ''
  if (raw.startsWith('+')) return raw
  const cc = (addr.countryCode ?? 'US').toUpperCase()
  if (cc === 'US' || cc === 'CA') {
    return `+1 ${raw}`
  }
  return `+${raw}`
}

function buildRun(text: string, options: { bold?: boolean; preserveSpace?: boolean } = {}): string {
  const boldXml = options.bold ? '<w:b/><w:bCs/>' : ''
  const spaceAttr =
    options.preserveSpace || text.startsWith(' ') || text.endsWith(' ')
      ? ' xml:space="preserve"'
      : ''
  return `<w:r><w:rPr><w:rFonts w:ascii="Amazon Ember" w:hAnsi="Amazon Ember" w:cs="Amazon Ember"/>${boldXml}<w:sz w:val="48"/><w:szCs w:val="48"/></w:rPr><w:t${spaceAttr}>${escapeXml(text)}</w:t></w:r>`
}

function buildBreakRun(): string {
  return `<w:r><w:rPr><w:rFonts w:ascii="Amazon Ember" w:hAnsi="Amazon Ember" w:cs="Amazon Ember"/><w:sz w:val="48"/><w:szCs w:val="48"/></w:rPr><w:br/></w:r>`
}

const TAX_BOX_RPR = `<w:rPr><w:rFonts w:ascii="Amazon Ember" w:hAnsi="Amazon Ember" w:cs="Amazon Ember"/><w:bCs/><w:color w:val="000000" w:themeColor="text1"/><w:sz w:val="60"/><w:szCs w:val="60"/><w14:shadow w14:blurRad="38100" w14:dist="19050" w14:dir="2700000" w14:sx="100000" w14:sy="100000" w14:kx="0" w14:ky="0" w14:algn="tl"><w14:schemeClr w14:val="dk1"><w14:alpha w14:val="60000"/></w14:schemeClr></w14:shadow><w14:textOutline w14:w="0" w14:cap="flat" w14:cmpd="sng" w14:algn="ctr"><w14:noFill/><w14:prstDash w14:val="solid"/><w14:round/></w14:textOutline></w:rPr>`

/**
 * Builds the top-right floating bordered box for IOSS or RUT tax IDs,
 * matching the exact DrawingML + VML structure in `DTDC Label.docx`.
 */
function buildFloatingTaxBoxRun(prefix: string, value: string, boxId: number): string {
  const safePrefix = escapeXml(prefix)
  const safeValue = escapeXml(value)
  const txbxParagraph = `<w:p><w:pPr><w:jc w:val="center"/>${TAX_BOX_RPR}</w:pPr><w:r>${TAX_BOX_RPR}<w:t xml:space="preserve">${safePrefix}: </w:t></w:r><w:r>${TAX_BOX_RPR}<w:t>${safeValue}</w:t></w:r></w:p>`
  return `<w:r><w:rPr><w:noProof/></w:rPr><mc:AlternateContent><mc:Choice Requires="wps"><w:drawing><wp:anchor distT="0" distB="0" distL="114300" distR="114300" simplePos="0" relativeHeight="251659264" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="margin"><wp:align>right</wp:align></wp:positionH><wp:positionV relativeFrom="paragraph"><wp:posOffset>10234</wp:posOffset></wp:positionV><wp:extent cx="1828800" cy="627321"/><wp:effectExtent l="0" t="0" r="12700" b="20955"/><wp:wrapNone/><wp:docPr id="${boxId}" name="Text Box ${boxId}"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:wsp><wps:cNvSpPr txBox="1"/><wps:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1828800" cy="627321"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:ln/></wps:spPr><wps:style><a:lnRef idx="2"><a:schemeClr val="dk1"/></a:lnRef><a:fillRef idx="1"><a:schemeClr val="lt1"/></a:fillRef><a:effectRef idx="0"><a:schemeClr val="dk1"/></a:effectRef><a:fontRef idx="minor"><a:schemeClr val="dk1"/></a:fontRef></wps:style><wps:txbx><w:txbxContent>${txbxParagraph}</w:txbxContent></wps:txbx><wps:bodyPr rot="0" spcFirstLastPara="0" vertOverflow="overflow" horzOverflow="overflow" vert="horz" wrap="none" lIns="91440" tIns="45720" rIns="91440" bIns="45720" numCol="1" spcCol="0" rtlCol="0" fromWordArt="0" anchor="t" anchorCtr="0" forceAA="0" compatLnSpc="1"><a:prstTxWarp prst="textNoShape"><a:avLst/></a:prstTxWarp><a:noAutofit/></wps:bodyPr></wps:wsp></a:graphicData></a:graphic><wp14:sizeRelV relativeFrom="margin"><wp14:pctHeight>0</wp14:pctHeight></wp14:sizeRelV></wp:anchor></w:drawing></mc:Choice><mc:Fallback><w:pict><v:shape id="Text Box ${boxId}" type="#_x0000_t202" style="position:absolute;margin-left:92.8pt;margin-top:.8pt;width:2in;height:49.4pt;z-index:251659264;visibility:visible;mso-wrap-style:none;mso-position-horizontal:right;mso-position-horizontal-relative:margin;mso-position-vertical:absolute;mso-position-vertical-relative:text;v-text-anchor:top" fillcolor="white [3201]" strokecolor="black [3200]" strokeweight="1pt"><v:textbox><w:txbxContent>${txbxParagraph}</w:txbxContent></v:textbox><w10:wrap anchorx="margin"/></v:shape></w:pict></mc:Fallback></mc:AlternateContent></w:r>`
}

function buildAddressParagraphXml(addr: CleanedAddress, index: number): string {
  const runs: string[] = []

  // 1. Optional floating top-right tax box (RUT or IOSS)
  if (addr.buyerNationalId) {
    runs.push(buildFloatingTaxBoxRun('RUT', addr.buyerNationalId, index + 1))
  } else if (addr.vatOrIoss) {
    runs.push(buildFloatingTaxBoxRun('IOSS', addr.vatOrIoss, index + 1))
  }

  // 2. Recipient Name (Bold 24pt)
  runs.push(buildRun(addr.name || 'Recipient', { bold: true }))
  runs.push(buildBreakRun())

  // 3. Street Address lines (Regular 24pt)
  const streetLines = [addr.line1, addr.line2, addr.line3]
    .map((s) => (s && s !== '-' ? s.trim() : ''))
    .filter(Boolean)

  if (streetLines.length === 0) {
    runs.push(buildRun('-'))
    runs.push(buildBreakRun())
  } else {
    // Combine street lines onto 1 line when compact (matching DTDC Label.docx APT formatting)
    const joined = streetLines.join(' ')
    if (streetLines.length > 1 && joined.length <= 36) {
      runs.push(buildRun(joined))
      runs.push(buildBreakRun())
    } else {
      for (const line of streetLines) {
        runs.push(buildRun(line))
        runs.push(buildBreakRun())
      }
    }
  }

  // 4. City, State + Bold ZipCode (24pt)
  const stateCode = toTwoLetterState(addr.state)
  const rawZip = (addr.zipCode || (addr.zipcode ? addr.zipcode.replace(/^'/, '') : '')).trim()
  const cityStatePrefix = stateCode
    ? `${addr.city}, ${stateCode}${rawZip ? ' ' : ''}`
    : `${addr.city}${rawZip ? ' ' : ''}`

  if (cityStatePrefix) {
    runs.push(buildRun(cityStatePrefix, { preserveSpace: true }))
  }
  if (rawZip) {
    runs.push(buildRun(rawZip, { bold: true }))
  }
  runs.push(buildBreakRun())

  // 5. Country (Bold 24pt)
  runs.push(buildRun(addr.country || 'United States', { bold: true }))

  // 6. Blank line + Phone (Regular 24pt)
  const formattedPhone = formatLabelPhone(addr)
  if (formattedPhone) {
    runs.push(buildBreakRun())
    runs.push(buildBreakRun())
    runs.push(buildRun(`Phone: ${formattedPhone}`))
    if (addr.ref) {
      runs.push(buildBreakRun())
    }
  } else if (addr.ref) {
    // When phone is absent (like Mark Ponder in DTDC Label.docx), emit 3 line breaks before REF
    runs.push(buildBreakRun())
    runs.push(buildBreakRun())
    runs.push(buildBreakRun())
  }

  // 7. REF: (Bold "REF:" + Regular ref value)
  if (addr.ref) {
    runs.push(buildRun('REF:', { bold: true }))
    runs.push(buildRun(' ', { preserveSpace: true }))
    runs.push(buildRun(addr.ref))
  }

  return `<w:p><w:pPr><w:rPr><w:rFonts w:ascii="Amazon Ember" w:hAnsi="Amazon Ember" w:cs="Amazon Ember"/><w:sz w:val="48"/><w:szCs w:val="48"/></w:rPr></w:pPr>${runs.join('')}</w:p>`
}

export function buildDtdcDocumentXml(addresses: CleanedAddress[]): string {
  const paragraphs = addresses.map((addr, i) => buildAddressParagraphXml(addr, i)).join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex" xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex" xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex" xmlns:cx6="http://schemas.microsoft.com/office/drawing/2016/5/12/chartex" xmlns:cx7="http://schemas.microsoft.com/office/drawing/2016/5/13/chartex" xmlns:cx8="http://schemas.microsoft.com/office/drawing/2016/5/14/chartex" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink" xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash" xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 w15 w16se w16cid w16 w16cex w16sdtdh wp14"><w:body>${paragraphs}<w:sectPr><w:footerReference w:type="default" r:id="rId7"/><w:pgSz w:w="10658" w:h="5868" w:orient="landscape" w:code="257"/><w:pgMar w:top="284" w:right="288" w:bottom="288" w:left="288" w:header="288" w:footer="288" w:gutter="0"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr></w:body></w:document>`
}

/**
 * Pure Node.js ZIP builder (using built-in `node:zlib` deflateRawSync + pure-JS CRC32)
 * that packages OpenXML files into a `.docx` Buffer with zero external dependencies.
 */
function createZipBuffer(entries: Array<{ name: string; content: Buffer }>): Buffer {
  const localHeaders: Buffer[] = []
  const centralHeaders: Buffer[] = []
  let offset = 0

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8')
    const uncompressed = entry.content
    const compressed = deflateRawSync(uncompressed)
    const crc = crc32Buffer(uncompressed)

    // Local file header (30 bytes + filename)
    const localHeader = Buffer.alloc(30)
    localHeader.writeUInt32LE(0x04034b50, 0) // signature
    localHeader.writeUInt16LE(20, 4) // version needed (2.0)
    localHeader.writeUInt16LE(0, 6) // flags
    localHeader.writeUInt16LE(8, 8) // compression method: deflate (8)
    localHeader.writeUInt16LE(0, 10) // mod time
    localHeader.writeUInt16LE(0x5421, 12) // mod date
    localHeader.writeUInt32LE(crc, 14) // crc32
    localHeader.writeUInt32LE(compressed.length, 18) // compressed size
    localHeader.writeUInt32LE(uncompressed.length, 22) // uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26) // file name length
    localHeader.writeUInt16LE(0, 28) // extra field length

    localHeaders.push(localHeader, nameBuf, compressed)

    // Central directory file header (46 bytes + filename)
    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0) // signature
    centralHeader.writeUInt16LE(20, 4) // version made by
    centralHeader.writeUInt16LE(20, 6) // version needed
    centralHeader.writeUInt16LE(0, 8) // flags
    centralHeader.writeUInt16LE(8, 10) // compression method: deflate (8)
    centralHeader.writeUInt16LE(0, 12) // mod time
    centralHeader.writeUInt16LE(0x5421, 14) // mod date
    centralHeader.writeUInt32LE(crc, 16) // crc32
    centralHeader.writeUInt32LE(compressed.length, 20) // compressed size
    centralHeader.writeUInt32LE(uncompressed.length, 24) // uncompressed size
    centralHeader.writeUInt16LE(nameBuf.length, 28) // file name length
    centralHeader.writeUInt16LE(0, 30) // extra field length
    centralHeader.writeUInt16LE(0, 32) // file comment length
    centralHeader.writeUInt16LE(0, 34) // disk number start
    centralHeader.writeUInt16LE(0, 36) // internal file attributes
    centralHeader.writeUInt32LE(0, 38) // external file attributes
    centralHeader.writeUInt32LE(offset, 42) // relative offset of local header

    centralHeaders.push(centralHeader, nameBuf)

    offset += localHeader.length + nameBuf.length + compressed.length
  }

  const centralDirSize = centralHeaders.reduce((sum, b) => sum + b.length, 0)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0) // EOCD signature
  eocd.writeUInt16LE(0, 4) // disk number
  eocd.writeUInt16LE(0, 6) // central dir start disk
  eocd.writeUInt16LE(entries.length, 8) // entries on disk
  eocd.writeUInt16LE(entries.length, 10) // total entries
  eocd.writeUInt32LE(centralDirSize, 12) // central dir size
  eocd.writeUInt32LE(offset, 16) // central dir offset
  eocd.writeUInt16LE(0, 20) // comment length

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd])
}

export function generateDtdcLabelDocx(addresses: CleanedAddress[]): Buffer {
  const entries: Array<{ name: string; content: Buffer }> = []

  for (const [name, xmlContent] of Object.entries(DTDC_DOCX_TEMPLATE_FILES)) {
    if (name === 'docProps/app.xml') {
      const updatedAppXml = xmlContent.replace(
        /<Pages>\d+<\/Pages>/,
        `<Pages>${Math.max(1, addresses.length)}</Pages>`
      )
      entries.push({ name, content: Buffer.from(updatedAppXml, 'utf8') })
    } else {
      entries.push({ name, content: Buffer.from(xmlContent, 'utf8') })
    }
  }

  const documentXml = buildDtdcDocumentXml(addresses)
  entries.push({ name: 'word/document.xml', content: Buffer.from(documentXml, 'utf8') })

  return createZipBuffer(entries)
}
