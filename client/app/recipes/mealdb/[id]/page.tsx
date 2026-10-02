'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowUpRight, ChefHat, LoaderCircle, Video } from 'lucide-react'
import { RecipeShareForm, type SharedRecipeCard } from '../../../../components/recipe-share-form'
import { RecipeCommunityPanel } from '../../../../components/recipe-community-panel'
import { SiteHeader } from '../../../../components/site-header'
import { getCachedMeal, getMealById, type MealDbMeal } from '../../../../lib/recipe-api'

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export default function MealDbDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [meal, setMeal] = useState<MealDbMeal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    const cachedMeal = getCachedMeal(id)
    if (cachedMeal) {
      setMeal(cachedMeal)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    getMealById(id)
      .then((result) => { if (active) setMeal(result) })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load this meal.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  function mealCreated(recipe: SharedRecipeCard) {
    setShareOpen(false)
    router.push(`/recipes/${recipe.id}`)
  }

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#294337]">
      <SiteHeader variant="recipe-detail" />
      <div className="mx-auto max-w-[1180px] px-5 pb-16 pt-8 lg:px-8 lg:pt-12">
        {loading ? <div className="grid min-h-[45vh] place-items-center text-sm text-[#718078]"><span className="flex items-center gap-2"><LoaderCircle size={16} className="animate-spin" /> Loading meal details…</span></div> : !meal ? <div role="alert" className="mx-auto max-w-xl py-20 text-center"><ChefHat size={32} className="mx-auto mb-4 text-[#c8754c]" /><h1 className="font-serif text-4xl">Meal unavailable</h1><p className="mt-3 text-sm leading-6 text-[#718078]">{error || 'This meal could not be found.'}</p></div> : <>
          <section className="grid gap-8 border-b border-[#dfe3dc] pb-10 md:grid-cols-[1fr_0.9fr] md:items-center md:pb-12">
            <div><p className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b76e43]"><span className="h-px w-7 bg-[#b76e43]" />{[meal.category, meal.area].filter(Boolean).join(' · ') || 'TheMealDB'}</p><h1 className="max-w-[680px] font-serif text-5xl leading-[0.98] tracking-[-0.045em] sm:text-6xl">{meal.title}</h1><p className="mt-5 max-w-[600px] text-sm leading-7 text-[#718078]">A recipe from TheMealDB, with the original ingredients and method.</p>{meal.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{meal.tags.map((tag) => <span key={tag} className="rounded-full bg-[#e9eee3] px-3 py-1.5 text-[11px] font-semibold text-[#63765b]">{tag}</span>)}</div>}<button type="button" onClick={() => setShareOpen(true)} className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-[#d9794f] px-5 text-sm font-semibold text-white transition hover:bg-[#c86942]">Make it yours <ArrowUpRight size={16} /></button></div>
            <div className="aspect-[4/3] overflow-hidden rounded-[16px] bg-[#e8eddf]"><img src={meal.image} alt={meal.title} className="size-full object-cover" /></div>
          </section>

          <section className="border-b border-[#dfe3dc] py-7"><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b76e43]">About this recipe</p><p className="max-w-[760px] text-sm leading-7 text-[#718078]">This recipe is categorized as {meal.category || 'a meal'}{meal.area ? ` and comes from ${meal.area} cuisine` : ''}. The ingredients and method below come from TheMealDB{meal.tags.length ? `; tags include ${meal.tags.join(', ')}` : ''}.</p></section>

          <section className="grid gap-12 pt-9 md:grid-cols-[0.72fr_1.28fr] md:gap-16 md:pt-12">
            <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b76e43]">Get everything ready</p><h2 className="font-serif text-3xl tracking-[-0.035em]">Ingredients</h2><p className="mt-2 text-sm text-[#8a968d]">{meal.ingredients.length} ingredients</p><ul className="mt-6 divide-y divide-[#e3e7df]">{meal.ingredients.map((ingredient, index) => <li key={`${ingredient.name}-${index}`} className="flex gap-3 py-3 text-sm leading-6 text-[#52635a]"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-[#cbd7c5] text-[10px] font-semibold text-[#819476]">{index + 1}</span><span>{[ingredient.measure, ingredient.name].filter(Boolean).join(' ')}</span></li>)}</ul></div>
            <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b76e43]">Take it step by step</p><h2 className="font-serif text-3xl tracking-[-0.035em]">The method</h2><ol className="mt-6 space-y-6">{meal.instructions.map((instruction, index) => <li key={`${index}-${instruction}`} className="grid grid-cols-[34px_1fr] gap-4"><span className="grid size-[34px] place-items-center rounded-full bg-[#e5eadf] font-serif text-[16px] text-[#647b5d]">{String(index + 1).padStart(2, '0')}</span><p className="pt-1 text-[15px] leading-7 text-[#52635a]">{instruction}</p></li>)}</ol>{safeExternalUrl(meal.youtube) && <div className="mt-10 flex flex-wrap gap-3 border-t border-[#dfe3dc] pt-6"><a href={meal.youtube} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-[#294337] px-4 text-sm font-semibold text-white hover:bg-[#3d5949]"><Video size={16} /> Watch video <ArrowUpRight size={14} /></a></div>}</div>
          </section>
          <RecipeCommunityPanel recipeId={meal.id} recipeTitle={meal.title} />
        </>}
      </div>
      {shareOpen && meal && <RecipeShareForm initialRecipe={{ title: meal.title, image: meal.image, servings: '', ingredients: meal.ingredients, instructions: meal.instructions }} onClose={() => setShareOpen(false)} onCreated={mealCreated} />}
    </main>
  )
}