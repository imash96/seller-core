export interface ColorCodeEntry {
  colorMap: string
  colorName: string
}

export const COLOR_CODES: Record<string, ColorCodeEntry> = {
  BLK: { colorMap: 'Black', colorName: 'Black' },
  WHT: { colorMap: 'White', colorName: 'White' },
  RED: { colorMap: 'Red', colorName: 'Red' },
  BLU: { colorMap: 'Blue', colorName: 'Blue' },
  LBU: { colorMap: 'Blue', colorName: 'Light Blue' },
  DBU: { colorMap: 'Blue', colorName: 'Dark Blue' },
  NBU: { colorMap: 'Blue', colorName: 'Navy Blue' },
  GRN: { colorMap: 'Green', colorName: 'Green' },
  LGR: { colorMap: 'Green', colorName: 'Light Green' },
  DGR: { colorMap: 'Green', colorName: 'Dark Green' },
  OGR: { colorMap: 'Green', colorName: 'Olive Green' },
  BRN: { colorMap: 'Brown', colorName: 'Brown' },
  DBR: { colorMap: 'Brown', colorName: 'Dark Brown' },
  LBR: { colorMap: 'Brown', colorName: 'Light Brown' },
  YLW: { colorMap: 'Yellow', colorName: 'Yellow' },
  MYL: { colorMap: 'Yellow', colorName: 'Mustard Yellow' },
  ORG: { colorMap: 'Orange', colorName: 'Orange' },
  PNK: { colorMap: 'Pink', colorName: 'Pink' },
  PUR: { colorMap: 'Purple', colorName: 'Purple' },
  GRY: { colorMap: 'Gray', colorName: 'Gray' },
  MAR: { colorMap: 'Red', colorName: 'Maroon' },
  DTN: { colorMap: 'Beige', colorName: 'Dark Tan' },
  TAN: { colorMap: 'Beige', colorName: 'Tan' },
  MTN: { colorMap: 'Beige', colorName: 'Mango Tan' },
  BGE: { colorMap: 'Beige', colorName: 'Beige' },
  BRG: { colorMap: 'Red', colorName: 'Burgundy' },
  COG: { colorMap: 'Brown', colorName: 'Cognac' },
  CHS: { colorMap: 'Brown', colorName: 'Chestnut' },
  ESP: { colorMap: 'Brown', colorName: 'Espresso' },
  TAU: { colorMap: 'Beige', colorName: 'Taupe' },
  EBN: { colorMap: 'Black', colorName: 'Ebony' },
  WAL: { colorMap: 'Brown', colorName: 'Walnut' },
  SLV: { colorMap: 'Silver', colorName: 'Silver' },
  GLD: { colorMap: 'Gold', colorName: 'Gold' },
  BNZ: { colorMap: 'Bronze', colorName: 'Bronze' },
  TQR: { colorMap: 'Turquoise', colorName: 'Turquoise' },
  OFW: { colorMap: 'Off White', colorName: 'Off White' },
  MCL: { colorMap: 'Multicolor', colorName: 'Multicolor' },
}

export function resolveColorInfo(colorCode: string): {
  code: string
  colorMap: string
  colorName: string
} {
  const upper = (colorCode ?? 'BLK').trim().toUpperCase()
  const found = COLOR_CODES[upper]
  if (found) {
    return { code: upper, colorMap: found.colorMap, colorName: found.colorName }
  }
  return { code: upper, colorMap: colorCode, colorName: colorCode }
}
