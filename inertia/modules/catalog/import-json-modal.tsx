import React from 'react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { AppButton, AppInput, AppSelect } from '~/lib/ui'
import { Upload, X } from 'lucide-react'

export function ImportJsonModal({
  isOpen,
  onClose,
  catalogJsonText,
  setCatalogJsonText,
  importTier,
  setImportTier,
  importSkuFormat,
  setImportSkuFormat,
  importStock,
  setImportStock,
  sampleCatalogJson,
  busyId,
  onImport,
  onFileUpload,
}: {
  isOpen: boolean
  onClose: () => void
  catalogJsonText: string
  setCatalogJsonText: (v: string) => void
  importTier: string
  setImportTier: (v: string) => void
  importSkuFormat: string
  setImportSkuFormat: (v: string) => void
  importStock: string
  setImportStock: (v: string) => void
  sampleCatalogJson: any
  busyId: string | null
  onImport: () => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  if (!isOpen) return null

  return (
    <Stack
      direction="horizontal"
      align="center"
      justify="center"
      padding={4}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
    >
      <Stack className="relative w-full max-w-3xl rounded-2xl border border-card-border bg-card text-foreground shadow-2xl">
        <Stack
          direction="horizontal"
          align="center"
          justify="between"
          paddingInline={6}
          paddingBlock={4}
          className="border-b border-divider bg-muted/30"
        >
          <Stack>
            <h2 className="text-lg font-bold text-foreground">
              Import Brand-Agnostic Master Catalog JSON
            </h2>
            <p className="text-xs text-muted-foreground">
              Upload or paste a Catalog JSON file (keyed by SKU1, SKU2, etc.) to store in the
              database.
            </p>
          </Stack>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </Stack>
        <Stack gap={4} padding={6} className="overflow-y-auto">
          <Stack direction="horizontal" align="center" justify="between" wrap="wrap" gap={2}>
            <label className="inline-flex items-center gap-2 rounded-xl border border-input-border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-foreground cursor-pointer hover:bg-muted">
              <Upload className="h-3.5 w-3.5" />
              <Text>Upload .json File</Text>
              <input
                type="file"
                accept=".json,application/json"
                onChange={onFileUpload}
                className="hidden"
              />
            </label>
            <AppButton
              label="Load Sample Catalog"
              variant="ghost"
              size="xs"
              onClick={() => setCatalogJsonText(JSON.stringify(sampleCatalogJson, null, 2))}
            />
          </Stack>
          <Stack direction="horizontal" gap={3} wrap="wrap">
            <AppSelect
              label="Price tier"
              value={importTier}
              onChange={(e) => setImportTier(e.target.value)}
              options={['01', '02', '03'].map((tier) => ({
                value: tier,
                label: `Tier ${tier}`,
              }))}
            />
            <AppSelect
              label="SKU format"
              value={importSkuFormat}
              onChange={(e) => setImportSkuFormat(e.target.value)}
              options={[
                { value: 'standard', label: 'Standard' },
                { value: 'prefixed_color', label: 'Color-prefixed' },
                { value: 'catalog_key', label: 'Catalog key' },
              ]}
            />
            <AppInput
              id="catalog-import-stock"
              label="Initial stock per variant"
              type="number"
              min="0"
              step="1"
              value={importStock}
              onChange={(e) => setImportStock(e.target.value)}
            />
          </Stack>
          <textarea
            rows={14}
            value={catalogJsonText}
            onChange={(e) => setCatalogJsonText(e.target.value)}
            spellCheck={false}
            className="w-full rounded-xl border border-input-border bg-muted/30 p-3 font-mono text-xs text-foreground"
          />
        </Stack>
        <Stack
          direction="horizontal"
          align="center"
          justify="end"
          gap={2}
          paddingInline={6}
          paddingBlock={4}
          className="border-t border-divider bg-muted/25"
        >
          <AppButton label="Cancel" variant="ghost" size="sm" onClick={onClose} />
          <AppButton
            label={busyId === 'import-json' ? 'Importing...' : 'Import & Convert Catalog'}
            variant="primary"
            size="sm"
            loading={busyId === 'import-json'}
            onClick={onImport}
          />
        </Stack>
      </Stack>
    </Stack>
  )
}
