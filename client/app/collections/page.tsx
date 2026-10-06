'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { RecipeCard, type RecipeCardData } from '../../components/recipe-card'
import { SiteHeader } from '../../components/site-header'
import { getMealCategories, getMealList, getMealsByArea, getMealsByCategory, getMealsByIngredient, getMealsByLetter, getSharedRecipeCards, hydrateRecipeRatings, searchMeals, toMealCards, type MealDbCategory } from '../../lib/recipe-api'
import { recipes as defaultFeaturedRecipes } from '../../lib/recipe-data'

const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')

export default function CollectionsPage() {
  const [sharedRecipes, setSharedRecipes] = useState<RecipeCardData[]>([])
  const [featuredRecipes, setFeaturedRecipes] = useState<RecipeCardData[]>([])
  const [saved, setSaved] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [queryInitialized, setQueryInitialized] = useState(false)
  const [selectedLetter, setSelectedLetter] = useState('a')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<MealDbCategory[]>([])
  const [areas, setAreas] = useState<string[]>([])
  const [ingredients, setIngredients] = useState<string[]>([])
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedIngredient, setSelectedIngredient] = useState('')
  const [mealRecipes, setMealRecipes] = useState<RecipeCardData[]>([])
  const [mealLoading, setMealLoading] = useState(false)
  const [mealError, setMealError] = useState('')

  useEffect(() => {
    let active = true
    getSharedRecipeCards().then((items) => { if (active) setSharedRecipes(items) }).catch(() => {})
    hydrateRecipeRatings(defaultFeaturedRecipes.map((recipe) => ({ ...recipe, source: undefined, detail: undefined }))).then((items) => { if (active) setFeaturedRecipes(items as RecipeCardData[]) }).catch(() => {})
    getMealCategories().then((items) => { if (active) setCategories(items) }).catch(() => {})
    getMealList('areas').then((items) => { if (active) setAreas(items) }).catch(() => {})
    getMealList('ingredients').then((items) => { if (active) setIngredients(items) }).catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setQuery(params.get('search') || '')
    const category = params.get('category')
    if (category) setSelectedCategory(category)
    const area = params.get('area')
    if (area) setSelectedArea(area)
    const ingredient = params.get('ingredient')
    if (ingredient) setSelectedIngredient(ingredient)
    const letter = params.get('letter')?.toLowerCase()
    if (letter && /^[a-z]$/.test(letter)) setSelectedLetter(letter)
    setQueryInitialized(true)
  }, [])

  useEffect(() => {
    if (!queryInitialized) return
    const typedQuery = query.trim()
    if (typedQuery.length === 1) {
      setMealRecipes([])
      setMealError('')
      setMealLoading(false)
      return
    }

    let active = true
    setMealLoading(true)
    setMealError('')
    const timer = window.setTimeout(() => {
      const request = typedQuery
        ? searchMeals(typedQuery)
        : selectedCategory
          ? getMealsByCategory(selectedCategory)
          : selectedArea
            ? getMealsByArea(selectedArea)
            : selectedIngredient
              ? getMealsByIngredient(selectedIngredient)
              : getMealsByLetter(selectedLetter)

      request
        .then((results) => { if (active) setMealRecipes(toMealCards(results)) })
        .catch((error: unknown) => { if (active) { setMealRecipes([]); setMealError(error instanceof Error ? error.message : 'Meal search failed.') } })
        .finally(() => { if (active) setMealLoading(false) })
    }, 400)

    return () => { active = false; window.clearTimeout(timer) }
  }, [query, queryInitialized, selectedArea, selectedCategory, selectedIngredient, selectedLetter])

  const allRecipes = useMemo(() => [...sharedRecipes, ...featuredRecipes], [sharedRecipes, featuredRecipes])
  const localResults = useMemo(() => allRecipes.filter((recipe) => {
    const matchesQuery = `${recipe.title} ${recipe.author} ${recipe.category}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery
  }), [allRecipes, query])
  const visibleRecipes = [...localResults, ...mealRecipes]

  function toggleSaved(id: string) {
    setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#23352d]">
      <SiteHeader onRecipeCreated={(recipe) => setSharedRecipes((current) => [recipe, ...current])} />
      <section className="border-b border-[#dfe3dc] bg-[#fbfaf7]">
        <div className="mx-auto max-w-[1240px] px-5 pb-9 pt-12 lg:px-8 lg:pb-12 lg:pt-16">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b76e43]"><span className="h-px w-7 bg-[#b76e43]" />Meals from around the world</p>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div><h1 className="font-serif text-5xl leading-none tracking-[-0.045em] text-[#294337] sm:text-6xl">The recipe collection</h1><p className="mt-4 max-w-[560px] text-[15px] leading-7 text-[#718078]">Search meals, browse by first letter, or explore a cuisine category.</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-9 lg:px-8 lg:py-12">
        <div className="mb-7 grid grid-cols-2 items-start gap-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <p className="col-span-2 text-sm text-[#819087] sm:col-span-1"><strong className="font-semibold text-[#40564a]">{visibleRecipes.length}</strong> recipes to explore</p>
          <label className="relative col-span-2 w-full sm:col-span-1 sm:max-w-[360px]"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b9a8b]" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search meals by name" className="h-11 w-full rounded-xl border border-[#dce2d8] bg-[#fbfbf8] pl-11 pr-4 text-sm text-[#294337] outline-none placeholder:text-[#a0aaa1] focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /></label>
          <label className="w-full sm:max-w-[190px]"><span className="sr-only">Browse by meal category</span><select value={selectedCategory} onChange={(event) => { setSelectedCategory(event.target.value); setSelectedArea(''); setSelectedIngredient(''); setQuery('') }} className="h-11 w-full rounded-xl border border-[#dce2d8] bg-[#fbfbf8] px-3 text-sm text-[#52635a] outline-none focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]"><option value="">All categories</option>{categories.map((category) => <option key={category.name} value={category.name}>{category.name}</option>)}</select></label>
          <label className="w-full sm:max-w-[190px]"><span className="sr-only">Browse by cuisine area</span><select value={selectedArea} onChange={(event) => { setSelectedArea(event.target.value); setSelectedCategory(''); setSelectedIngredient(''); setQuery('') }} className="h-11 w-full rounded-xl border border-[#dce2d8] bg-[#fbfbf8] px-3 text-sm text-[#52635a] outline-none focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]"><option value="">All areas</option>{areas.map((area) => <option key={area}>{area}</option>)}</select></label>
          <label className="col-span-2 w-full sm:col-span-1 sm:max-w-[210px]"><span className="sr-only">Filter by main ingredient</span><input list="themealdb-ingredients" value={selectedIngredient} onChange={(event) => { setSelectedIngredient(event.target.value); setSelectedCategory(''); setSelectedArea(''); setQuery('') }} placeholder="Filter by ingredient" className="h-11 w-full rounded-xl border border-[#dce2d8] bg-[#fbfbf8] px-3 text-sm text-[#52635a] outline-none placeholder:text-[#a0aaa1] focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /><datalist id="themealdb-ingredients">{ingredients.map((ingredient) => <option key={ingredient} value={ingredient} />)}</datalist></label>
        </div>
        <div className="mb-6 grid grid-cols-7 justify-items-center gap-1.5 md:flex md:items-center md:justify-start md:gap-2 md:overflow-x-auto md:pb-2" role="group" aria-label="Browse meals by first letter">{letters.map((letter) => <button key={letter} type="button" onClick={() => { setSelectedLetter(letter); setSelectedCategory(''); setSelectedArea(''); setSelectedIngredient(''); setQuery('') }} aria-pressed={!query && !selectedCategory && !selectedArea && !selectedIngredient && selectedLetter === letter} className={`grid size-8 place-items-center rounded-full text-xs font-semibold uppercase transition md:shrink-0 ${!query && !selectedCategory && !selectedArea && !selectedIngredient && selectedLetter === letter ? 'bg-[#294337] text-white' : 'bg-[#fbfaf7] text-[#6b796f] hover:bg-[#e9eee3]'}`}>{letter}</button>)}</div>
        {mealLoading && <p className="mb-4 text-xs text-[#819087]">Loading meals from TheMealDB…</p>}
        {mealError && <p role="status" className="mb-4 text-xs text-[#9b4e34]">{mealError}</p>}
        {visibleRecipes.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{visibleRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} saved={saved.includes(recipe.id)} onToggleSaved={() => toggleSaved(recipe.id)} />)}</div> : !mealLoading && <div className="rounded-xl border border-dashed border-[#ccd8c9] py-16 text-center text-sm text-[#718078]">No recipes match that search.</div>}
      </section>
    </main>
  )
}