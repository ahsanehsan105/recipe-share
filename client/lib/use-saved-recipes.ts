'use client'

import { useEffect, useState } from 'react'

const SAVED_RECIPES_KEY = 'recipeShare.savedRecipes.v1'

export function useSavedRecipes() {
  const [saved, setSaved] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(SAVED_RECIPES_KEY) || '[]') as unknown
      if (Array.isArray(stored)) {
        setSaved(stored.filter((id): id is string => typeof id === 'string'))
      }
    } catch {
      setSaved([])
    }
  }, [])

  function toggleSaved(id: string) {
    setSaved((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      try {
        localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(next))
      } catch {
        return next
      }
      return next
    })
  }

  return { saved, toggleSaved }
}