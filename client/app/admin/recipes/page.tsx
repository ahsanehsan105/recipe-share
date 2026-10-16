'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { ImagePlus, KeyRound, Link2, LoaderCircle, Search, ShieldCheck, Trash2 } from 'lucide-react'
import { RecipeCardData } from '../../../components/recipe-card'
import { SiteHeader } from '../../../components/site-header'
import { deleteSharedRecipe, getSharedRecipeCards, updateRecipeImage, verifyRecipeImageAdminKey } from '../../../lib/recipe-api'

const PAGE_SIZE = 15

function RecipeImagePreview({ recipe, imageUrl }: { recipe: RecipeCardData; imageUrl?: string }) {
  return (
    <div className="relative">
      <img src={imageUrl || recipe.image} alt={imageUrl ? `Preview of replacement image for ${recipe.title}` : recipe.title} className="aspect-[4/3] w-full rounded-lg bg-[#e8eddf] object-cover sm:w-[120px]" />
      {imageUrl && <span className="absolute bottom-1.5 left-1.5 rounded bg-[#294337]/90 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-white">Preview</span>}
    </div>
  )
}

export default function RecipeImageAdminPage() {
  const [adminKey, setAdminKey] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [recipes, setRecipes] = useState<RecipeCardData[]>([])
  const [totalRecipes, setTotalRecipes] = useState(0)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [updatingId, setUpdatingId] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!authorized) return
    const timer = window.setTimeout(() => setSearch(query.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [authorized, query])

  useEffect(() => {
    if (!authorized) return
    let active = true
    setLoading(true)
    setError('')
    getSharedRecipeCards({ page: 1, limit: PAGE_SIZE, search })
      .then((result) => {
        if (!active) return
        setRecipes(result.recipes)
        setTotalRecipes(result.pagination.total)
        setPage(1)
        setHasMore(result.pagination.hasMore)
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Recipes could not be loaded.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [authorized, search])

  async function unlockAdminTools(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setVerifying(true)
    try {
      await verifyRecipeImageAdminKey(adminKey)
      setAuthorized(true)
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : 'Admin authorization failed.')
    } finally {
      setVerifying(false)
    }
  }

  async function replaceImage(event: FormEvent<HTMLFormElement>, recipe: RecipeCardData) {
    event.preventDefault()
    setError('')
    setNotice('')

    const imageUrl = imageUrls[recipe.id]?.trim()
    if (!imageUrl) {
      setError('Enter an image URL first.')
      return
    }

    setUpdatingId(recipe.id)
    try {
      const updatedImageUrl = await updateRecipeImage(recipe.id, imageUrl, adminKey)
      setRecipes((current) => current.map((item) => item.id === recipe.id ? { ...item, image: updatedImageUrl } : item))
      setImageUrls((current) => {
        const next = { ...current }
        delete next[recipe.id]
        return next
      })
      setNotice(`Updated the image for ${recipe.title}.`)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'The image could not be updated.')
    } finally {
      setUpdatingId('')
    }
  }

  async function deleteRecipe(recipe: RecipeCardData) {
    if (!window.confirm(`Delete "${recipe.title}"? This will also delete its ratings and questions.`)) return

    setError('')
    setNotice('')
    setDeletingId(recipe.id)
    try {
      await deleteSharedRecipe(recipe.id, adminKey)
      setRecipes((current) => current.filter((item) => item.id !== recipe.id))
      setTotalRecipes((current) => Math.max(0, current - 1))
      setImageUrls((current) => {
        const next = { ...current }
        delete next[recipe.id]
        return next
      })
      setNotice(`Deleted ${recipe.title}.`)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'The recipe could not be deleted.')
    } finally {
      setDeletingId('')
    }
  }

  async function loadMore() {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    setError('')
    try {
      const nextPage = page + 1
      const result = await getSharedRecipeCards({ page: nextPage, limit: PAGE_SIZE, search })
      setRecipes((current) => [...current, ...result.recipes])
      setTotalRecipes(result.pagination.total)
      setPage(nextPage)
      setHasMore(result.pagination.hasMore)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'More recipes could not be loaded.')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#23352d]">
      <SiteHeader variant="recipe-detail" />
      {!authorized ? (
        <section className="grid min-h-[calc(100vh-72px)] place-items-center px-5 py-10">
          <form onSubmit={unlockAdminTools} className="w-full max-w-[480px] rounded-2xl border border-[#dfe3dc] bg-[#fbfaf7] p-6 shadow-sm sm:p-8">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b76e43]"><ShieldCheck size={14} /> Admin tools</p>
            <h1 className="font-serif text-3xl text-[#294337]">Enter admin key</h1>
            <p className="mt-2 text-sm leading-6 text-[#718078]">Verify your access to manage recipes and their images.</p>
            <label className="mt-6 block text-xs font-semibold text-[#52635a]">Admin key<span className="mt-1.5 flex h-11 items-center gap-3 rounded-lg border border-[#dce2d8] bg-white px-3 text-[#819087] focus-within:border-[#91a887] focus-within:ring-2 focus-within:ring-[#dcebd3]"><KeyRound size={16} /><input type="password" required autoComplete="current-password" autoFocus value={adminKey} onChange={(event) => setAdminKey(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-normal text-[#294337] outline-none" /></span></label>
            {error && <p role="alert" className="mt-4 rounded-lg border border-[#e7c7ba] bg-[#fbefea] px-4 py-3 text-sm text-[#9b4e34]">{error}</p>}
            <button type="submit" disabled={!adminKey || verifying} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#294337] px-4 text-sm font-semibold text-white hover:bg-[#3d5949] disabled:cursor-wait disabled:opacity-60">
              {verifying && <LoaderCircle size={16} className="animate-spin" />}
              {verifying ? 'Verifying…' : 'Continue'}
            </button>
          </form>
        </section>
      ) : <>
      <section className="border-b border-[#dfe3dc] bg-[#fbfaf7]">
        <div className="mx-auto max-w-[1240px] px-5 py-10 lg:px-8 lg:py-14">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b76e43]"><ShieldCheck size={14} /> Admin tools</p>
          <h1 className="font-serif text-4xl text-[#294337] sm:text-5xl">Manage recipes</h1>
          <p className="mt-3 max-w-[620px] text-sm leading-6 text-[#718078]">Replace recipe images or delete recipes and their ratings and questions.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-8 lg:px-8">
        <div className="mb-7">
          <label className="relative block"><span className="sr-only">Search recipes to update</span><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b9a8b]" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a recipe" className="h-11 w-full rounded-lg border border-[#dce2d8] bg-white pl-11 pr-4 text-sm text-[#294337] outline-none placeholder:text-[#a0aaa1] focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /></label>
          <p className="mt-2 text-sm text-[#819087]"><strong className="font-semibold text-[#40564a]">{totalRecipes}</strong> recipes to manage</p>
        </div>

        {notice && <p role="status" className="mb-5 rounded-lg border border-[#cbd7c5] bg-[#edf3e8] px-4 py-3 text-sm text-[#40564a]">{notice}</p>}
        {error && <p role="alert" className="mb-5 rounded-lg border border-[#e7c7ba] bg-[#fbefea] px-4 py-3 text-sm text-[#9b4e34]">{error}</p>}
        {loading && <p className="py-8 text-sm text-[#718078]">Loading recipes…</p>}

        <div className="divide-y divide-[#dfe3dc] border-y border-[#dfe3dc]">
          {recipes.map((recipe) => <article key={recipe.id} className="grid gap-4 py-5 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
            <RecipeImagePreview recipe={recipe} imageUrl={imageUrls[recipe.id]} />
            <div className="min-w-0">
              <h2 className="font-serif text-xl text-[#294337]">{recipe.title}</h2>
              <p className="mt-1 text-xs text-[#819087]">{recipe.category} · By {recipe.author}</p>
              <form onSubmit={(event) => replaceImage(event, recipe)} className="mt-3 flex flex-wrap items-center gap-2">
                <label className="relative min-w-[240px] flex-1"><span className="sr-only">Image URL for {recipe.title}</span><ImagePlus size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9a8b]" /><input type="url" required maxLength={2048} pattern="https?://.+" value={imageUrls[recipe.id] ?? ''} onChange={(event) => setImageUrls((current) => ({ ...current, [recipe.id]: event.target.value }))} placeholder="https://example.com/recipe-photo.jpg" className="h-9 w-full rounded-lg border border-[#dce2d8] bg-white pl-9 pr-3 text-xs text-[#294337] outline-none placeholder:text-[#a0aaa1] focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /></label>
                <button type="submit" disabled={!imageUrls[recipe.id]?.trim() || updatingId === recipe.id || deletingId === recipe.id} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#294337] px-3 text-xs font-semibold text-white hover:bg-[#3d5949] disabled:cursor-not-allowed disabled:opacity-50">
                  {updatingId === recipe.id ? <LoaderCircle size={14} className="animate-spin" /> : <Link2 size={14} />}
                  {updatingId === recipe.id ? 'Updating…' : 'Update image'}
                </button>
                <button type="button" onClick={() => deleteRecipe(recipe)} disabled={updatingId === recipe.id || deletingId === recipe.id} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#e7c7ba] bg-white px-3 text-xs font-semibold text-[#9b4e34] hover:bg-[#fbefea] disabled:cursor-not-allowed disabled:opacity-50">
                  {deletingId === recipe.id ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {deletingId === recipe.id ? 'Deleting…' : 'Delete recipe'}
                </button>
              </form>
            </div>
          </article>)}
        </div>

        {!loading && !error && !recipes.length && <p className="py-12 text-center text-sm text-[#718078]">No matching recipes found.</p>}
        {hasMore && <div className="mt-7 flex justify-center"><button type="button" onClick={loadMore} disabled={loadingMore} className="h-10 rounded-lg border border-[#cbd7c5] bg-[#fbfaf7] px-4 text-sm font-semibold text-[#40564a] hover:bg-white disabled:opacity-60">{loadingMore ? 'Loading…' : 'Show more recipes'}</button></div>}
      </section>
      </>}
    </main>
  )
}
