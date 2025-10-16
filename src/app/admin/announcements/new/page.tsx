'use client'

import { UnifiedContentEditor } from '@/components/admin/unified-content-editor'

export default function NewAnnouncement() {
  return <UnifiedContentEditor initialContentType="announcement" mode="create" />
}
