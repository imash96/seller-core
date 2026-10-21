import { useState } from 'react'
import { router } from '@inertiajs/react'
import {
  MapPin,
  Download,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
  FileJson,
  Copy,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/ui/card'
import { StatusBadge } from '~/ui/badge'

export interface CleanedAddressItem {
  name: string
  companyName: string
  add1: string
  add2: string
  add3: string
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

export function AddressCleanerModule() {
  const [rawText, setRawText] = useState('')
  const [result, setResult] = useState<{ addresses: CleanedAddressItem[]; csv: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const xsrfCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1]

      const response = await fetch('/api/tools/address-clean', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(xsrfCookie ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfCookie) } : {}),
        },
        body: JSON.stringify({ rawText }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to clean addresses')
      }
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    if (!result?.csv) return
    const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cleaned-addresses-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadJSON = () => {
    if (!result?.addresses) return
    const blob = new Blob([JSON.stringify(result.addresses, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cleaned-addresses-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSaveToCustomer = (addr: CleanedAddressItem) => {
    router.post(
      '/address-cleanup/save-customer',
      {
        name: addr.name,
        companyName: addr.companyName,
        line1: addr.line1 || addr.add1,
        line2: addr.line2 || (addr.add2 !== '-' ? addr.add2 : ''),
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode || addr.zipcode.replace(/^'/, ''),
        countryCode: addr.countryCode || 'US',
        phone: addr.phone,
      },
      { preserveScroll: true }
    )
  }

  const copyFormatted = (addr: CleanedAddressItem, idx: number) => {
    const text = [
      addr.name,
      addr.line1,
      addr.line2,
      `${addr.city}, ${addr.state} ${addr.zipCode}`,
      addr.country,
      `Phone: ${addr.phone}`,
    ]
      .filter(Boolean)
      .join('\n')
    navigator.clipboard?.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Input Column */}
      <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Card rounded>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Raw Marketplace Addresses
              </CardTitle>
              <CardDescription className="mt-1">
                Separate multiple addresses with a blank line. Diacritics, 35-char line wraps,
                state codes, Phone/Ext, and VAT/IOSS tags are normalized automatically.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Input Blocks (Blank-line separated)
                  </label>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={15}
                  className="w-full px-3.5 py-3 border border-border bg-background rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-xs leading-relaxed"
                  placeholder="John Doe&#10;123 Main Street&#10;New York, NY 10001&#10;United States&#10;Phone: +1 212-555-0199&#10;ORD-1001"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={loading || !rawText.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  {loading ? 'Cleaning & Validating…' : 'Clean & Normalize Addresses'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRawText('')
                    setResult(null)
                  }}
                  className="px-4 py-2.5 border border-border rounded-xl text-xs font-semibold hover:bg-muted transition cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right Output Column */}
      <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-2">
        <Card rounded>
          <CardHeader>
            <div>
              <CardTitle>
                Cleaned Carrier-Ready Output ({result?.addresses?.length ?? 0})
              </CardTitle>
              <CardDescription className="mt-1">
                35-character line-wrapped fields (`add1`, `add2`, `add3`), 2-letter state codes, and compliance flags.
              </CardDescription>
            </div>
            {result && result.addresses.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download CSV
                </button>
                <button
                  type="button"
                  onClick={downloadJSON}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  <FileJson className="w-3.5 h-3.5" /> Export JSON
                </button>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {!result || result.addresses.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Paste one or more raw addresses on the left and click{' '}
                <strong>Clean & Normalize Addresses</strong>.
              </div>
            ) : (
              <div className="space-y-4">
                {result.addresses.map((addr, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 hover:border-indigo-500/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-foreground">{addr.name}</h4>
                          {addr.ref && (
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-mono text-[11px] font-semibold">
                              Ref: {addr.ref}
                            </span>
                          )}
                        </div>
                        {addr.buyerName && addr.buyerName !== addr.name && (
                          <p className="text-xs text-muted-foreground">Buyer: {addr.buyerName}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {addr.warnings?.length === 0 ? (
                          <StatusBadge label="35-Char Compliant" variant="success" />
                        ) : (
                          <StatusBadge
                            label={`${addr.warnings.length} Overflow Warning`}
                            variant="warning"
                          />
                        )}
                        {addr.isSignatureRequired && (
                          <StatusBadge label="Signature Req" variant="info" />
                        )}
                        {addr.isVATorIOSS && (
                          <StatusBadge label={`Tax/IOSS: ${addr.vatOrIoss || 'Yes'}`} variant="purple" />
                        )}
                      </div>
                    </div>

                    {addr.warnings && addr.warnings.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                        {addr.warnings.map((w, wi) => (
                          <div key={wi} className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-card p-3 rounded-lg border border-border">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                          Add Line 1 ({addr.add1.length}/35)
                        </span>
                        <span className="font-mono font-medium text-foreground">{addr.add1}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                          Add Line 2 ({addr.add2 === '-' ? 0 : addr.add2.length}/35)
                        </span>
                        <span className="font-mono font-medium text-foreground">{addr.add2}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                          Add Line 3 ({addr.add3 === '-' ? 0 : addr.add3.length}/35)
                        </span>
                        <span className="font-mono font-medium text-foreground">{addr.add3}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                          City / State / Zip
                        </span>
                        <span className="font-semibold text-foreground">
                          {addr.city}, {addr.state} {addr.zipCode}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                          Country ({addr.countryCode})
                        </span>
                        <span className="font-semibold text-foreground">{addr.country}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                          Phone {addr.ext ? `(Ext ${addr.ext})` : ''}
                        </span>
                        <span className="font-mono text-foreground">{addr.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => copyFormatted(addr, index)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium cursor-pointer"
                      >
                        {copiedIdx === index ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveToCustomer(addr)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Save to Customer Addresses
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
