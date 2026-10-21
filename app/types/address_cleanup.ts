export interface LineAdd {
    add1: string
    add2: string
    add3: string
}

export interface CleanedAddress extends LineAdd {
    name: string
    companyName: string
    line1: string
    line2: string
    line3: string
    city: string
    state: string
    zipcode: string
    zipCode: string
    country: string
    countryCode: string
    ref: string
    addLength: number
    phone: string
    number: string
    ext?: string
    buyerName?: string
    addressType?: string
    vatOrIoss?: string
    buyerNationalId?: string
    isNameOverflow?: boolean
    isAddOverflow?: boolean
    isSingleName?: boolean
    isSignatureRequired?: boolean
    isVATorIOSS?: boolean
    isBuyerNationalId?: boolean
    warnings: string[]
}