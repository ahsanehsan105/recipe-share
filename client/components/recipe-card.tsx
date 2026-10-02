import Link from 'next/link'
import { Bookmark, BookOpen, ChefHat, Clock3, Star } from 'lucide-react'

export type RecipeCardData = {
  id: string
  title: string
  author: string
  time: string
  rating: string
  category: string
  diet: string
  image: string
  color: string
  source?: 'mealdb'
  detail?: string
}

type RecipeCardProps = {
  recipe: RecipeCardData
  saved: boolean
  onToggleSaved: () => void
}

export function RecipeCard({ recipe, saved, onToggleSaved }: RecipeCardProps) {
  const recipeHref = recipe.source === 'mealdb'
    ? `/recipes/mealdb/${recipe.id}`
    : `/recipes/${recipe.id}`

  return (
    <article className="group relative overflow-hidden rounded-[18px] border border-[#e0e5dc] bg-[#fbfbf8] shadow-[0_5px_20px_rgba(65,85,65,0.04)] transition-shadow hover:shadow-[0_12px_32px_rgba(65,85,65,0.12)]">
      <Link href={recipeHref} className="block rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#91a887]" aria-label={`View ${recipe.title} recipe`}>
        <div className={`relative h-[230px] overflow-hidden ${recipe.color}`}>{recipe.image ? <img src={recipe.image} alt={recipe.title} className="size-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid size-full place-items-center bg-[#e8eddf] text-[#708363]"><div className="flex flex-col items-center gap-2"><ChefHat size={32} strokeWidth={1.5} /><span className="text-[10px] font-bold uppercase tracking-[0.16em]">Recipe library</span></div></div>}<span className="absolute bottom-4 left-4 rounded-full bg-[#fbfaf7]/90 px-3 py-1.5 text-[11px] font-bold text-[#52665a] backdrop-blur">{recipe.category}</span></div>
        <div className="p-5"><div className="mb-3 flex items-center justify-between text-[12px] text-[#89958d]"><span>By <strong className="font-medium text-[#63726a]">{recipe.author}</strong></span>{recipe.rating && <span className="flex items-center gap-1 text-[#af7953]"><Star size={13} fill="currentColor" /> {recipe.rating}</span>}</div><h3 className="font-serif text-[24px] leading-[1.08] text-[#294337]">{recipe.title}</h3><div className="mt-5 flex items-center gap-1.5 text-[12px] font-medium text-[#849087]">{recipe.time ? <><Clock3 size={14} /> {recipe.time}<span className="mx-1 text-[#ccd4ca]">·</span></> : <BookOpen size={14} />}{recipe.detail || recipe.diet}</div></div>
      </Link>
      <button type="button" onClick={onToggleSaved} className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-[#fbfaf7]/90 text-[#53665b] shadow-sm backdrop-blur transition hover:bg-white" aria-label={saved ? `Remove ${recipe.title} from saved` : `Save ${recipe.title}`}>{saved ? <Bookmark size={18} fill="currentColor" /> : <Bookmark size={18} />}</button>
    </article>
  )
}