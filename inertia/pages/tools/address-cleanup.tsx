import { Head } from '@inertiajs/react'
import { MapPin } from 'lucide-react'
import { ModulePageHeader } from '~/modules/common/module-page-header'
import { AddressCleanerModule } from '~/modules/tools/address-cleaner'

export default function AddressCleanupPage() {
  return (
    <>
      <Head title="Address Cleanup Tool" />
      <div className="space-y-6">
        <ModulePageHeader
          title="Address Cleanup & Carrier Compliance Tool"
          description="Normalize raw marketplace addresses, enforce 35-character line limits, convert state names to 2-letter codes, extract VAT/IOSS/Phone metadata, and export to CSV or Customer Addresses."
          icon={MapPin}
        />

        <AddressCleanerModule />
      </div>
    </>
  )
}
