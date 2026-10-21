import { CleanAdd } from '../app/services/address_cleanup_service.js'

const sampleInput = `John Belcastro
4422 GLENMORE AVE
BALTIMORE, MD 21206-2009
Address Type: Residential
Contact Buyer: John
Phone: +1 210-728-4548 ext. 56535
114-5610173-1564218-JCAM


Samuel Anton
370 LITTLE CYPRESS RD
CALVERT CITY, KY 42029-9242
Address Type: Residential
Contact Buyer: bitethesook
Phone: +1 213-442-1463 ext. 30548
112-8068168-1713848-JCAM


Andrew
11713 POTOMAC CROSSING WAY APT 24
FAIRFAX, VA 22030-7931
Address Type: Residential
Contact Buyer: Andrew
Phone: +1 619-854-2705 ext. 98853
113-5194261-4365863-JCAM


Mark Ponder
675 Eastland Drive
Lincoln, AL 35096
United States
4208118056


David DiTrapani 
568 Sterling Pl 
Brooklyn, NY 11238-4802 
United States 
Phone: +1 917-251-7334
06-15326-16231


John Reichle
3517 Chandler Ln
Deer Park, TX 77536-6073
United States
4205849042


Terry Horner
34 Village Drive
Asheville, NC 28803
United States
Phone: 18287126340
4200837879


Terry Lee
5308 Yoshino Ter
Powder Springs, GA 30127-6006
United States
4200450423


Jerry A. Dallara
1034 Carriage Ln
Saxonburg, PA 16056-2503
United States
Phone: 724.355.8118
4199055141


Stefan Killermann
Bahnhofplatz 3
85072 Eichstatt
Germany
Phone: +49 8421 903117
06-15270-60878


Ahmed Ali Tubishat
19355 Ne 10th Ave
Apt 114
NORTH MIAMI BEACH, FL 33179-5708
United States
4194734017



Howard Polin
109-10 Queens Blvd.
Apt 4C
Forest Hills, NY 11375
United States
4193495001



Abdi Abbajobir
Kepserstr. 12
Germany
85356 Freising
Germany
Phone: 00491622986786
4195369136
IOSS: IM3720000224


Jorge Riano Allan 
Los Palacios 580 
San Fernando, O'Higgins 3070000 
Chile 
Phone: +56 9 8527 7587
07-15258-45749
RUT ID:592553600


Alexis Velez 
1802 92 Avenue SW 
Apartment 506 
Calgary, AB T2V 4W6 
Canada 
Phone: +1 403-708-0426
16-15246-63570`

console.log('=== Address Cleanup Service Test ===\n')

const cleaner = new CleanAdd()
try {
  const results = cleaner.main(sampleInput)
  console.log(`Total addresses parsed: ${results.length}\n`)

  for (let idx = 0; idx < results.length; idx++) {
    const r = results[idx]
    console.log(`--- Address #${idx + 1} ---`)
    console.log(`  Name:      "${r.name}"`)
    console.log(`  Company:   "${r.companyName}"`)
    console.log(`  Add1:      "${r.add1}" (${r.add1 === '-' ? 0 : r.add1.length}/35)`)
    console.log(`  Add2:      "${r.add2}" (${r.add2 === '-' ? 0 : r.add2.length}/35)`)
    console.log(`  Add3:      "${r.add3}" (${r.add3 === '-' ? 0 : r.add3.length}/35)`)
    console.log(`  City:      "${r.city}"`)
    console.log(`  State:     "${r.state}"`)
    console.log(`  Zip:       "${r.zipcode}" (raw: "${r.zipCode}")`)
    console.log(`  Country:   "${r.country}" (${r.countryCode})`)
    console.log(`  Phone:     "${r.phone}"`)
    if (r.ext) console.log(`  Ext:       "${r.ext}"`)
    console.log(`  Ref:       "${r.ref}"`)
    if (r.buyerName) console.log(`  Buyer:     "${r.buyerName}"`)
    if (r.addressType) console.log(`  AddrType:  "${r.addressType}"`)
    if (r.vatOrIoss) console.log(`  VAT/IOSS:  "${r.vatOrIoss}"`)
    if (r.buyerNationalId) console.log(`  NationalId:"${r.buyerNationalId}"`)
    if (r.isSignatureRequired) console.log(`  ** Signature Required`)
    if (r.warnings.length > 0) {
      console.log(`  Warnings:`)
      for (const w of r.warnings) console.log(`    - ${w}`)
    }
    console.log('')
  }

  // Validate critical expectations
  const checks: Array<{ label: string; pass: boolean }> = []

  // #1 John Belcastro
  const a1 = results[0]
  checks.push({ label: 'A1: name correct', pass: a1.name === 'John Belcastro' })
  checks.push({ label: 'A1: add1', pass: a1.add1 === '4422 Glenmore Ave' })
  checks.push({ label: 'A1: city', pass: a1.city === 'Baltimore' })
  checks.push({ label: 'A1: state', pass: a1.state === 'Maryland' })
  checks.push({ label: 'A1: zip', pass: a1.rawZip === '21206' || a1.zipCode === '21206' })
  checks.push({ label: 'A1: country US', pass: a1.country === 'United States' })
  checks.push({ label: 'A1: phone has ext', pass: a1.ext === '56535' })
  checks.push({ label: 'A1: ref', pass: a1.ref === '114-5610173-1564218-JCAM' })
  checks.push({ label: 'A1: buyer', pass: a1.buyerName === 'John' })
  checks.push({ label: 'A1: addressType', pass: a1.addressType === 'Residential' })

  // #3 Andrew (single name)
  const a3 = results[2]
  checks.push({ label: 'A3: single name flag', pass: a3.isSingleName === true })

  // #4 Mark Ponder (no phone, no buyer, has country)
  const a4 = results[3]
  checks.push({ label: 'A4: name', pass: a4.name === 'Mark Ponder' })
  checks.push({ label: 'A4: country US', pass: a4.country === 'United States' })
  checks.push({ label: 'A4: ref', pass: a4.ref === '4208118056' })
  checks.push({ label: 'A4: state Alabama', pass: a4.state === 'Alabama' })

  // #7 Terry Horner (phone without +1, with country)
  const a7 = results[6]
  checks.push({ label: 'A7: phone normalized', pass: a7.phone !== '000-000-0000' })

  // #9 Jerry Dallara (dot-separated phone)
  const a9 = results[8]
  checks.push({ label: 'A9: phone dot-sep', pass: a9.phone !== '000-000-0000' })

  // #10 Stefan Killermann (Germany, EU zip-city)
  const a10 = results[9]
  checks.push({ label: 'A10: country Germany', pass: a10.country === 'Germany' })
  checks.push({ label: 'A10: countryCode DE', pass: a10.countryCode === 'DE' })
  checks.push({ label: 'A10: city Eichstatt', pass: a10.city.toLowerCase().includes('eichst') })
  checks.push({ label: 'A10: zip 85072', pass: a10.zipCode === '85072' || a10.rawZip === '85072' })

  // #13 Abdi Abbajobir (double Germany, IOSS)
  const a13 = results[12]
  checks.push({ label: 'A13: IOSS set', pass: a13.isVATorIOSS === true })
  checks.push({ label: 'A13: vatOrIoss value', pass: a13.vatOrIoss === 'IM3720000224' })
  checks.push({ label: 'A13: country Germany', pass: a13.country === 'Germany' })
  checks.push({ label: 'A13: countryCode DE', pass: a13.countryCode === 'DE' })

  // #13 Abdi: Germany should NOT appear as add2 (mid-address country stripped)
  checks.push({ label: 'A13: add2 not Germany', pass: a13.add2 !== 'Germany' })
  checks.push({ label: 'A13: city Freising', pass: a13.city.toLowerCase().includes('freising') })

  // #14 Jorge (Chile, RUT ID → buyerNationalId, not vatOrIoss)
  const a14 = results[13]
  checks.push({ label: 'A14: country Chile', pass: a14.country === 'Chile' })
  checks.push({ label: 'A14: countryCode CL', pass: a14.countryCode === 'CL' })
  checks.push({ label: 'A14: rutId in buyerNationalId', pass: a14.buyerNationalId === '592553600' })
  checks.push({ label: 'A14: vatOrIoss undefined', pass: a14.vatOrIoss === undefined })

  // #15 Alexis Velez (Canada, alphanumeric postal code)
  const a15 = results[14]
  checks.push({ label: 'A15: country Canada', pass: a15.country === 'Canada' })
  checks.push({ label: 'A15: countryCode CA', pass: a15.countryCode === 'CA' })
  checks.push({ label: 'A15: state Alberta', pass: a15.state === 'Alberta' })
  checks.push({ label: 'A15: zip alphanumeric', pass: /[A-Z]\d[A-Z]/.test(a15.zipCode) })

  console.log('\n=== Validation Checks ===')
  let passed = 0
  let failed = 0
  for (const c of checks) {
    const icon = c.pass ? '✓' : '✗'
    console.log(`  ${icon} ${c.label}`)
    c.pass ? passed++ : failed++
  }
  console.log(`\n  ${passed}/${checks.length} passed, ${failed} failed`)

} catch (e) {
  console.error('FATAL ERROR:', e)
}
