'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { RecipeCarousel } from '../components/recipe-carousel'
import { RecipeCard, type RecipeCardData } from '../components/recipe-card'
import { SiteHeader } from '../components/site-header'
import { getRandomMeal, getSharedRecipeCards, hydrateRecipeRatings, toMealCards } from '../lib/recipe-api'
import { recipes } from '../lib/recipe-data'
import { useSavedRecipes } from '../lib/use-saved-recipes'
import { ArrowRight, Heart } from 'lucide-react'

export default function Page() {
  const { saved, toggleSaved } = useSavedRecipes()
  const [communityRecipes, setCommunityRecipes] = useState<RecipeCardData[]>([])
  const [featuredRecipes, setFeaturedRecipes] = useState<RecipeCardData[]>([])
  const [randomMeal, setRandomMeal] = useState<RecipeCardData | null>(null)

  useEffect(() => {
    let active = true
    getSharedRecipeCards().then((items) => { if (active) setCommunityRecipes(items) }).catch(() => {})
    hydrateRecipeRatings(recipes.map((recipe) => ({ ...recipe, source: undefined, detail: undefined }))).then((items) => { if (active) setFeaturedRecipes(items as RecipeCardData[]) }).catch(() => {})
    getRandomMeal().then((meal) => { if (active) setRandomMeal(toMealCards([meal])[0]) }).catch(() => {})

    return () => { active = false }
  }, [])

  const allRecipes = useMemo(() => [...communityRecipes, ...featuredRecipes], [communityRecipes, featuredRecipes])
  const latestRecipes = [...(randomMeal ? [randomMeal] : []), ...allRecipes].slice(0, 5)
  const landingRecipes = allRecipes.slice(0, 3)

  return (
    <>
    <SiteHeader onRecipeCreated={(recipe) => setCommunityRecipes((current) => [recipe, ...current])} />
    <main className="min-h-screen overflow-hidden bg-[#f8f6f1] text-[#23352d]">
      <RecipeCarousel recipes={latestRecipes} />

      <section id="discover" className="border-t border-[#dfe3dc] bg-[#f2f3ed]">
        <div className="mx-auto max-w-[1240px] px-5 py-10 lg:px-8 lg:py-14">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8b9a8b]">The latest from our kitchen</p><h2 className="font-serif text-4xl tracking-[-0.04em] text-[#294337]">Find your next favorite</h2></div>
          </div>
          {landingRecipes.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{landingRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} saved={saved.includes(recipe.id)} onToggleSaved={() => toggleSaved(recipe.id)} />)}</div> : <div className="rounded-2xl border border-dashed border-[#ccd8c9] py-14 text-center text-[#718078]">No recipes are available yet.</div>}
          <div className="mt-8 flex justify-center"><Link href="/collections" className="inline-flex h-11 items-center gap-2 rounded-full border border-[#cbd7c5] bg-[#fbfaf7] px-5 text-sm font-semibold text-[#40564a] transition hover:-translate-y-0.5 hover:border-[#91a887] hover:bg-white">Explore more recipes <ArrowRight size={16} /></Link></div>
        </div>
      </section>

      <section id="collections" className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20"><div className="flex flex-col justify-between gap-6 rounded-[26px] bg-[#294337] px-7 py-10 text-[#f7f3e9] md:flex-row md:items-center md:px-12"><div><p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#c7d9b5]">Your kitchen, your way</p><h2 className="max-w-[520px] font-serif text-4xl leading-[.98] tracking-[-0.04em] md:text-5xl">Save the recipes<br /><em className="font-normal text-[#e4a073]">you&apos;ll make again.</em></h2></div><div className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-full bg-[#41614b]"><Heart size={22} /></span><p className="max-w-[180px] text-sm leading-6 text-[#c5d2c5]">Build a personal cookbook as you discover.</p></div></div></section>

      <footer id="community" className="border-t border-[#dfe3dc] bg-[#fbfaf7]"><div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 py-8 text-sm text-[#7a877e] md:flex-row md:items-center md:justify-between lg:px-8"><p><span className="font-serif text-xl text-[#294337]">Recipe Share<span className="text-[#b76e43]">.</span></span> <span className="ml-3">Recipes for real life.</span></p><p className="text-xs">Made by Muhammad Ahsan Ehsan · Nasmak Labs</p></div></footer>
    </main>
    </>
  )
}
