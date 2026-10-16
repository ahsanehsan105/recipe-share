'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { RecipeCard, type RecipeCardData } from '../../components/recipe-card'
import { SiteHeader } from '../../components/site-header'
import { getSharedRecipeCards } from '../../lib/recipe-api'
import { useSavedRecipes } from '../../lib/use-saved-recipes'

const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
const regions = ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'Azad Kashmir']
const PAGE_SIZE = 15
const categories = ['Breakfast', 'Breakfast / Lunch', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Main Course']

export default function CollectionsPage() {
  const { saved, toggleSaved } = useSavedRecipes()
  const [recipes, setRecipes] = useState<RecipeCardData[]>([])
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [ingredientFilter, setIngredientFilter] = useState('')
  const [selectedLetter, setSelectedLetter] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    const timer = window.setTimeout(() => {
      getSharedRecipeCards({
        page: 1,
        limit: PAGE_SIZE,
        search: query,
        category: selectedCategory,
        area: selectedArea,
        ingredient: ingredientFilter,
        letter: selectedLetter,
      })
      .then((result) => {
        if (!active) return
        setRecipes(result.recipes)
        setPage(1)
        setHasMore(result.pagination.hasMore)
      })
      .catch((error: unknown) => { if (active) setLoadError(error instanceof Error ? error.message : 'Recipes are unavailable.') })
      .finally(() => { if (active) setLoading(false) })
    }, 200)
    return () => { active = false; window.clearTimeout(timer) }
  }, [query, selectedCategory, selectedArea, ingredientFilter, selectedLetter])

  const hasActiveFilters = Boolean(query || selectedCategory || selectedArea || ingredientFilter || selectedLetter)

  function clearFilters() {
    setQuery('')
    setSelectedCategory('')
    setSelectedArea('')
    setIngredientFilter('')
    setSelectedLetter('')
  }

  async function showMoreRecipes() {
    if (!hasMore || loadingMore) return
    const nextPage = page + 1
    setLoadingMore(true)
    setLoadError('')
    try {
      const result = await getSharedRecipeCards({
        page: nextPage,
        limit: PAGE_SIZE,
        search: query,
        category: selectedCategory,
        area: selectedArea,
        ingredient: ingredientFilter,
        letter: selectedLetter,
      })
      setRecipes((current) => [...current, ...result.recipes])
      setPage(nextPage)
      setHasMore(result.pagination.hasMore)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'More recipes could not be loaded.')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#23352d]">
      <SiteHeader onRecipeCreated={(recipe) => setRecipes((current) => [recipe, ...current])} />
      <section className="border-b border-[#dfe3dc] bg-[#fbfaf7]">
        <div className="mx-auto max-w-[1240px] px-5 pb-9 pt-12 lg:px-8 lg:pb-12 lg:pt-16">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b76e43]"><span className="h-px w-7 bg-[#b76e43]" />From Pakistani kitchens</p>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div><h1 className="font-serif text-5xl leading-none tracking-[-0.045em] text-[#294337] sm:text-6xl">The Recipe Collection</h1><p className="mt-4 max-w-[560px] text-[15px] leading-7 text-[#718078]">Search and explore recipes shared by cooks across Pakistan.</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-9 lg:px-8 lg:py-12">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {hasActiveFilters && <button type="button" onClick={clearFilters} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#64736a] transition hover:bg-[#e9eee3] hover:text-[#294337]"><X size={14} /> Clear filters</button>}
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="relative"><span className="sr-only">Search recipes</span><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b9a8b]" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipes" className="h-11 w-full rounded-xl border border-[#dce2d8] bg-[#fbfbf8] pl-11 pr-4 text-sm text-[#294337] outline-none placeholder:text-[#a0aaa1] focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /></label>
          <label><span className="sr-only">Filter by recipe category</span><select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="h-11 w-full rounded-xl border border-[#dce2d8] bg-[#fbfbf8] px-3 text-sm text-[#52635a] outline-none focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]"><option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label><span className="sr-only">Filter by Pakistani region</span><select value={selectedArea} onChange={(event) => setSelectedArea(event.target.value)} className="h-11 w-full rounded-xl border border-[#dce2d8] bg-[#fbfbf8] px-3 text-sm text-[#52635a] outline-none focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]"><option value="">All regions</option>{regions.map((region) => <option key={region}>{region}</option>)}</select></label>
          <label><span className="sr-only">Filter by ingredient</span><input value={ingredientFilter} onChange={(event) => setIngredientFilter(event.target.value)} placeholder="Filter by ingredient" className="h-11 w-full rounded-xl border border-[#dce2d8] bg-[#fbfbf8] px-3 text-sm text-[#52635a] outline-none placeholder:text-[#a0aaa1] focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /></label>
        </div>

        <div className="mb-6 flex gap-1.5 overflow-x-auto pb-2" role="group" aria-label="Filter recipes by first letter">
          <button type="button" onClick={() => setSelectedLetter('')} aria-pressed={!selectedLetter} className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold transition ${!selectedLetter ? 'bg-[#294337] text-white' : 'bg-[#fbfaf7] text-[#6b796f] hover:bg-[#e9eee3]'}`}>All</button>
          {letters.map((letter) => <button key={letter} type="button" onClick={() => setSelectedLetter(letter)} aria-pressed={selectedLetter === letter} className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold uppercase transition ${selectedLetter === letter ? 'bg-[#294337] text-white' : 'bg-[#fbfaf7] text-[#6b796f] hover:bg-[#e9eee3]'}`}>{letter}</button>)}
        </div>

        {loading && <p className="mb-4 text-sm text-[#819087]">Loading recipes…</p>}
        {loadError && <p role="alert" className="mb-4 text-sm text-[#9b4e34]">{loadError}</p>}
        {recipes.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} saved={saved.includes(recipe.id)} onToggleSaved={() => toggleSaved(recipe.id)} />)}</div> : !loading && !loadError && <div className="rounded-xl border border-dashed border-[#ccd8c9] py-16 text-center text-sm text-[#718078]">No recipes match your search.</div>}
        {hasMore && <div className="mt-8 flex justify-center"><button type="button" onClick={showMoreRecipes} disabled={loadingMore} className="h-11 rounded-lg border border-[#cbd7c5] bg-[#fbfaf7] px-5 text-sm font-semibold text-[#40564a] transition hover:border-[#91a887] hover:bg-white disabled:cursor-wait disabled:opacity-60">{loadingMore ? 'Loading recipes…' : 'Show more'}</button></div>}
      </section>
    </main>
  )
}