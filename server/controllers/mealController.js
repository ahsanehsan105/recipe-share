const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1'

function normalizeInstructions(value) {
  return String(value || '')
    .split(/\r?\n+/)
    .map((step) => step.trim())
    .filter((step) => step && !/^(?:step\s*)?\d+[.):]?$/i.test(step))
}

async function fetchMealDb(pathname, params = {}) {
  const url = new URL(`${API_BASE_URL}/${pathname}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)

  const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error(`TheMealDB returned HTTP ${response.status}.`)
  return response.json()
}

function normalizeMeal(meal) {
  const ingredients = []
  for (let index = 1; index <= 20; index += 1) {
    const name = String(meal[`strIngredient${index}`] || '').trim()
    const measure = String(meal[`strMeasure${index}`] || '').trim()
    if (name) ingredients.push({ name, measure })
  }

  return {
    id: String(meal.idMeal || ''),
    title: String(meal.strMeal || ''),
    image: String(meal.strMealThumb || ''),
    category: String(meal.strCategory || ''),
    area: String(meal.strArea || ''),
    instructions: normalizeInstructions(meal.strInstructions),
    ingredients,
    tags: String(meal.strTags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
    youtube: String(meal.strYoutube || ''),
    source: String(meal.strSource || ''),
  }
}

function respondWithError(response, error) {
  console.error('[TheMealDB] Request failed:', error.message)
  const timedOut = error.name === 'TimeoutError' || error.name === 'AbortError'
  return response.status(timedOut ? 504 : 502).json({ message: timedOut ? 'TheMealDB timed out. Please try again.' : 'Could not load meals from TheMealDB.' })
}

async function searchMeals(request, response) {
  const search = String(request.query.search || '').trim()
  if (search.length < 2 || search.length > 100) {
    return response.status(400).json({ message: 'Enter a meal search with 2 to 100 characters.' })
  }

  try {
    const payload = await fetchMealDb('search.php', { s: search })
    const meals = (payload.meals || []).map(normalizeMeal)
    console.info(`[TheMealDB] Search "${search}" returned ${meals.length} meal(s).`)
    return response.json({ meals })
  } catch (error) {
    return respondWithError(response, error)
  }
}

async function getMealsByLetter(request, response) {
  const letter = String(request.params.letter || '').toLowerCase()
  if (!/^[a-z]$/.test(letter)) return response.status(400).json({ message: 'Choose one letter from A to Z.' })

  try {
    const payload = await fetchMealDb('search.php', { f: letter })
    const meals = (payload.meals || []).map(normalizeMeal)
    return response.json({ meals })
  } catch (error) {
    return respondWithError(response, error)
  }
}

async function getMealsByFilter(request, response, parameter, label) {
  const value = String(request.query.name || '').trim()
  if (!value || value.length > 80) return response.status(400).json({ message: `Choose a valid meal ${label}.` })

  try {
    const payload = await fetchMealDb('filter.php', { [parameter]: value })
    const meals = (payload.meals || []).map((meal) => ({
      id: String(meal.idMeal || ''),
      title: String(meal.strMeal || ''),
      image: String(meal.strMealThumb || ''),
      category: parameter === 'c' ? value : '',
      area: '',
      instructions: [],
      ingredients: [],
      tags: [],
      youtube: '',
      source: '',
    }))
    return response.json({ meals })
  } catch (error) {
    return respondWithError(response, error)
  }
}

function getMealsByCategory(request, response) {
  return getMealsByFilter(request, response, 'c', 'category')
}

function getMealsByArea(request, response) {
  return getMealsByFilter(request, response, 'a', 'area')
}

function getMealsByIngredient(request, response) {
  return getMealsByFilter(request, response, 'i', 'ingredient')
}

async function getMealLists(request, response) {
  const listTypes = { categories: 'c', areas: 'a', ingredients: 'i' }
  const type = request.params.type
  if (!listTypes[type]) return response.status(400).json({ message: 'Choose categories, areas, or ingredients.' })

  try {
    const payload = await fetchMealDb('list.php', { [listTypes[type]]: 'list' })
    const field = type === 'categories' ? 'strCategory' : type === 'areas' ? 'strArea' : 'strIngredient'
    return response.json({ items: (payload.meals || []).map((item) => String(item[field] || '')).filter(Boolean) })
  } catch (error) {
    return respondWithError(response, error)
  }
}

async function getMealCategories(_request, response) {
  try {
    const payload = await fetchMealDb('categories.php')
    return response.json({ categories: (payload.categories || []).map((category) => ({
      name: String(category.strCategory || ''),
      image: String(category.strCategoryThumb || ''),
      description: String(category.strCategoryDescription || ''),
    })) })
  } catch (error) {
    return respondWithError(response, error)
  }
}

async function getRandomMeal(_request, response) {
  try {
    const payload = await fetchMealDb('random.php')
    const meal = payload.meals?.[0]
    return meal ? response.json({ meal: normalizeMeal(meal) }) : response.status(404).json({ message: 'No random meal was found.' })
  } catch (error) {
    return respondWithError(response, error)
  }
}

async function getMealById(request, response) {
  const id = String(request.params.id || '')
  if (!/^\d+$/.test(id)) return response.status(400).json({ message: 'Invalid meal ID.' })

  try {
    const payload = await fetchMealDb('lookup.php', { i: id })
    const meal = payload.meals?.[0]
    return meal ? response.json({ meal: normalizeMeal(meal) }) : response.status(404).json({ message: 'Meal not found.' })
  } catch (error) {
    return respondWithError(response, error)
  }
}

module.exports = { getMealById, getMealCategories, getMealLists, getMealsByArea, getMealsByCategory, getMealsByIngredient, getMealsByLetter, getRandomMeal, searchMeals }