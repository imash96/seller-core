import { CleanedAddress, LineAdd } from '../types/address_cleanup.ts'
import { COUNTRY_ISO_MAP, COUNTRY_LIST } from '../utils/country_list.js'
import stateCheck from '../utils/state_check.js'

// ---  US city-state-zip pattern: "City, ST 12345" or "City, ST 12345-6789"
const US_CSZ_REGEX = /^(.+?),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/

// --- Canadian pattern: "City, AB T2V 4W6"
const CA_CSZ_REGEX = /^(.+?),\s*([A-Za-z]{2})\s+([A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d)$/

// --- Generic intl: "City, Region ZIP" where region can be multi-word
const GENERIC_CSZ_REGEX = /^(.+?),\s*(.+?)\s+([A-Za-z0-9][\w\s\-]{1,11})$/

// --- European zip-before-city: "85072 Eichstätt" / "85356 Freising"
const EU_ZIP_CITY_REGEX = /^(\d{4,6})\s+(.+)$/

// --- Metadata line patterns (order matters — more specific first)
const META_PATTERNS: { key: string; regex: RegExp }[] = [
  { key: 'phone', regex: /^phone\s*:\s*/i },
  { key: 'contactBuyer', regex: /^contact\s+buyer\s*:\s*/i },
  { key: 'buyer', regex: /^buyer\s*:\s*/i },
  { key: 'addressType', regex: /^address\s+type\s*:\s*/i },
  { key: 'type', regex: /^type\s*:\s*/i },
  { key: 'signature', regex: /signature\s*(?:required|confirmation)?\s*$/i },
  { key: 'ioss', regex: /^ioss\s*:\s*/i },
  { key: 'vat', regex: /^vat\s*:\s*/i },
  { key: 'rutId', regex: /^rut\s+id\s*:\s*/i },
  { key: 'rut', regex: /^rut\s*:\s*/i },
  { key: 'buyerNationalId', regex: /^buyer\s+national\s+id\s*:\s*/i },
  { key: 'taxId', regex: /^tax\s+id\s*:\s*/i },
]

function wrapAt35(input: string): { head: string; tail: string } {
  const trimmed = input.trim()
  if (trimmed.length <= 35) return { head: trimmed, tail: '' }
  const spaceIdx = trimmed.lastIndexOf(' ', 35)
  if (spaceIdx > 0) {
    return {
      head: trimmed.slice(0, spaceIdx).trim(),
      tail: trimmed.slice(spaceIdx + 1).trim(),
    }
  }
  return {
    head: trimmed.slice(0, 35),
    tail: trimmed.slice(35).trim(),
  }
}

/**
 * Normalize a raw phone string into a clean number.
 * Handles: +1 prefix, dot/dash/space separators, raw digits, country codes.
 */
function normalizePhone(raw: string): { number: string; ext?: string } {
  if (!raw || !raw.trim()) return { number: '000-000-0000' }

  let phone = raw.trim()

  // Split off extension first
  let ext: string | undefined
  const extMatch = phone.match(/\bext\.?\s*(\d+)/i)
  if (extMatch) {
    ext = extMatch[1]
    phone = phone.slice(0, extMatch.index).trim()
  }

  // Strip leading + and country code for US/CA numbers (+1)
  // For other country codes, preserve the full number but normalize separators
  const usMatch = phone.match(/^\+?1[\s.-]?(\d.*)$/)
  if (usMatch) {
    phone = usMatch[1]
  } else if (phone.startsWith('+')) {
    // International number — keep full digits but normalize separators
    phone = phone.replace(/^\+/, '')
  }

  // Replace dots and multiple spaces/dashes with a single dash
  phone = phone.replace(/[.\s]+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '')

  // If it's 10 raw digits, format as XXX-XXX-XXXX
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    phone = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  } else if (digits.length === 11 && digits.startsWith('1')) {
    phone = `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`
  }

  return { number: phone || '000-000-0000', ext }
}

/**
 * Check if a line matches a known country name.
 * Returns normalized country name or undefined.
 */
function matchCountry(line: string): string | undefined {
  const candidate = line.trim().toLowerCase()
  if (!candidate) return undefined
  const match = COUNTRY_LIST.find((c) => c.toLowerCase() === candidate)
  if (!match) return undefined
  // Normalize common US variants
  const lower = match.toLowerCase()
  if (lower === 'usa' || lower === 'united states of america' || lower === 'united state') {
    return 'United States'
  }
  // Title-case the matched country
  return match
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export class CleanAdd {
  public outputList: CleanedAddress[] = []

  /**
   * Classify each raw line as metadata or core address content.
   * Returns separated metadata and core (address) lines.
   */
  private classifyLines(lines: string[]): {
    name: string
    coreLines: string[]
    phone?: string
    buyerName?: string
    addressType?: string
    isSignatureRequired: boolean
    vatOrIoss?: string
    buyerNationalId?: string
  } {
    const name = (lines[0] ?? '').trim()
    const coreLines: string[] = []
    let phone: string | undefined
    let buyerName: string | undefined
    let addressType: string | undefined
    let isSignatureRequired = false
    let vatOrIoss: string | undefined
    let buyerNationalId: string | undefined

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      let matched = false
      for (const { key, regex } of META_PATTERNS) {
        if (regex.test(line)) {
          const value = line.replace(regex, '').trim()
          switch (key) {
            case 'phone':
              phone = value
              break
            case 'contactBuyer':
            case 'buyer':
              buyerName = value
              break
            case 'addressType':
            case 'type':
              addressType = value
              break
            case 'signature':
              isSignatureRequired = true
              break
            case 'ioss':
            case 'vat':
            case 'rut':
              vatOrIoss = value
              break
            case 'rutId':
              buyerNationalId = value
              break
            case 'buyerNationalId':
            case 'taxId':
              buyerNationalId = value
              break
          }
          matched = true
          break
        }
      }

      if (!matched) {
        coreLines.push(line)
      }
    }

    return { name, coreLines, phone, buyerName, addressType, isSignatureRequired, vatOrIoss, buyerNationalId }
  }

  /**
   * Detect and extract the reference/order number from coreLines.
   * A ref is typically the last line if it doesn't look like a country,
   * city/state/zip, or a pure street address.
   */
  private extractRef(coreLines: string[]): { ref: string; remaining: string[] } {
    if (coreLines.length < 2) return { ref: '', remaining: coreLines }

    const last = coreLines[coreLines.length - 1]

    // If it looks like a country, it's not a ref
    if (matchCountry(last)) return { ref: '', remaining: coreLines }

    // If it looks like a city/state/zip line, not a ref
    if (US_CSZ_REGEX.test(last) || CA_CSZ_REGEX.test(last) || GENERIC_CSZ_REGEX.test(last)) {
      return { ref: '', remaining: coreLines }
    }

    // If it matches EU zip-city format, not a ref
    if (EU_ZIP_CITY_REGEX.test(last)) return { ref: '', remaining: coreLines }

    // Heuristic: a ref line is typically an order number or alphanumeric ID
    // - Contains digits and possibly dashes (like 114-5610173-1564218-JCAM or 4208118056)
    // - Does NOT contain commas (city/state/zip lines do)
    // - Is NOT a normal street address (usually has letters and numbers mixed)
    const isLikelyRef =
      // Pure digits (like 4208118056)
      /^\d{7,}$/.test(last) ||
      // Order-style: digits/dashes/letters (like 114-5610173-1564218-JCAM, 06-15326-16231)
      /^\d{2,}-\d+/.test(last) ||
      // Already uppercase alphanumeric with dashes
      /^[A-Z0-9\-]{7,}$/.test(last.toUpperCase())

    if (isLikelyRef) {
      return {
        ref: last.toUpperCase().trim(),
        remaining: coreLines.slice(0, -1),
      }
    }

    return { ref: '', remaining: coreLines }
  }

  /**
   * Detect country from the remaining core lines.
   * Handles duplicate country lines (e.g., "Germany" appearing twice).
   */
  private extractCountry(coreLines: string[]): { country: string; remaining: string[] } {
    const remaining: string[] = []
    let country = 'United States'

    // Scan ALL core lines and strip any that are a known country name.
    // This handles duplicates ("Germany\n...\nGermany") and mid-address
    // country lines (e.g. country between street and zip-city).
    for (const line of coreLines) {
      const matched = matchCountry(line)
      if (matched) {
        country = matched
      } else {
        remaining.push(line)
      }
    }

    return { country, remaining }
  }

  /**
   * Parse the city/state/zip line.
   * Supports US, Canadian, European (zip-before-city), and generic international formats.
   */
  private parseCityStateZip(
    line: string | undefined,
    country: string
  ): { city: string; state: string; zipcode: string; rawZip: string } {
    const empty = { city: '', state: '', zipcode: "''", rawZip: '' }
    if (!line) return empty

    const trimmed = line.trim()
    const countryLower = country.toLowerCase()

    // Try US format: "City, ST 12345-6789"
    let match = US_CSZ_REGEX.exec(trimmed)
    if (match) {
      const city = match[1].trim()
      const rawState = match[2].trim()
      const rawZip = match[3].trim().split('-')[0].toUpperCase()
      const state = stateCheck(rawState.toLowerCase(), countryLower)
      return { city, state, zipcode: `'${rawZip}`, rawZip }
    }

    // Try Canadian format: "City, AB T2V 4W6"
    match = CA_CSZ_REGEX.exec(trimmed)
    if (match) {
      const city = match[1].trim()
      const rawState = match[2].trim()
      const rawZip = match[3].trim().toUpperCase()
      const state = stateCheck(rawState.toLowerCase(), countryLower)
      return { city, state, zipcode: `'${rawZip}`, rawZip }
    }

    // Try European zip-before-city: "85072 Eichstätt"
    const euMatch = EU_ZIP_CITY_REGEX.exec(trimmed)
    if (euMatch) {
      const rawZip = euMatch[1].trim()
      const city = euMatch[2].trim()
      return { city, state: '', zipcode: `'${rawZip}`, rawZip }
    }

    // Try generic international: "City, Region ZIP"
    match = GENERIC_CSZ_REGEX.exec(trimmed)
    if (match) {
      const city = match[1].trim()
      const rawState = match[2].trim()
      const rawZip = match[3].trim().split('-')[0].toUpperCase()
      const state = stateCheck(rawState.toLowerCase(), countryLower)
      return { city, state, zipcode: `'${rawZip}`, rawZip }
    }

    // Fallback: try splitting on comma
    const parts = trimmed
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length >= 2) {
      const city = parts[0]
      const restTokens = parts
        .slice(1)
        .join(' ')
        .split(/\s+/)
        .filter(Boolean)
      const rawZip =
        restTokens.length > 1 ? restTokens[restTokens.length - 1].split('-')[0].toUpperCase() : ''
      const rawState = restTokens.length > 1 ? restTokens.slice(0, -1).join(' ') : (restTokens[0] ?? '')
      const state = stateCheck(rawState.toLowerCase(), countryLower)
      return { city, state, zipcode: rawZip ? `'${rawZip}` : "''", rawZip }
    }

    // Last resort: entire line is city
    return { city: trimmed, state: '', zipcode: "''", rawZip: '' }
  }

  /**
   * Build add1/add2/add3 from street lines, wrapping at 35 chars.
   */
  private extractAddLines(streetLines: string[]): { lines: LineAdd; overflow: boolean } {
    const lineAdd: LineAdd = {
      add1: '-',
      add2: '-',
      add3: '-',
    }
    let overflow = false
    const working = [...streetLines]
    let leftover = ''

    for (let i = 0; i < 3 && (i < working.length || leftover); i++) {
      const key = `add${i + 1}` as keyof LineAdd
      let current = working[i] ? working[i].trim() : ''

      if (leftover) {
        current = current ? `${leftover} ${current}` : leftover
        leftover = ''
      }

      if (!current) continue

      if (current.length > 35) {
        const wrapped = wrapAt35(current)
        lineAdd[key] = wrapped.head
        leftover = wrapped.tail
      } else {
        lineAdd[key] = current
      }
    }

    if (leftover) {
      overflow = true
    }

    return { lines: lineAdd, overflow }
  }

  /**
   * Process a single address block into a CleanedAddress.
   */
  private processAdd(rawLines: string[]): CleanedAddress {
    const lines = rawLines.map((l) => l.trim()).filter(Boolean)
    const warnings: string[] = []

    // Step 1: Classify all lines into metadata vs core address lines
    const classified = this.classifyLines(lines)
    let { name, coreLines } = classified
    const { phone: rawPhone, buyerName, addressType, isSignatureRequired, vatOrIoss, buyerNationalId } =
      classified

    // Step 2: Handle name overflow / single name
    const isNameOverflow = name.length > 35
    const isSingleName = !name.includes(' ')

    if (isNameOverflow) {
      const wrapped = wrapAt35(name)
      name = wrapped.head
      warnings.push(`Recipient name exceeded 35 chars and was truncated ("${classified.name}")`)
    }
    if (isSingleName) {
      warnings.push('Single-word recipient name detected; verify full name for customs/carrier')
    }

    // Step 3: Extract ref (order number) from end of core lines
    const { ref, remaining: afterRef } = this.extractRef(coreLines)
    coreLines = afterRef

    // Step 4: Extract country (handles duplicates like "Germany\nGermany")
    const { country, remaining: afterCountry } = this.extractCountry(coreLines)
    coreLines = afterCountry

    // Step 5: Parse city/state/zip (last remaining core line)
    const cityStateZipLine = coreLines.length > 0 ? coreLines[coreLines.length - 1] : undefined
    const streetLines = coreLines.length > 1 ? coreLines.slice(0, -1) : []

    // Edge case: if we only have one core line left, it's likely the city/state/zip
    // and there are no street lines (shouldn't happen with valid addresses, but be safe)
    if (coreLines.length === 1 && !US_CSZ_REGEX.test(coreLines[0]) && !CA_CSZ_REGEX.test(coreLines[0]) && !GENERIC_CSZ_REGEX.test(coreLines[0]) && !EU_ZIP_CITY_REGEX.test(coreLines[0])) {
      // The single remaining line is likely a street address with no CSZ — push to street
      // This is unlikely but defensive
    }

    const { city, state, zipcode, rawZip } = this.parseCityStateZip(cityStateZipLine, country)

    // Step 6: Build add lines from street addresses
    const { lines: extractedLines, overflow: isAddOverflow } = this.extractAddLines(streetLines)
    if (isAddOverflow) {
      warnings.push('Street address exceeded 3x35 character carrier line limit')
    }

    // Step 7: Normalize phone
    const { number: phoneNumber, ext } = normalizePhone(rawPhone ?? '')
    const phone = rawPhone ? ext ? `${phoneNumber} ext. ${ext}` : phoneNumber : '000-000-0000'

    // Step 8: Country code lookup
    const countryCode = COUNTRY_ISO_MAP[country.toLowerCase()] ?? 'US'

    // Flags
    const isVATorIOSS = Boolean(vatOrIoss)
    const isBuyerNationalId = Boolean(buyerNationalId)

    return {
      name,
      companyName: buyerName || name,
      ...extractedLines,
      line1: extractedLines.add1 !== '-' ? extractedLines.add1 : '',
      line2: extractedLines.add2 !== '-' ? extractedLines.add2 : '',
      line3: extractedLines.add3 !== '-' ? extractedLines.add3 : '',
      city,
      state,
      zipcode,
      zipCode: rawZip,
      country,
      countryCode,
      ref,
      addLength: streetLines.length,
      phone,
      number: phoneNumber,
      ...(ext ? { ext } : {}),
      ...(buyerName ? { buyerName } : {}),
      ...(addressType ? { addressType } : {}),
      ...(vatOrIoss ? { vatOrIoss } : {}),
      ...(buyerNationalId ? { buyerNationalId } : {}),
      ...(isNameOverflow ? { isNameOverflow: true } : {}),
      ...(isAddOverflow ? { isAddOverflow: true } : {}),
      ...(isSingleName ? { isSingleName: true } : {}),
      ...(isSignatureRequired ? { isSignatureRequired: true } : {}),
      ...(isVATorIOSS ? { isVATorIOSS: true } : {}),
      ...(isBuyerNationalId ? { isBuyerNationalId: true } : {}),
      warnings,
    }
  }

  /**
   * Entry point. Accepts a raw multi-block string or an array of address blocks.
   * Addresses are separated by blank lines in a single string.
   */
  public main(input: string | string[]): CleanedAddress[] {
    this.outputList = []

    const rawBlocks = Array.isArray(input)
      ? input
      : input
        .trim()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/\r\n/g, '\n')
        .split(/\n{2,}/)

    for (const block of rawBlocks) {
      if (!block || !block.trim()) continue
      const lines = block
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((d) =>
          d.replace(/\w\S*/g, (word) => {
            // Preserve fully uppercase alphanumeric tokens that contain digits
            // (order refs, zip codes, etc.)
            if (/^[A-Z0-9\-]{2,}$/.test(word) && /\d/.test(word)) return word
            // Preserve 2-letter state/province codes when they're all caps
            if (/^[A-Z]{2}$/.test(word)) return word
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          })
        )

      if (lines.length > 0) {
        this.outputList.push(this.processAdd(lines))
      }
    }

    return this.outputList
  }

  public static toCsv(addresses: CleanedAddress[]): string {
    const headers = [
      'name',
      'companyName',
      'add1',
      'add2',
      'add3',
      'city',
      'state',
      'zipcode',
      'country',
      'countryCode',
      'phone',
      'ref',
      'isSignatureRequired',
      'isNameOverflow',
      'isAddOverflow',
      'isVATorIOSS',
    ]
    const escapeCell = (val: unknown) => {
      const s = val === null || val === undefined ? '' : String(val)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }
    const rows = addresses.map((a) => headers.map((h) => escapeCell((a as any)[h])).join(','))
    return [headers.join(','), ...rows].join('\n')
  }
}
