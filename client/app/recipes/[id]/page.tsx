'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, ChefHat, Clock3, CookingPot, Users, Video } from 'lucide-react'
import { RecipeCommunityPanel } from '../../../components/recipe-community-panel'
import { SiteHeader } from '../../../components/site-header'
import { getRecipeAverageRating } from '../../../lib/recipe-api'
import { recipes, type RecipeDetailData } from '../../../lib/recipe-data'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api'
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')

type ApiRecipe = {
  _id: string
  name: string
  sharedBy: string
  category: string
  diet: string
  description: string
  prepTime: number
  cookTime: number
  servings: number
  ingredients: string[]
  instructions: string[]
  imagePath: string
  videoUrl?: string
  rating?: number
}

function formatRating(value: number | string | null | undefined): string {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return '0'
  return numericValue > 0 ? numericValue.toFixed(1) : '0'
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const localRecipe = recipes.find((recipe) => recipe.id === id)
  const [recipe, setRecipe] = useState<RecipeDetailData | null>(localRecipe ?? null)
  const [loading, setLoading] = useState(!localRecipe)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const featuredRecipe = recipes.find((item) => item.id === id)
    if (featuredRecipe) {
      void getRecipeAverageRating(id).then((average) => {
        if (!active) return
        setRecipe({
          ...featuredRecipe,
          rating: average > 0 ? average.toFixed(1) : '0',
        })
        setLoading(false)
      }).catch(() => {
        if (active) {
          setRecipe({ ...featuredRecipe, rating: '0' })
          setLoading(false)
        }
      })

      return () => { active = false }
    }

    setRecipe(null)
    setLoading(true)
    setError('')

    fetch(`${API_BASE_URL}/recipes/${id}`)
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.message ?? 'This recipe could not be found.')
        return result.recipe as ApiRecipe
      })
      .then((item) => {
        if (!active) return
        setRecipe({
          id: item._id,
          title: item.name,
          author: item.sharedBy,
          time: `${item.prepTime + item.cookTime} min`,
          rating: formatRating(item.rating ?? 0),
          category: item.category,
          diet: item.diet === 'Everything' ? 'All diets' : item.diet,
          image: item.imagePath.startsWith('http') ? item.imagePath : `${SERVER_BASE_URL}${item.imagePath}`,
          color: 'bg-[#dbe8c9]',
          description: item.description,
          prepTime: item.prepTime,
          cookTime: item.cookTime,
          servings: item.servings,
          ingredients: item.ingredients,
          instructions: item.instructions,
          videoUrl: item.videoUrl,
        })
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'This recipe could not be loaded.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [id])

  if (loading) {
    return <main className="min-h-screen bg-[#f8f6f1] text-[#718078]"><SiteHeader variant="recipe-detail" /><div className="grid min-h-[calc(100vh-72px)] place-items-center"><p className="animate-pulse text-sm">Gathering the recipe…</p></div></main>
  }

  if (!recipe) {
    return (
      <main className="min-h-screen bg-[#f8f6f1] px-5 text-center text-[#294337]">
        <SiteHeader variant="recipe-detail" />
        <div className="grid min-h-[calc(100vh-72px)] place-items-center"><div><ChefHat className="mx-auto mb-4 text-[#c8754c]" size={32} /><h1 className="font-serif text-4xl">Recipe not found</h1><p className="mt-3 text-sm text-[#718078]">{error || 'This recipe may have been removed.'}</p></div></div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#294337]">
      <SiteHeader variant="recipe-detail" />
      <div className="mx-auto max-w-[1180px] px-5 pb-16 lg:px-8">
        <section className="grid gap-8 py-8 md:py-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-14">
          <div className="order-2 lg:order-1">
            <p className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#b76e43]"><span className="h-px w-7 bg-[#b76e43]" /> {recipe.category}{recipe.diet !== 'All diets' ? ` · ${recipe.diet}` : ''}</p>
            <h1 className="max-w-[620px] font-serif text-5xl leading-[0.98] tracking-[-0.045em] sm:text-6xl">{recipe.title}</h1>
            <h2 className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9aa49a]">About this recipe</h2><p className="mt-2 max-w-[550px] text-[16px] leading-7 text-[#718078]">{recipe.description}</p>
            <div className="mt-7 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#e6eadf] text-[#61775a]"><ChefHat size={18} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9aa49a]">Shared by</p><p className="mt-0.5 text-sm font-semibold text-[#40564a]">{recipe.author}</p></div></div>
            <div className="mt-8 grid grid-cols-3 border-y border-[#dfe3dc] py-4">
              <div className="pr-2"><Clock3 size={17} className="mb-2 text-[#b76e43]" /><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#98a197]">Prep</p><p className="mt-1 text-sm font-semibold">{recipe.prepTime} min</p></div>
              <div className="border-l border-[#dfe3dc] px-4"><CookingPot size={17} className="mb-2 text-[#b76e43]" /><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#98a197]">Cook</p><p className="mt-1 text-sm font-semibold">{recipe.cookTime} min</p></div>
              <div className="border-l border-[#dfe3dc] pl-4"><Users size={17} className="mb-2 text-[#b76e43]" /><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#98a197]">Serves</p><p className="mt-1 text-sm font-semibold">{recipe.servings}</p></div>
            </div>
          </div>
          <div className={`order-1 aspect-[4/3] overflow-hidden rounded-[18px] ${recipe.color} lg:order-2`}><img src={recipe.image} alt={recipe.title} className="size-full object-cover" /></div>
        </section>

        {recipe.videoUrl && <section className="mt-10 flex flex-col justify-between gap-5 rounded-[14px] border border-[#dfe3dc] bg-[#fbfaf7] p-5 sm:flex-row sm:items-center sm:px-7"><div className="flex items-center gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e9eee3] text-[#60775b]"><Video size={19} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9aa49a]">Cook along</p><h2 className="mt-1 font-serif text-2xl text-[#294337]">Watch the recipe</h2></div></div><a href={recipe.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center rounded-full bg-[#294337] px-5 text-sm font-semibold text-white transition hover:bg-[#3d5949]">Open video <ArrowUpRight className="ml-2" size={15} /></a></section>}

        <section className="grid gap-12 border-t border-[#dfe3dc] pt-9 md:grid-cols-[0.72fr_1.28fr] md:gap-16 md:pt-12">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b76e43]">Get everything ready</p>
            <h2 className="font-serif text-3xl tracking-[-0.035em]">Ingredients</h2>
            <p className="mt-2 text-sm text-[#8a968d]">{recipe.ingredients.length} ingredients · serves {recipe.servings}</p>
            <ul className="mt-6 divide-y divide-[#e3e7df]">
              {recipe.ingredients.map((ingredient, index) => <li key={`${ingredient}-${index}`} className="flex gap-3 py-3 text-sm leading-6 text-[#52635a]"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-[#cbd7c5] text-[10px] font-semibold text-[#819476]">{index + 1}</span><span>{ingredient}</span></li>)}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b76e43]">Take it step by step</p>
            <h2 className="font-serif text-3xl tracking-[-0.035em]">The method</h2>
            <ol className="mt-6 space-y-6">
              {recipe.instructions.map((instruction, index) => <li key={`${instruction}-${index}`} className="grid grid-cols-[34px_1fr] gap-4"><span className="grid size-[34px] place-items-center rounded-full bg-[#e5eadf] font-serif text-[16px] text-[#647b5d]">{String(index + 1).padStart(2, '0')}</span><p className="pt-1 text-[15px] leading-7 text-[#52635a]">{instruction}</p></li>)}
            </ol>
          </div>
        </section>
        <RecipeCommunityPanel recipeId={recipe.id} recipeTitle={recipe.title} />
      </div>
    </main>
  )
}