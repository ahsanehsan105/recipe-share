'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Camera, ChefHat, Clock3, ImagePlus, LoaderCircle, Plus, Users, Video, X } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api'
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')
const MAX_IMAGE_SIZE = 2 * 1024 * 1024

export type SharedRecipeCard = {
  id: string
  title: string
  author: string
  time: string
  rating: string
  category: string
  diet: string
  image: string
  color: string
}

type RecipeShareFormProps = {
  onClose: () => void
  onCreated: (recipe: SharedRecipeCard) => void
  onSuccess?: (title: string) => void
  initialRecipe?: {
    title: string
    servings?: string
    image?: string
    ingredients: Array<{ name: string; measure: string }>
    instructions: string[]
  }
}

const categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Drinks', 'Baking']
const diets = ['Everything', 'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free']

export function RecipeShareForm({ onClose, onCreated, onSuccess, initialRecipe }: RecipeShareFormProps) {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState(initialRecipe?.image ?? '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const initialServings = Number.parseInt(initialRecipe?.servings?.match(/\d+/)?.[0] || '', 10)
  const [recipeName, setRecipeName] = useState(initialRecipe?.title ?? '')
  const [ingredientText, setIngredientText] = useState(initialRecipe?.ingredients.map((ingredient) => [ingredient.measure, ingredient.name].filter(Boolean).join(' ')).join('\n') ?? '')
  const [instructionText, setInstructionText] = useState(initialRecipe?.instructions.join('\n') ?? '')
  const [servings, setServings] = useState(String(initialServings > 0 ? Math.min(initialServings, 100) : initialRecipe ? '' : 4))
  const [category, setCategory] = useState(initialRecipe ? '' : 'Dinner')
  const [prepTime, setPrepTime] = useState(initialRecipe ? '' : '15')
  const [cookTime, setCookTime] = useState(initialRecipe ? '' : '30')

  useEffect(() => {
    if (!preview) return
    return () => URL.revokeObjectURL(preview)
  }, [preview])

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, submitting])

  function chooseImage(file?: File) {
    if (!file) return
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Choose an image that is 2 MB or smaller.')
      setImage(null)
      setPreview(initialRecipe?.image ?? '')
      return
    }
    setError('')
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  async function submitRecipe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const formData = new FormData(event.currentTarget)
    if (image) formData.set('image', image)

    try {
      const response = await fetch(`${API_BASE_URL}/recipes`, { method: 'POST', body: formData })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message ?? 'We could not share your recipe. Please try again.')

      const recipe = result.recipe
      const createdRecipe = {
        id: recipe._id,
        title: recipe.name,
        author: recipe.sharedBy,
        time: `${recipe.prepTime + recipe.cookTime} min`,
        rating: '0',
        category: recipe.category,
        diet: recipe.diet === 'Everything' ? 'All diets' : recipe.diet,
        image: recipe.imagePath.startsWith('http') ? recipe.imagePath : `${SERVER_BASE_URL}${recipe.imagePath}`,
        color: 'bg-[#dbe8c9]',
      }
      onCreated(createdRecipe)
      onClose()
      onSuccess?.(createdRecipe.title)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1f3028]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="share-title" className="recipe-share-scroll max-h-[94dvh] w-full max-w-[760px] overflow-y-auto rounded-t-[24px] bg-[#fbfaf7] shadow-[0_24px_80px_rgba(20,35,28,0.28)] sm:rounded-[22px]">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#e2e6de] bg-[#fbfaf7]/95 px-5 py-5 backdrop-blur sm:px-8">
          <div>
            <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b76e43]"><ChefHat size={14} /> From your kitchen</p>
            <h2 id="share-title" className="font-serif text-[30px] leading-tight tracking-[-0.04em] text-[#294337]">Share a recipe</h2>
            <p className="mt-1 text-sm text-[#7a877e]">Pass a favorite along to the community.</p>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} aria-label="Close recipe form" className="grid size-9 shrink-0 place-items-center rounded-full text-[#64736a] transition hover:bg-[#edf0e9] disabled:opacity-50"><X size={19} /></button>
        </div>

        <form onSubmit={submitRecipe} className="space-y-7 px-5 py-6 sm:px-8 sm:py-7">
          {initialRecipe?.image && <input type="hidden" name="imageUrl" value={initialRecipe.image} />}
          <div className="grid gap-5 sm:grid-cols-[1fr_220px]">
            <div className="space-y-4">
              <label className="block text-[12px] font-semibold text-[#52635a]">Recipe name <span className="text-[#c8754c]">*</span><input name="name" required maxLength={100} value={recipeName} onChange={(event) => setRecipeName(event.target.value)} placeholder="e.g. Sunday lemon olive-oil cake" className="mt-2 h-11 w-full rounded-lg border border-[#dce2d8] bg-white px-3.5 text-sm font-normal text-[#294337] outline-none placeholder:text-[#a0aaa1] focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /></label>
              <label className="block text-[12px] font-semibold text-[#52635a]">Your name <span className="text-[#c8754c]">*</span><input name="sharedBy" required maxLength={60} placeholder="Who should we credit?" className="mt-2 h-11 w-full rounded-lg border border-[#dce2d8] bg-white px-3.5 text-sm font-normal text-[#294337] outline-none placeholder:text-[#a0aaa1] focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /></label>
              <label className="block text-[12px] font-semibold text-[#52635a]">Your email <span className="text-[#c8754c]">*</span><input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" className="mt-2 h-11 w-full rounded-lg border border-[#dce2d8] bg-white px-3.5 text-sm font-normal text-[#294337] outline-none placeholder:text-[#a0aaa1] focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[12px] font-semibold text-[#52635a]">Category <span className="text-[#c8754c]">*</span><select name="category" required value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-[#dce2d8] bg-white px-3 text-sm font-normal text-[#294337] outline-none focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]"><option value="" disabled>Select category</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label className="block text-[12px] font-semibold text-[#52635a]">Diet <select name="diet" defaultValue="Everything" className="mt-2 h-11 w-full rounded-lg border border-[#dce2d8] bg-white px-3 text-sm font-normal text-[#294337] outline-none focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]">{diets.map((diet) => <option key={diet}>{diet}</option>)}</select></label>
              </div>
            </div>

            <label className="group relative flex min-h-[190px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#b8c6b5] bg-[#f1f3ed] text-center transition hover:border-[#7e9977] hover:bg-[#ebf0e6]">
              {preview ? <img src={preview} alt="Recipe preview" className="absolute inset-0 size-full object-cover" /> : <><span className="mb-3 grid size-11 place-items-center rounded-full bg-white text-[#6e8665] shadow-sm"><ImagePlus size={20} /></span><span className="text-[12px] font-semibold text-[#52635a]">Add a recipe photo</span><span className="mt-1 text-[11px] text-[#8b9a8b]">JPG, PNG or WebP · up to 2 MB</span></>}
              <input name="image" type="file" accept="image/jpeg,image/png,image/webp" required={!initialRecipe?.image} className="sr-only" onChange={(event) => chooseImage(event.target.files?.[0])} />
              {preview && <span className="absolute bottom-2 right-2 grid size-9 place-items-center rounded-full bg-[#fbfaf7]/90 text-[#52635a] shadow"><Camera size={17} /></span>}
            </label>
          </div>

          <label className="block text-[12px] font-semibold text-[#52635a]">Recipe video link <span className="font-normal text-[#8b9a8b]">(optional)</span><input name="videoUrl" type="url" maxLength={2048} pattern="https?://.+" placeholder="https://youtube.com/watch?v=..." className="mt-2 h-11 w-full rounded-lg border border-[#dce2d8] bg-white px-3.5 text-sm font-normal text-[#294337] outline-none placeholder:text-[#a0aaa1] focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /><span className="mt-1.5 flex items-center gap-1.5 text-[11px] font-normal text-[#8b9a8b]"><Video size={13} /> Add a YouTube, Vimeo, or other https video URL.</span></label>

          <label className="block text-[12px] font-semibold text-[#52635a]">A little about it <span className="text-[#c8754c]">*</span><textarea name="description" required minLength={10} maxLength={600} rows={3} placeholder="What makes this one worth sharing?" className="mt-2 w-full resize-y rounded-lg border border-[#dce2d8] bg-white px-3.5 py-3 text-sm font-normal leading-6 text-[#294337] outline-none placeholder:text-[#a0aaa1] focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /></label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-[12px] font-semibold text-[#52635a]">Ingredients <span className="text-[#c8754c]">*</span><textarea name="ingredients" required minLength={3} rows={5} value={ingredientText} onChange={(event) => setIngredientText(event.target.value)} placeholder={'2 cups ripe tomatoes\n3 cloves garlic\nA generous pinch of sea salt'} className="mt-2 w-full resize-y rounded-lg border border-[#dce2d8] bg-white px-3.5 py-3 text-sm font-normal leading-6 text-[#294337] outline-none placeholder:text-[#a0aaa1] focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /></label>
            <label className="block text-[12px] font-semibold text-[#52635a]">Method <span className="text-[#c8754c]">*</span><textarea name="instructions" required minLength={3} rows={5} value={instructionText} onChange={(event) => setInstructionText(event.target.value)} placeholder={'1. Warm the oven to 200°C.\n2. Prepare your ingredients.\n3. Bring everything together and serve.'} className="mt-2 w-full resize-y rounded-lg border border-[#dce2d8] bg-white px-3.5 py-3 text-sm font-normal leading-6 text-[#294337] outline-none placeholder:text-[#a0aaa1] focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /></label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="block text-[12px] font-semibold text-[#52635a]"><span className="flex items-center gap-1.5"><Clock3 size={13} /> Prep (min)</span><input name="prepTime" type="number" required min="0" max="1440" value={prepTime} onChange={(event) => setPrepTime(event.target.value)} placeholder={initialRecipe ? 'Not provided' : undefined} className="mt-2 h-10 w-full rounded-lg border border-[#dce2d8] bg-white px-3 text-sm font-normal text-[#294337] outline-none placeholder:text-[#a0aaa1] focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /></label>
            <label className="block text-[12px] font-semibold text-[#52635a]"><span className="flex items-center gap-1.5"><Clock3 size={13} /> Cook (min)</span><input name="cookTime" type="number" required min="0" max="1440" value={cookTime} onChange={(event) => setCookTime(event.target.value)} placeholder={initialRecipe ? 'Not provided' : undefined} className="mt-2 h-10 w-full rounded-lg border border-[#dce2d8] bg-white px-3 text-sm font-normal text-[#294337] outline-none placeholder:text-[#a0aaa1] focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /></label>
            <label className="block text-[12px] font-semibold text-[#52635a]"><span className="flex items-center gap-1.5"><Users size={13} /> Serves</span><input name="servings" type="number" required min="1" max="100" value={servings} onChange={(event) => setServings(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#dce2d8] bg-white px-3 text-sm font-normal text-[#294337] outline-none focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /></label>
          </div>

          {error && <p role="alert" className="rounded-lg border border-[#e7c7ba] bg-[#fbefea] px-3.5 py-3 text-sm text-[#9b4e34]">{error}</p>}
          <div className="flex flex-col-reverse gap-3 border-t border-[#e2e6de] pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={submitting} className="h-11 rounded-lg px-5 text-sm font-semibold text-[#68766e] transition hover:bg-[#eff1eb] disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={submitting} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#d9794f] px-5 text-sm font-semibold text-white transition hover:bg-[#c86942] disabled:cursor-wait disabled:opacity-70">{submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={17} />} {submitting ? 'Sharing recipe…' : 'Share recipe'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}