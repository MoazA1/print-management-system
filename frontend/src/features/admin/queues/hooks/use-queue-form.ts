import { useState } from 'react'
import { getInitialQueueDraft } from '../types'

export function useQueueForm() {
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState(getInitialQueueDraft)

  function toggleDraftSelection(field: 'printerIds' | 'allowedGroups', value: string) {
    setDraft((current) => {
      const nextValues = current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value]

      return { ...current, [field]: nextValues }
    })
  }

  function resetDraft() {
    setDraft(getInitialQueueDraft())
  }

  return {
    draft,
    isCreateOpen,
    resetDraft,
    setCreateOpen,
    setDraft,
    toggleDraftSelection,
  }
}
