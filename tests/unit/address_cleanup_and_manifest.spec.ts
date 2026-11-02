import { test } from '@japa/runner'
import fs from 'node:fs'
import path from 'node:path'
import { CleanAdd } from '../../app/services/address_cleanup_service.js'
import { COUNTRY_ISO_MAP, COUNTRY_LIST } from '../../app/utils/country_list.js'

test.group('Address Cleanup & Carrier Manifest Engine', () => {
  test('COUNTRY_ISO_MAP contains standard ISO 3166-1 alpha-2 mappings', ({ assert }) => {
    assert.equal(COUNTRY_ISO_MAP['united states'], 'US')
    assert.equal(COUNTRY_ISO_MAP['canada'], 'CA')
    assert.equal(COUNTRY_ISO_MAP['germany'], 'DE')
    assert.equal(COUNTRY_ISO_MAP['united kingdom'], 'GB')
    assert.equal(COUNTRY_ISO_MAP['france'], 'FR')
    assert.equal(COUNTRY_ISO_MAP['australia'], 'AU')
    assert.equal(COUNTRY_ISO_MAP['chile'], 'CL')
    assert.isAbove(Object.keys(COUNTRY_ISO_MAP).length, 50)
    assert.isAbove(COUNTRY_LIST.length, 50)
  })

  test('CleanAdd parses standard Amazon US address with extension and reference', ({ assert }) => {
    const raw = `John Belcastro
4422 Glenmore Ave
Baltimore, MD 21206
United States
Phone: 210-728-4548 ext. 56535
114-5610173-1564218-JCAM
Buyer: John
Address Type: Residential`

    const cleaner = new CleanAdd()
    const results = cleaner.main(raw)

    assert.equal(results.length, 1)
    const addr = results[0]
    assert.equal(addr.name, 'John Belcastro')
    assert.equal(addr.line1, '4422 Glenmore Ave')
    assert.equal(addr.line2, '-')
    assert.equal(addr.line3, '-')
    assert.equal(addr.city, 'Baltimore')
    assert.equal(addr.state, 'Maryland')
    assert.equal(addr.zipcode, "'21206") // Preserves single quote for Excel formatting
    assert.equal(addr.zipCode, '21206')
    assert.equal(addr.country, 'United States')
    assert.equal(addr.countryCode, 'US')
    assert.equal(addr.phone, '210-728-4548 ext. 56535')
    assert.equal(addr.ext, '56535')
    assert.equal(addr.ref, '114-5610173-1564218-JCAM')
    assert.equal(addr.buyerName, 'John')
    assert.equal(addr.addressType, 'Residential')
  })

  test('CleanAdd enforces strict <= 35 characters line wrapping on long lines', ({ assert }) => {
    const raw = `Alexander Hamilton
12345 Very Long Street Name That Definitely Exceeds Thirty Five Characters Boulevard Suite 900
Denver, CO 80202
United States
Phone: 303-555-0199
REF-LONG-LINE-001`

    const cleaner = new CleanAdd()
    const [addr] = cleaner.main(raw)

    assert.isDefined(addr)
    assert.isAtMost(
      addr.line1.length,
      35,
      `Line 1 "${addr.line1}" length ${addr.line1.length} must be <= 35`
    )
    if (addr.line2 !== '-') {
      assert.isAtMost(
        addr.line2.length,
        35,
        `Line 2 "${addr.line2}" length ${addr.line2.length} must be <= 35`
      )
    }
    if (addr.line3 !== '-') {
      assert.isAtMost(
        addr.line3.length,
        35,
        `Line 3 "${addr.line3}" length ${addr.line3.length} must be <= 35`
      )
    }
  })

  test('CleanAdd detects European zip-first addresses (Germany, Austria, France)', ({ assert }) => {
    const raw = `Stefan Killermann
Bahnhofplatz 3
85072 Eichstätt
Germany
Phone: 49-8421-903117
06-15270-60878`

    const cleaner = new CleanAdd()
    const [addr] = cleaner.main(raw)

    assert.isDefined(addr)
    assert.equal(addr.name, 'Stefan Killermann')
    assert.equal(addr.line1, 'Bahnhofplatz 3')
    assert.equal(addr.zipCode, '85072')
    assert.equal(addr.city, 'Eichstatt')
    assert.equal(addr.country, 'Germany')
    assert.equal(addr.countryCode, 'DE')
  })

  test('CleanAdd extracts cross-border customs IOSS and VAT numbers', ({ assert }) => {
    const raw = `Abdi Abbajobir
Kepserstr. 12
85356 Freising
Germany
Phone: 00491622986786
4195369136
IOSS: IM3720000224`

    const cleaner = new CleanAdd()
    const [addr] = cleaner.main(raw)

    assert.isDefined(addr)
    assert.equal(addr.vatOrIoss, 'IM3720000224')
    assert.isTrue(addr.isVATorIOSS)
  })

  test('CleanAdd extracts South American RUT / National Identification Number', ({ assert }) => {
    const raw = `Jorge Riano Allan
Los Palacios 580
San Fernando, O'HIGGINS 3070000
Chile
Phone: 56-9-8527-7587
07-15258-45749
RUT ID: 592553600`

    const cleaner = new CleanAdd()
    const [addr] = cleaner.main(raw)

    assert.isDefined(addr)
    assert.equal(addr.buyerNationalId, '592553600')
    assert.equal(addr.countryCode, 'CL')
  })

  test('CleanAdd flags warnings for single-word recipient names', ({ assert }) => {
    const raw = `Madonna
11713 Potomac Crossing Way Apt 24
Fairfax, VA 22030
United States
Phone: 619-854-2705
REF-SINGLE-NAME-001`

    const cleaner = new CleanAdd()
    const [addr] = cleaner.main(raw)

    assert.isDefined(addr)
    assert.isDefined(addr.warnings)
    assert.isTrue(
      addr.warnings!.some((w) => w.toLowerCase().includes('single-word')),
      'Should flag single-word recipient name warning'
    )
  })

  test('CleanAdd.toCsv serializes cleaned addresses into compliant CSV', ({ assert }) => {
    const raw = `John Belcastro
4422 Glenmore Ave
Baltimore, MD 21206
United States
Phone: 210-728-4548
114-5610173-1564218-JCAM`

    const cleaner = new CleanAdd()
    const addresses = cleaner.main(raw)
    const csv = CleanAdd.toCsv(addresses)

    assert.typeOf(csv, 'string')
    assert.isTrue(csv.startsWith('name,companyName,line1,line2,line3,city,state'))
    assert.isTrue(csv.includes('John Belcastro'))
    assert.isTrue(csv.includes('Baltimore'))
  })

  test('parses a full multi-address Amazon export batch without merging records', ({ assert }) => {
    // The batch previously lived in a throwaway console script (tests/test_address_cleanup.ts);
    // it is the only fixture that exercises blank-line separated multi-address splitting.
    const fixture = fs.readFileSync(
      path.join(import.meta.dirname, '..', 'fixtures', 'address_batch_sample.txt'),
      'utf8'
    )
    const results = new CleanAdd().main(fixture)
    assert.lengthOf(results, 15, 'every block in the batch must become its own address')

    const [john, , andrew, mark, , , , , , stefan, , , abdi, jorge, alexis] = results

    // US Amazon row with an extension, a reference and an address type.
    assert.equal(john.name, 'John Belcastro')
    assert.equal(john.line1, '4422 Glenmore Ave')
    assert.equal(john.city, 'Baltimore')
    assert.equal(john.state, 'Maryland')
    assert.equal(john.zipCode, '21206')
    assert.equal(john.countryCode, 'US')
    assert.equal(john.ext, '56535')
    assert.equal(john.ref, '114-5610173-1564218-JCAM')
    assert.equal(john.buyerName, 'John')
    assert.equal(john.addressType, 'Residential')

    // Single-word recipient names are flagged, never silently accepted.
    assert.isTrue(andrew.isSingleName)
    assert.match(andrew.warnings.join(' '), /single-word recipient name/i)

    // A reference-only block still resolves a US state.
    assert.equal(mark.name, 'Mark Ponder')
    assert.equal(mark.state, 'Alabama')
    assert.equal(mark.ref, '4208118056')

    // ZIP-first European formatting.
    assert.equal(stefan.countryCode, 'DE')
    assert.equal(stefan.zipCode, '85072')
    assert.equal(stefan.city.toLowerCase(), 'eichstatt')

    // User-entered foreign phones must never be replaced by the 000-000-0000 placeholder.
    for (const address of results) {
      if (address.countryCode !== 'US') assert.notEqual(address.phone, '000-000-0000')
    }

    // IOSS VAT id on a German import.
    assert.equal(abdi.countryCode, 'DE')
    assert.isTrue(abdi.isVATorIOSS)
    assert.equal(abdi.vatOrIoss, 'IM3720000224')
    assert.equal(abdi.city.toLowerCase(), 'freising')
    assert.notEqual(abdi.line2, 'Germany')

    // Chilean RUT lands in the national-id field, not the VAT field.
    assert.equal(jorge.countryCode, 'CL')
    assert.equal(jorge.buyerNationalId, '592553600')
    assert.isUndefined(jorge.vatOrIoss)

    // Canadian alphanumeric postal code with a province.
    assert.equal(alexis.countryCode, 'CA')
    assert.equal(alexis.state, 'Alberta')
    assert.match(alexis.zipCode, /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/)
    assert.equal(alexis.line2, 'Apartment 506')

    // Every wrapped line respects the 35-character carrier limit.
    for (const address of results) {
      for (const line of [address.line1, address.line2, address.line3]) {
        if (line && line !== '-') assert.isAtMost(line.length, 35)
      }
    }
  })

  test('CleanAdd.toDocxBuffer produces valid binary Buffer matching DTDC DOCX zip format', ({
    assert,
  }) => {
    const raw = `John Belcastro
4422 Glenmore Ave
Baltimore, MD 21206
United States
Phone: 210-728-4548
114-5610173-1564218-JCAM`

    const cleaner = new CleanAdd()
    const addresses = cleaner.main(raw)
    const buf = CleanAdd.toDocxBuffer(addresses)

    assert.isTrue(Buffer.isBuffer(buf), 'Must return a Node.js Buffer')
    assert.isAbove(buf.length, 500, 'Buffer must contain docx file content')
    // DOCX files are zip archives starting with 'PK' (0x50, 0x4B)
    assert.equal(buf[0], 0x50)
    assert.equal(buf[1], 0x4b)
  })
})
