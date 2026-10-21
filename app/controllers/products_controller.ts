import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Brand from '#models/brand'
import ProductCategory from '#models/product_category'
import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import ChannelListing from '#models/channel_listing'
import SellerAccount from '#models/seller_account'
import { CatalogService } from '../services/catalog_service.js'
import { WorkspaceLookupService } from '../services/workspace_lookup_service.js'
import { generateEntityId } from '../utils/generate_entity_id.js'
import {
  createProductValidator,
  updateProductValidator,
  createVariantValidator,
  updateBrandValidator,
  updateCategoryValidator,
} from '#validators/operations'

export default class ProductsController {
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [products, channelListings, savedViews, sharedLookups] = await Promise.all([
      Product.query()
        .where('userId', user.id)
        .preload('brand')
        .preload('category')
        .preload('variants', (q) => q.preload('variantAttributes').preload('listings'))
        .orderBy('createdAt', 'desc')
        .limit(100),
      ChannelListing.query()
        .where('userId', user.id)
        .preload('product')
        .preload('productVariant')
        .preload('sellerAccount')
        .orderBy('createdAt', 'desc')
        .limit(100),
      WorkspaceLookupService.savedViewsFor(user.id, 'products'),
      WorkspaceLookupService.lookups(user.id),
    ])
    return inertia.render('products', {
      ...sharedLookups,
      products: products.map((p) => p.serialize()),
      channelListings: channelListings.map((c) => c.serialize()),
      savedViews,
    })
  }

  async inventoryPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [products, channelListings, savedViews, sharedLookups] = await Promise.all([
      Product.query()
        .where('userId', user.id)
        .preload('brand')
        .preload('category')
        .preload('variants', (q) => q.preload('variantAttributes').preload('listings'))
        .orderBy('createdAt', 'desc')
        .limit(100),
      ChannelListing.query()
        .where('userId', user.id)
        .preload('product')
        .preload('productVariant')
        .preload('sellerAccount')
        .orderBy('createdAt', 'desc')
        .limit(100),
      WorkspaceLookupService.savedViewsFor(user.id, 'products'),
      WorkspaceLookupService.lookups(user.id),
    ])
    return inertia.render('inventory', {
      ...sharedLookups,
      products: products.map((p) => p.serialize()),
      channelListings: channelListings.map((c) => c.serialize()),
      savedViews,
    })
  }

  async catalogsPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [products, channelListings, savedViews, sharedLookups] = await Promise.all([
      Product.query()
        .where('userId', user.id)
        .preload('brand')
        .preload('category')
        .preload('variants', (q) => q.preload('variantAttributes').preload('listings'))
        .orderBy('createdAt', 'desc')
        .limit(100),
      ChannelListing.query()
        .where('userId', user.id)
        .preload('product')
        .preload('productVariant')
        .preload('sellerAccount')
        .orderBy('createdAt', 'desc')
        .limit(100),
      WorkspaceLookupService.savedViewsFor(user.id, 'products'),
      WorkspaceLookupService.lookups(user.id),
    ])
    return inertia.render('catalogs', {
      ...sharedLookups,
      products: products.map((p) => p.serialize()),
      channelListings: channelListings.map((c) => c.serialize()),
      savedViews,
    })
  }

  async storeProduct({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createProductValidator)

    try {
      const rawHasVariants = (payload as any).hasVariants
      const hasVariants =
        typeof rawHasVariants === 'string' ? rawHasVariants === 'true' : Boolean(rawHasVariants)
      const rawVD = (payload as any).variationDimensions
      const variationDimensions: string[] =
        typeof rawVD === 'string'
          ? rawVD
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : Array.isArray(rawVD)
            ? rawVD
            : []
      const product = await CatalogService.createProduct({
        userId: user.id,
        brandId: payload.brandId ?? null,
        categoryId: payload.categoryId ?? null,
        title: payload.title,
        description: payload.description ?? null,
        skuPrefix: (payload as any).skuPrefix ?? payload.sku,
        hasVariants,
        variationDimensions,
        variants: [
          {
            sku: payload.sku,
            title: payload.title,
            asin: payload.asin ?? null,
            currencyCode: payload.currencyCode || 'USD',
            retailPrice: payload.retailPrice,
            costPrice: payload.costPrice ?? 0,
            manufacturingCost: payload.manufacturingCost ?? 0,
            packagingCost: payload.packagingCost ?? 0,
            stockOnHand: payload.stockOnHand ?? 0,
          },
        ],
      })
      session.flash('success', `Product "${product.title}" (SKU: ${payload.sku}) created.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to create product')
    }
    return response.redirect().back()
  }

  async updateProduct({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateProductValidator)
    const product = await Product.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    product.merge(payload)
    if (request.input('skuPrefix')) {
      product.skuPrefix = String(request.input('skuPrefix')).trim()
    }
    await product.save()
    session.flash('success', `Product "${product.title}" updated.`)
    return response.redirect().back()
  }

  async deleteProduct({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const product = await Product.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    product.status = 'archived'
    await product.save()
    session.flash('success', `Product "${product.title}" archived.`)
    return response.redirect().back()
  }

  async storeVariant({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createVariantValidator)
    const product = await Product.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()

    await db.transaction(async (trx) => {
      const variant = await ProductVariant.create(
        {
          userId: user.id,
          productId: product.id,
          sku: payload.sku,
          title: payload.title,
          retailPrice: payload.retailPrice.toFixed(2),
          costPrice: (payload.costPrice ?? 0).toFixed(2),
          stockOnHand: payload.stockOnHand ?? 0,
          stockReserved: 0,
          currencyCode: 'USD',
          isDefault: false,
          status: 'active',
        },
        { client: trx }
      )
      if (payload.attributeName && payload.attributeValue) {
        await trx.table('product_variant_attributes').insert({
          id: generateEntityId('pattr'),
          user_id: user.id,
          product_variant_id: variant.id,
          attribute_name: payload.attributeName,
          attribute_value: payload.attributeValue,
          created_at: new Date(),
        })
      }
      if (!product.hasVariants && product.variationDimensions.length === 0) {
        product.useTransaction(trx)
        product.hasVariants = true
        await product.save()
      }
    })

    session.flash('success', `Variant ${payload.sku} created.`)
    return response.redirect().back()
  }

  async updateVariantStock({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const variant = await ProductVariant.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    const stockOnHand = Number(request.input('stockOnHand', variant.stockOnHand))
    const retailPrice = Number(request.input('retailPrice', variant.retailPrice))
    if (stockOnHand < 0 || retailPrice < 0) {
      session.flash('error', 'Stock and price must be non-negative.')
      return response.redirect().back()
    }

    variant.stockOnHand = stockOnHand
    variant.retailPrice = retailPrice.toFixed(2)
    await variant.save()

    session.flash(
      'success',
      `Updated SKU ${variant.sku}: Stock=${stockOnHand}, Price=${variant.retailPrice}`
    )
    return response.redirect().back()
  }

  async deleteVariant({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const variant = await ProductVariant.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    await variant.delete()
    session.flash('success', 'Variant deleted.')
    return response.redirect().back()
  }

  async storeBrand({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const name = String(request.input('name', '')).trim()
    if (!name) {
      session.flash('error', 'Brand name is required.')
      return response.redirect().back()
    }
    const slug =
      String(request.input('slug', '')).trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    await Brand.updateOrCreate(
      { userId: user.id, slug },
      {
        userId: user.id,
        name,
        slug,
        websiteUrl: request.input('websiteUrl') || null,
        isActive: true,
      }
    )
    session.flash('success', `Brand "${name}" saved.`)
    return response.redirect().back()
  }

  async updateBrand({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateBrandValidator)
    const brand = await Brand.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    brand.merge(payload)
    await brand.save()
    session.flash('success', `Brand "${brand.name}" updated.`)
    return response.redirect().back()
  }

  async deleteBrand({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const brand = await Brand.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    await brand.delete()
    session.flash('success', 'Brand deleted.')
    return response.redirect().back()
  }

  async storeCategory({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const name = String(request.input('name', '')).trim()
    if (!name) {
      session.flash('error', 'Category name is required.')
      return response.redirect().back()
    }
    const slug =
      String(request.input('slug', '')).trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    await ProductCategory.updateOrCreate(
      { userId: user.id, slug },
      {
        userId: user.id,
        name,
        slug,
        parentCategoryId: request.input('parentCategoryId') || null,
        taxonomyPath: `Catalog > ${name}`,
        attributesSchema: [],
      }
    )
    session.flash('success', `Category "${name}" saved.`)
    return response.redirect().back()
  }

  async updateCategory({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateCategoryValidator)
    const category = await ProductCategory.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    category.merge(payload)
    await category.save()
    session.flash('success', `Category "${category.name}" updated.`)
    return response.redirect().back()
  }

  async deleteCategory({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const category = await ProductCategory.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    await category.delete()
    session.flash('success', 'Category deleted.')
    return response.redirect().back()
  }

  async storeChannelListing({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const productVariantId = String(request.input('productVariantId', '')).trim()
    const sellerAccountId = String(request.input('sellerAccountId', '')).trim()
    const channelSku = String(request.input('channelSku', '')).trim()
    const externalListingId = String(request.input('externalListingId', '')).trim()
    const listedPrice = Number(request.input('listedPrice', 0))

    const variant = await ProductVariant.query()
      .where('userId', user.id)
      .andWhere('id', productVariantId)
      .firstOrFail()
    const sellerAccount = await SellerAccount.query()
      .where('userId', user.id)
      .andWhere('id', sellerAccountId)
      .firstOrFail()

    await ChannelListing.create({
      userId: user.id,
      sellerAccountId: sellerAccount.id,
      productId: variant.productId,
      productVariantId: variant.id,
      externalListingId: externalListingId || `LST-${Date.now()}`,
      externalSku: channelSku || variant.sku,
      currencyCode: sellerAccount.defaultCurrency || 'USD',
      listedPrice: (listedPrice > 0 ? listedPrice : Number(variant.retailPrice)).toFixed(2),
      allocatedQuantity: Number(request.input('allocatedQuantity', variant.stockOnHand)),
      listingStatus: 'active',
      publicationStatus: 'published',
      syncStatus: 'synced',
      lastSyncedAt: DateTime.now(),
    })

    session.flash(
      'success',
      `Published SKU ${variant.sku} to ${sellerAccount.accountName} (${externalListingId || variant.sku}).`
    )
    return response.redirect().back()
  }

  async deleteChannelListing({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const listing = await ChannelListing.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    await listing.delete()
    session.flash('success', 'Channel listing removed.')
    return response.redirect().back()
  }
}
