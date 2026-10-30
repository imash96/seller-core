export type SizeGroupKey = 'alpha' | 'numeric' | 'age' | 'pillowCover'

export interface SizeDataEntry {
  'Size Key': string
  'Size Value': string
}

export const SIZE_DATA: Record<SizeGroupKey, SizeDataEntry[]> = {
  alpha: [
    { 'Size Key': 'XX-Small', 'Size Value': '2XS' },
    { 'Size Key': 'X-Small', 'Size Value': 'XS' },
    { 'Size Key': 'Small', 'Size Value': 'S' },
    { 'Size Key': 'Medium', 'Size Value': 'M' },
    { 'Size Key': 'Large', 'Size Value': 'L' },
    { 'Size Key': 'X-Large', 'Size Value': 'XL' },
    { 'Size Key': 'XX-Large', 'Size Value': '2XL' },
    { 'Size Key': '3X-Large', 'Size Value': '3XL' },
    { 'Size Key': '4X-Large', 'Size Value': '4XL' },
    { 'Size Key': '5X-Large', 'Size Value': '5XL' },
    { 'Size Key': 'Custom Size', 'Size Value': 'CS' },
  ],
  numeric: [
    { 'Size Key': '28', 'Size Value': '28' },
    { 'Size Key': '30', 'Size Value': '30' },
    { 'Size Key': '32', 'Size Value': '32' },
    { 'Size Key': '34', 'Size Value': '34' },
    { 'Size Key': '36', 'Size Value': '36' },
    { 'Size Key': '38', 'Size Value': '38' },
    { 'Size Key': '40', 'Size Value': '40' },
    { 'Size Key': '42', 'Size Value': '42' },
    { 'Size Key': '44', 'Size Value': '44' },
    { 'Size Key': '46', 'Size Value': '46' },
    { 'Size Key': '48', 'Size Value': '48' },
    { 'Size Key': '50', 'Size Value': '50' },
    { 'Size Key': '52', 'Size Value': '52' },
    { 'Size Key': '54', 'Size Value': '54' },
    { 'Size Key': '56', 'Size Value': '56' },
    { 'Size Key': '58', 'Size Value': '58' },
    { 'Size Key': '60', 'Size Value': '60' },
    { 'Size Key': 'Custom Size', 'Size Value': 'CS' },
  ],
  age: [
    { 'Size Key': '0-3M', 'Size Value': '0-3 Months' },
    { 'Size Key': '3-6M', 'Size Value': '3-6 Months' },
    { 'Size Key': '6-9M', 'Size Value': '6-9 Months' },
    { 'Size Key': '9-12M', 'Size Value': '9-12 Months' },
    { 'Size Key': '12-18M', 'Size Value': '12-18 Months' },
    { 'Size Key': '18-24M', 'Size Value': '18-24 Months' },
    { 'Size Key': '2-3Y', 'Size Value': '2-3 Years' },
    { 'Size Key': '3-4Y', 'Size Value': '3-4 Years' },
    { 'Size Key': '4-5Y', 'Size Value': '4-5 Years' },
    { 'Size Key': '5-6Y', 'Size Value': '5-6 Years' },
    { 'Size Key': '6-7Y', 'Size Value': '6-7 Years' },
    { 'Size Key': '7-8Y', 'Size Value': '7-8 Years' },
    { 'Size Key': '8-9Y', 'Size Value': '8-9 Years' },
    { 'Size Key': '9-10Y', 'Size Value': '9-10 Years' },
    { 'Size Key': '10-12Y', 'Size Value': '10-12 Years' },
    { 'Size Key': '12-14Y', 'Size Value': '12-14 Years' },
    { 'Size Key': '14-16Y', 'Size Value': '14-16 Years' },
    { 'Size Key': '16-18Y', 'Size Value': '16-18 Years' },
    { 'Size Key': 'Custom Size', 'Size Value': 'CS' },
  ],
  pillowCover: [
    { 'Size Key': '16x16', 'Size Value': '16 x 16 inch' },
    { 'Size Key': '18x18', 'Size Value': '18 x 18 inch' },
    { 'Size Key': '20x20', 'Size Value': '20 x 20 inch' },
    { 'Size Key': '22x22', 'Size Value': '22 x 22 inch' },
    { 'Size Key': '24x24', 'Size Value': '24 x 24 inch' },
    { 'Size Key': '16x20', 'Size Value': '16 x 20 inch' },
    { 'Size Key': '18x24', 'Size Value': '18 x 24 inch' },
    { 'Size Key': '20x26', 'Size Value': '20 x 26 inch' },
    { 'Size Key': '20x30', 'Size Value': '20 x 30 inch' },
    { 'Size Key': '20x36', 'Size Value': '20 x 36 inch' },
    { 'Size Key': 'Custom Size', 'Size Value': 'Custom Size' },
  ],
}

export function resolveSizeInfo(
  sizeCode: string,
  group: SizeGroupKey = 'alpha'
): {
  sizeKey: string
  sizeValue: string
  sizeIndex: number
  sizeGroup: string
} {
  const clean = (sizeCode ?? 'M').trim()
  const list = SIZE_DATA[group] ?? SIZE_DATA.alpha
  const idx = list.findIndex(
    (entry) =>
      entry['Size Value'].toLowerCase() === clean.toLowerCase() ||
      entry['Size Key'].toLowerCase() === clean.toLowerCase()
  )
  if (idx >= 0) {
    return {
      sizeKey: list[idx]['Size Key'],
      sizeValue: list[idx]['Size Value'],
      sizeIndex: idx,
      sizeGroup: group,
    }
  }

  for (const [gName, gList] of Object.entries(SIZE_DATA)) {
    const foundIdx = gList.findIndex(
      (entry) =>
        entry['Size Value'].toLowerCase() === clean.toLowerCase() ||
        entry['Size Key'].toLowerCase() === clean.toLowerCase()
    )
    if (foundIdx >= 0) {
      return {
        sizeKey: gList[foundIdx]['Size Key'],
        sizeValue: gList[foundIdx]['Size Value'],
        sizeIndex: foundIdx,
        sizeGroup: gName,
      }
    }
  }

  return {
    sizeKey: clean,
    sizeValue: clean.toUpperCase(),
    sizeIndex: 3,
    sizeGroup: group,
  }
}
