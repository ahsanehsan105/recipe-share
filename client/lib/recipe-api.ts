import type { RecipeCardData } from '../components/recipe-card'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api'
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')
const MEAL_CACHE_KEY = 'recipeShare.themealdb.meals.v2'

type ApiRecipeCard = {
  _id: string
  name: string
  sharedBy: string
  prepTime: number
  cookTime: number
  category: string
  diet: string
  imagePath: string
}

export async function getSharedRecipeCards(): Promise<RecipeCardData[]> {
  const response = await fetch(`${API_BASE_URL}/recipes`)
  if (!response.ok) throw new Error('Shared recipes are temporarily unavailable.')

  const result = await response.json() as { recipes: ApiRecipeCard[] }
  return result.recipes.map((recipe) => ({
    id: recipe._id,
    title: recipe.name,
    author: recipe.sharedBy,
    time: `${recipe.prepTime + recipe.cookTime} min`,
    rating: 'New',
    category: recipe.category,
    diet: recipe.diet === 'Everything' ? 'All diets' : recipe.diet,
    image: recipe.imagePath.startsWith('http') ? recipe.imagePath : `${SERVER_BASE_URL}${recipe.imagePath}`,
    color: 'bg-[#dbe8c9]',
  }))
}

export type MealDbMeal = {
  id: string
  title: string
  image: string
  category: string
  area: string
  ingredients: Array<{ name: string; measure: string }>
  instructions: string[]
  tags: string[]
  youtube: string
  source: string
}

export type MealDbCategory = {
  name: string
  image: string
  description: string
}

async function mealRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/meals/${path}`)
  const result = await response.json()
  if (!response.ok) throw new Error(result.message ?? 'TheMealDB request failed.')
  return result as T
}

function cacheMeals(meals: MealDbMeal[]) {
  if (typeof window !== 'undefined') {
    try {
      const cache = JSON.parse(sessionStorage.getItem(MEAL_CACHE_KEY) || '{}') as Record<string, MealDbMeal>
      for (const meal of meals) {
        if (meal.instructions.length && meal.ingredients.length) cache[meal.id] = meal
      }
      const recentEntries = Object.entries(cache).slice(-50)
      sessionStorage.setItem(MEAL_CACHE_KEY, JSON.stringify(Object.fromEntries(recentEntries)))
    } catch {
      return
    }
  }
}

export async function searchMeals(search: string): Promise<MealDbMeal[]> {
  const result = await mealRequest<{ meals: MealDbMeal[] }>(`search?search=${encodeURIComponent(search)}`)
  cacheMeals(result.meals || [])
  return result.meals || []
}

export async function getMealsByLetter(letter: string): Promise<MealDbMeal[]> {
  const result = await mealRequest<{ meals: MealDbMeal[] }>(`letter/${encodeURIComponent(letter)}`)
  cacheMeals(result.meals || [])
  return result.meals || []
}

export async function getMealsByCategory(category: string): Promise<MealDbMeal[]> {
  const result = await mealRequest<{ meals: MealDbMeal[] }>(`category?name=${encodeURIComponent(category)}`)
  return result.meals || []
}

export async function getMealsByArea(area: string): Promise<MealDbMeal[]> {
  const result = await mealRequest<{ meals: MealDbMeal[] }>(`area?name=${encodeURIComponent(area)}`)
  return result.meals || []
}

export async function getMealsByIngredient(ingredient: string): Promise<MealDbMeal[]> {
  const result = await mealRequest<{ meals: MealDbMeal[] }>(`ingredient?name=${encodeURIComponent(ingredient)}`)
  return result.meals || []
}

export async function getMealList(type: 'areas' | 'ingredients'): Promise<string[]> {
  const result = await mealRequest<{ items: string[] }>(`lists/${type}`)
  return [...new Map((result.items || []).filter(Boolean).map((item) => [item.trim().toLocaleLowerCase(), item.trim()])).values()]
}

export async function getMealCategories(): Promise<MealDbCategory[]> {
  const result = await mealRequest<{ categories: MealDbCategory[] }>('categories')
  return [...new Map((result.categories || []).filter((category) => category.name).map((category) => [category.name.trim().toLocaleLowerCase(), category])).values()]
}

export async function getRandomMeal(): Promise<MealDbMeal> {
  const result = await mealRequest<{ meal: MealDbMeal }>('random')
  cacheMeals([result.meal])
  return result.meal
}

export async function getMealById(id: string): Promise<MealDbMeal> {
  const result = await mealRequest<{ meal: MealDbMeal }>(encodeURIComponent(id))
  cacheMeals([result.meal])
  return result.meal
}

export function getCachedMeal(id: string): MealDbMeal | null {
  if (typeof window === 'undefined') return null
  try {
    const cache = JSON.parse(sessionStorage.getItem(MEAL_CACHE_KEY) || '{}') as Record<string, MealDbMeal>
    return cache[id] ?? null
  } catch {
    return null
  }
}

export function toMealCards(meals: MealDbMeal[]): RecipeCardData[] {
  return meals.map((meal) => ({
    id: meal.id,
    title: meal.title,
    author: meal.area || 'TheMealDB',
    time: '',
    rating: '',
    category: meal.category || 'Meal',
    diet: '',
    image: meal.image,
    color: 'bg-[#e8eddf]',
    source: 'mealdb',
    detail: [meal.area, meal.category].filter(Boolean).join(' · ') || 'Open recipe',
  }))
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