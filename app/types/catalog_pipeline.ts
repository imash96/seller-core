export interface MedusaCategoryMetadata {
  thumbnail?: string
  tags?: string[]
  gender?: 'Male' | 'Female' | 'Unisex' | string
  google_product_category_id?: string
  amazon_browse_node?: string
  etsy_taxonomy_id?: string
  ebay_category_id?: string
  [key: string]: unknown
}

export interface MedusaProductCategory {
  id?: string
  name: string
  description?: string
  handle: string
  mpath?: string
  rank?: number
  is_active?: boolean
  parent_category_id?: string | null
  parent_category?: Record<string, unknown> | null
  category_children?: MedusaProductCategory[]
  metadata?: MedusaCategoryMetadata
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface CatalogAttributes {
  material?: string
  fabric?: string
  lining?: string
  hardware?: string
  closure?: string
  closure_type?: string[]
  coat_silhouette_type?: string
  collar?: string
  collar_type?: string
  pocket_description?: string
  pockets?: string[]
  sleeve_length?: string
  sleeve_type?: string
  model_name?: string
  gender?: string
  size_type?: string
  age_group?: string
  fit?: string
  length?: string
  leather_code?: string
  price_tier?: '01' | '02' | '03'
  bullets?: string[]
  generic_keyword?: string[]
  special_feature?: string[]
  [key: string]: unknown
}

export interface CatalogVariantSpec {
  color?: string[]
  size?: string[]
  size_group?: 'alpha' | 'numeric' | 'age' | 'pillowCover'
}

export interface CatalogJsonEntry {
  title: string // max 60 chars
  title75?: string // max 75 chars
  title80?: string // max 80 chars
  subTitle?: string // max 60 chars
  subTitle125?: string // max 125 chars
  type?: string // e.g. "Duster Coat"
  category_handle?: string // e.g. "mens/apparel/outerwear/coats/duster-coats"
  description?: string // SEO product description
  shortDescription?: string // max 500 chars (Amazon compatible)
  extendedDescription?: string // max 3000 chars with emojis (eBay & Etsy compatible)
  pattern?: string // e.g. "Solid"
  attributes?: CatalogAttributes
  images?: string[]
  tags?: string[]
  // Support both "varaints" (sample JSON spelling) and "variants"
  varaints?: CatalogVariantSpec
  variants?: CatalogVariantSpec
}

export type CatalogJsonPayload = Record<string, CatalogJsonEntry>

export type ListingPlatform = 'medusa' | 'amazon' | 'ebay' | 'etsy'

export type SkuFormatMode = 'standard' | 'prefixed_color' | 'catalog_key'
export type PriceTierCode = '01' | '02' | '03'
