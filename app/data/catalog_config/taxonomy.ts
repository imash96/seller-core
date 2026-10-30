export const GENDER_CODES: Record<string, string> = {
  M: 'Men',
  W: 'Women',
  K: 'Kids',
  U: 'Unisex',
}

export const CATEGORY_CODES: Record<string, string> = {
  JK: 'Jacket',
  CT: 'Coat',
  BZ: 'Blazer',
  VS: 'Vest',
  SH: 'Shirt',
  TS: 'T-Shirt',
  PT: 'Pants',
  TR: 'Trouser',
  SR: 'Shorts',
  SK: 'Skirt',
  FW: 'Footwear',
  BG: 'Bags',
  HD: 'Home Decor',
  AC: 'Accessories',
}

export const PRODUCT_CODES: Record<string, Record<string, string>> = {
  'Jackets': {
    BK: 'Biker/Motorcycle',
    BM: 'Bomber/Flight',
    CF: 'Cafe Racer',
    HD: 'Hooded',
    QL: 'Quilted/Padded',
  },
  'Coats': {
    CR: 'Car Coat',
    DC: 'Duster Coat',
    OC: 'Overcoat',
    PE: 'Pea Coat',
    TC: 'Trench Coat',
  },
  'Blazers': {
    BZ: 'Blazer',
  },
  'Pants': {
    PT: 'Pants',
    TR: 'Trouser',
  },
  'Shorts': {
    SR: 'Shorts',
  },
  'Skirts': {
    'A-line': 'AL',
    'Asymmetrical': 'AS',
    'Balloon': 'BN',
    'Pencil': 'PN',
    'Bell': 'BE',
    'Godet': 'GD',
    'Pleated': 'PL',
    'Plate (Circle)': 'CP',
    'Wrap': 'WR',
    'Boho': 'BH',
  },
  'Shirts': {
    ST: 'Shirt',
  },
  'T-Shirts': {
    TS: 'TShirt',
  },
  'Vest': {
    VS: 'Vest',
  },
  'Bags': {
    BP: 'Backpack',
    MS: 'Messenger',
    DF: 'Duffle',
    TB: 'Tote Bag',
    HB: 'Handbag',
    SB: 'Sling',
    LP: 'Laptop Bag',
  },
  'Footwear': {
    BT: 'Boots',
    FS: 'Formal Shoe',
    CS: 'Casual Shoe',
    FL: 'Flats/Sandals',
  },
  'Home Decor': {
    PC: 'Pillow Cover',
    HA: 'Home Accent',
    PF: 'Pouf',
    OT: 'Ottoman',
    PM: 'Placemat',
  },
  'Accessories': {
    BL: 'Belt',
    GL: 'Gloves',
    WL: 'Wallet',
    SP: 'Suspenders',
    KC: 'Keychains',
  },
}

export const FIT_CODES: Record<string, string> = {
  SL: 'Slim Fit',
  RG: 'Regular Fit',
  RL: 'Relaxed Fit',
  TF: 'Tailored Fit',
  XX: 'Not Applicable',
}

export const LENGTH_CODES: Record<string, string> = {
  MX: 'Maxi',
  MD: 'Midi',
  MN: 'Mini',
  XX: 'Not Applicable',
}

export const LEATHER_CODES: Record<string, string> = {
  NP: 'Nappa Leather',
  SU: 'Suede Leather',
  FG: 'Full-Grain Leather',
  NB: 'Nubuck Leather',
  SH: 'Shearling',
  CW: 'Cowhide',
  GT: 'Goat',
  BF: 'Buffalo',
}

export const SLEEVE_LENGTH_DESCRIPTIONS = [
  'Long Sleeve',
  '3/4 Sleeve',
  'Sleeveless',
  'Half Sleeve',
  'Short Sleeve',
]

export const APPAREL_CLOSURE_TYPES = [
  'Zipper',
  'Button',
  'Pull-On',
  'Buckle',
  'Drawstring',
  'Hook & Eye',
  'Hook & Loop',
  'Lace-Up',
  'Magnetic',
  'Snap',
  'Tie',
  'Toggle',
]

export const LENGTH_DESCRIPTIONS = [
  'Extra Short Length',
  'Short Length',
  'Standard Length',
  'Long Length',
  'Extra Long Length',
]

export function resolveGenderCode(gender?: string): { code: string; label: string } {
  const g = (gender ?? '').trim().toLowerCase()
  if (g === 'w' || g.startsWith('women') || g.startsWith('female') || g === 'ladies') {
    return { code: 'W', label: 'Women' }
  }
  if (g === 'k' || g.startsWith('kid') || g.startsWith('boy') || g.startsWith('girl')) {
    return { code: 'K', label: 'Kids' }
  }
  if (g === 'u' || g.startsWith('unisex')) {
    return { code: 'U', label: 'Unisex' }
  }
  return { code: 'M', label: 'Men' }
}

export function resolveCategoryAndProductCode(
  type?: string,
  categoryHandle?: string
): {
  categoryCode: string
  categoryName: string
  productCode: string
  productTypeName: string
} {
  const t = (type ?? '').trim().toLowerCase()
  const h = (categoryHandle ?? '').trim().toLowerCase()

  for (const [groupName, groupMap] of Object.entries(PRODUCT_CODES)) {
    for (const [key, val] of Object.entries(groupMap)) {
      const isSkirtGroup = groupName === 'Skirts'
      const code = isSkirtGroup ? val : key
      const label = isSkirtGroup ? key : val
      if (
        t === label.toLowerCase() ||
        t.includes(label.toLowerCase()) ||
        label.toLowerCase().includes(t && t.length >= 3 ? t : '__none__')
      ) {
        const catEntry = Object.entries(CATEGORY_CODES).find(([_, cName]) =>
          groupName.toLowerCase().startsWith(cName.toLowerCase().slice(0, 4))
        )
        return {
          categoryCode: catEntry ? catEntry[0] : 'CT',
          categoryName: catEntry ? catEntry[1] : 'Coat',
          productCode: code,
          productTypeName: label,
        }
      }
    }
  }

  if (h.includes('coat') || t.includes('coat') || t.includes('duster') || t.includes('trench')) {
    return {
      categoryCode: 'CT',
      categoryName: 'Coat',
      productCode: t.includes('duster')
        ? 'DC'
        : t.includes('trench')
          ? 'TC'
          : t.includes('pea')
            ? 'PE'
            : t.includes('car')
              ? 'CR'
              : 'OC',
      productTypeName: type || 'Duster Coat',
    }
  }

  if (h.includes('jacket') || t.includes('jacket') || t.includes('biker') || t.includes('racer')) {
    return {
      categoryCode: 'JK',
      categoryName: 'Jacket',
      productCode: t.includes('cafe')
        ? 'CF'
        : t.includes('bomber')
          ? 'BM'
          : t.includes('quilted')
            ? 'QL'
            : t.includes('hood')
              ? 'HD'
              : 'BK',
      productTypeName: type || 'Biker/Motorcycle',
    }
  }

  if (h.includes('blazer') || t.includes('blazer')) {
    return {
      categoryCode: 'BZ',
      categoryName: 'Blazer',
      productCode: 'BZ',
      productTypeName: type || 'Blazer',
    }
  }

  return {
    categoryCode: 'JK',
    categoryName: 'Jacket',
    productCode: 'BK',
    productTypeName: type || 'Jacket',
  }
}

export function resolveLeatherCode(
  fabricOrMaterial?: string,
  explicitCode?: string
): { code: string; name: string } {
  if (explicitCode && LEATHER_CODES[explicitCode.toUpperCase()]) {
    const code = explicitCode.toUpperCase()
    return { code, name: LEATHER_CODES[code] }
  }
  const text = (fabricOrMaterial ?? '').toLowerCase()
  if (text.includes('suede')) return { code: 'SU', name: 'Suede Leather' }
  if (text.includes('nubuck')) return { code: 'NB', name: 'Nubuck Leather' }
  if (text.includes('shearling')) return { code: 'SH', name: 'Shearling' }
  if (text.includes('cowhide') || text.includes('cow')) return { code: 'CW', name: 'Cowhide' }
  if (text.includes('goat')) return { code: 'GT', name: 'Goat' }
  if (text.includes('buffalo')) return { code: 'BF', name: 'Buffalo' }
  if (text.includes('full-grain') && !text.includes('lambskin')) {
    return { code: 'FG', name: 'Full-Grain Leather' }
  }
  return { code: 'NP', name: 'Nappa Leather' }
}

export function resolveFitCode(fitOrSizeType?: string): { code: string; name: string } {
  const f = (fitOrSizeType ?? '').trim().toUpperCase()
  if (FIT_CODES[f]) {
    return { code: f, name: FIT_CODES[f] }
  }
  const lower = f.toLowerCase()
  if (lower.includes('slim')) return { code: 'SL', name: 'Slim Fit' }
  if (lower.includes('relax')) return { code: 'RL', name: 'Relaxed Fit' }
  if (lower.includes('tailor')) return { code: 'TF', name: 'Tailored Fit' }
  return { code: 'RG', name: 'Regular Fit' }
}
