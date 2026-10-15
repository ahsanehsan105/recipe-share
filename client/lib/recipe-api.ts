import type { RecipeCardData } from '../components/recipe-card'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api'
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')

type ApiRecipeCard = {
  _id: string
  name: string
  sharedBy: string
  prepTime: number
  cookTime: number
  category: string
  diet: string
  ingredients: string[]
  description: string
  imagePath: string
  rating?: number
}

export type RecipeListFilters = {
  page?: number
  limit?: number
  search?: string
  category?: string
  area?: string
  ingredient?: string
  letter?: string
}

export type RecipeListPage = {
  recipes: RecipeCardData[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

function formatRating(value: number | string | null | undefined): string {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return '0'
  return numericValue > 0 ? numericValue.toFixed(1) : '0'
}

export function getRecipeImageUrl(imagePath: string): string {
  return imagePath.startsWith('http') ? imagePath : `${SERVER_BASE_URL}${imagePath}`
}

export async function getSharedRecipeCards(filters: RecipeListFilters = {}): Promise<RecipeListPage> {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 15),
  })
  for (const key of ['search', 'category', 'area', 'ingredient', 'letter'] as const) {
    const value = filters[key]?.trim()
    if (value) params.set(key, value)
  }

  const response = await fetch(`${API_BASE_URL}/recipes?${params}`)
  if (!response.ok) throw new Error('Shared recipes are temporarily unavailable.')

  const result = await response.json() as { recipes: ApiRecipeCard[]; pagination: RecipeListPage['pagination'] }
  return {
    recipes: result.recipes.map((recipe) => ({
      id: recipe._id,
      title: recipe.name,
      author: recipe.sharedBy,
      time: `${recipe.prepTime + recipe.cookTime} min`,
      rating: formatRating(recipe.rating ?? 0),
      category: recipe.category,
      diet: recipe.diet === 'Everything' ? 'All diets' : recipe.diet,
      ingredients: recipe.ingredients,
      description: recipe.description,
      image: recipe.imagePath.startsWith('http') ? recipe.imagePath : `${SERVER_BASE_URL}${recipe.imagePath}`,
      color: 'bg-[#dbe8c9]',
    })),
    pagination: result.pagination,
  }
}

export async function updateRecipeImage(recipeId: string, imageUrl: string, adminKey: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/recipes/${encodeURIComponent(recipeId)}/image`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-recipe-image-admin-key': adminKey },
    body: JSON.stringify({ imageUrl }),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message ?? 'Could not update the recipe image.')
  return getRecipeImageUrl(result.recipe.imagePath as string)
}

export async function verifyRecipeImageAdminKey(adminKey: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/recipes/admin/image-access`, {
    method: 'POST',
    headers: { 'x-recipe-image-admin-key': adminKey },
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message ?? 'Admin authorization failed.')
}

export type RecipeRating = {
  _id: string
  name: string
  rating: number
  message?: string
  createdAt: string
}

export type RecipeQuestion = {
  _id: string
  name: string
  message: string
  createdAt: string
}

export type RecipeFeedback = {
  summary: {
    total: number
    average: number | null
    distribution: Array<{ rating: number; count: number }>
  }
  ratings: RecipeRating[]
  questions: RecipeQuestion[]
}

export async function getRecipeFeedback(recipeId: string): Promise<RecipeFeedback> {
  const response = await fetch(`${API_BASE_URL}/recipes/${encodeURIComponent(recipeId)}/feedback`)
  const result = await response.json()
  if (!response.ok) throw new Error(result.message ?? 'Could not load recipe feedback.')
  return result as RecipeFeedback
}

export async function submitRecipeRating(recipeId: string, payload: { name: string; rating: number; message: string }): Promise<RecipeRating> {
  const response = await fetch(`${API_BASE_URL}/recipes/${encodeURIComponent(recipeId)}/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message ?? 'Could not save your rating.')
  return result.rating as RecipeRating
}

export async function submitRecipeQuestion(recipeId: string, payload: { name: string; message: string }): Promise<RecipeQuestion> {
  const response = await fetch(`${API_BASE_URL}/recipes/${encodeURIComponent(recipeId)}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message ?? 'Could not post your question.')
  return result.question as RecipeQuestion
}