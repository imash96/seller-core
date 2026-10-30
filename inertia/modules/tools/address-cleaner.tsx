import { useState, useRef } from 'react'
import { router } from '@inertiajs/react'
import {
  MapPin,
  Download,
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
  Copy,
  X,
  Table2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/ui/card'
import { StatusBadge } from '~/ui/badge'

export interface CleanedAddressItem {
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
  phone: string
  number: string
  email?: string
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
  const [result, setResult] = useState<{
    addresses: CleanedAddressItem[]
    csv: string
    docxBase64?: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloadingDocx, setDownloadingDocx] = useState(false)
  const [error, setError] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(true)
  const tableRef = useRef<HTMLTableElement>(null)

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
      console.log(data)
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

  const selectTable = () => {
    if (!tableRef.current) return
    const range = document.createRange()
    range.selectNodeContents(tableRef.current)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }

  const downloadDOCX = async () => {
    if (!result?.addresses?.length) return

    // Fast path: if docxBase64 was already returned in the clean response, decode & download immediately
    if (result.docxBase64) {
      const binary = atob(result.docxBase64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'DTDC Label.docx'
      a.click()
      URL.revokeObjectURL(url)
      return
    }

    // Fallback: request binary `.docx` stream from `/api/tools/address-clean/docx`
    setDownloadingDocx(true)
    try {
      const xsrfCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1]

      const response = await fetch('/api/tools/address-clean/docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(xsrfCookie ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfCookie) } : {}),
        },
        body: JSON.stringify({ rawText, addresses: result.addresses }),
      })
      if (!response.ok) {
        throw new Error('Failed to generate DTDC Label DOCX file')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'DTDC Label.docx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download DOCX')
    } finally {
      setDownloadingDocx(false)
    }
  }

  const handleSaveToCustomer = (addr: CleanedAddressItem) => {
    router.post(
      '/address-cleanup/save-customer',
      {
        name: addr.name,
        companyName: addr.companyName,
        line1: addr.line1,
        line2: addr.line2 && addr.line2 !== '-' ? addr.line2 : '',
        line3: addr.line3 && addr.line3 !== '-' ? addr.line3 : '',
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
      {/* Left Input Column — sticky offset clears the h-16 TopBar */}
      <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card rounded>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Raw Marketplace Addresses
              </CardTitle>
              <CardDescription className="mt-1">
                Separate multiple addresses with a blank line. Diacritics, 35-char line wraps, state
                codes, Phone/Ext, and VAT/IOSS/RUT tags are normalized automatically.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-error-subtle border border-error/25 text-error px-4 py-3 rounded-xl text-xs font-medium">
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
                  rows={14}
                  className="w-full px-3.5 py-3 border border-border bg-background text-foreground rounded-xl focus:ring-2 focus:ring-ring focus:outline-none font-mono text-xs leading-relaxed"
                  placeholder="John Doe&#10;123 Main Street&#10;New York, NY 10001&#10;United States&#10;Phone: +1 212-555-0199&#10;112-4775857-9262603-JCKL"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={loading || !rawText.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-primary-foreground text-sm font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer shadow-xs"
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
                  className="px-4 py-2.5 border border-border bg-card text-foreground rounded-xl text-xs font-semibold hover:bg-muted transition cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right Output Column */}
      <div className="lg:col-span-7 space-y-4">
        <Card rounded>
          <CardHeader>
            <div>
              <CardTitle>Cleaned Carrier-Ready Output ({result?.addresses?.length ?? 0})</CardTitle>
              <CardDescription className="mt-1">
                35-character line-wrapped fields (`line1`, `line2`, `line3`), 2-letter state codes,
                and compliance flags.
              </CardDescription>
            </div>
            {result && result.addresses.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={downloadDOCX}
                  disabled={downloadingDocx}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {downloadingDocx ? 'Generating DOCX…' : 'Download DOCX (DTDC Label)'}
                </button>
                <button
                  type="button"
                  onClick={downloadCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-success hover:bg-success-hover text-success-foreground text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download CSV
                </button>
                <button
                  type="button"
                  onClick={() => setShowTable((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  <Table2 className="w-3.5 h-3.5" />
                  {showTable ? 'Hide Table View' : 'View as Table'}
                </button>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {!result || result.addresses.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-muted/20">
                Paste one or more raw addresses on the left and click{' '}
                <strong className="text-foreground">Clean & Normalize Addresses</strong>.
              </div>
            ) : (
              <div className="space-y-4">
                {result.addresses.map((addr, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-foreground">{addr.name}</h4>
                          {addr.ref && (
                            <span className="px-2 py-0.5 rounded bg-primary/12 text-primary font-mono text-[11px] font-semibold">
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
                          <StatusBadge
                            label={`IOSS: ${addr.vatOrIoss || 'Yes'}`}
                            variant="purple"
                          />
                        )}
                        {addr.isBuyerNationalId && (
                          <StatusBadge
                            label={`RUT: ${addr.buyerNationalId || 'Yes'}`}
                            variant="info"
                          />
                        )}
                      </div>
                    </div>

                    {addr.warnings && addr.warnings.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-warning-subtle border border-warning/25 text-warning text-xs space-y-1">
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
                          Add Line 1 ({addr.line1.length}/35)
                        </span>
                        <span className="font-mono font-medium text-foreground">{addr.line1}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                          Add Line 2 ({addr.line2 === '-' ? 0 : addr.line2.length}/35)
                        </span>
                        <span className="font-mono font-medium text-foreground">{addr.line2}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                          Add Line 3 ({addr.line3 === '-' ? 0 : addr.line3.length}/35)
                        </span>
                        <span className="font-mono font-medium text-foreground">{addr.line3}</span>
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium cursor-pointer"
                      >
                        {copiedIdx === index ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Copied
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold cursor-pointer"
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

        {/* Full-width Table View — copy-paste into Excel */}
        {showTable && result && result.addresses.length > 0 && (
          <div className="lg:col-span-12 space-y-3">
            <Card rounded>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Table2 className="w-4 h-4 text-primary" />
                      Spreadsheet View
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Select the table below and paste directly into Excel or Google Sheets.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectTable}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs"
                    >
                      <Copy className="w-3.5 h-3.5" /> Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTable(false)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Close
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table ref={tableRef} className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/60 text-left">
                        {[
                          'Name',
                          'Line 1',
                          'Line 2',
                          'Line 3',
                          'City',
                          'State',
                          'Zip Code',
                          'Country',
                          'Phone',
                          'Email',
                          'Ref',
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap border-b border-border"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.addresses.map((addr, i) => (
                        <tr
                          key={i}
                          className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">
                            {addr.name}
                          </td>
                          <td className="px-3 py-2 font-mono text-foreground">{addr.line1}</td>
                          <td className="px-3 py-2 font-mono text-foreground">{addr.line2}</td>
                          <td className="px-3 py-2 font-mono text-foreground">{addr.line3}</td>
                          <td className="px-3 py-2 text-foreground whitespace-nowrap">
                            {addr.city}
                          </td>
                          <td className="px-3 py-2 text-foreground whitespace-nowrap">
                            {addr.state}
                          </td>
                          <td className="px-3 py-2 font-mono font-semibold text-foreground whitespace-nowrap">
                            {addr.zipcode || addr.zipCode}
                          </td>
                          <td className="px-3 py-2 text-foreground whitespace-nowrap">
                            {addr.country}
                          </td>
                          <td className="px-3 py-2 font-mono text-foreground whitespace-nowrap">
                            {addr.phone}
                          </td>
                          <td className="px-3 py-2 font-mono text-foreground whitespace-nowrap">
                            {addr.email || '—'}
                          </td>
                          <td className="px-3 py-2 font-mono text-foreground whitespace-nowrap">
                            {addr.ref}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
