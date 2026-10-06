export type RecipeDetailData = {
  id: string
  title: string
  author: string
  time: string
  rating: string
  category: string
  diet: string
  image: string
  color: string
  description: string
  prepTime: number
  cookTime: number
  servings: number
  ingredients: string[]
  instructions: string[]
  videoUrl?: string
}

export const recipes: RecipeDetailData[] = [
  {
    id: 'roasted-tomato-garlic-pasta',
    title: 'Roasted tomato & garlic pasta',
    author: 'Mina Park',
    time: '35 min',
    rating: '0',
    category: 'Weeknight',
    diet: 'Vegetarian',
    image: '/images/roasted-tomato-pasta.png',
    color: 'bg-[#e0a05b]',
    description: 'Sweet, blistered tomatoes and slow-roasted garlic melt into a silky pan sauce. Finish with basil and a little pasta water for a simple dinner that tastes like you took all afternoon.',
    prepTime: 10,
    cookTime: 25,
    servings: 4,
    ingredients: ['400 g ripe cherry tomatoes', '4 cloves garlic, thinly sliced', '3 tbsp extra-virgin olive oil', '350 g rigatoni or your favorite pasta', '1 tsp flaky sea salt', 'A handful of fresh basil', '40 g finely grated parmesan'],
    instructions: ['Heat the oven to 220°C. Toss the tomatoes and garlic with olive oil and salt in a baking dish.', 'Roast for 20 minutes, until the tomatoes collapse and their edges begin to caramelize.', 'Meanwhile, cook the pasta in well-salted water until just al dente. Reserve a mug of pasta water.', 'Tip the pasta into the tomato dish. Add a splash of pasta water and toss until glossy.', 'Tear in the basil, finish with parmesan, and serve straight from the dish.'],
  },
  {
    id: 'citrus-herb-roasted-salmon',
    title: 'Citrus herb roasted salmon',
    author: 'Noah Williams',
    time: '45 min',
    rating: '0',
    category: 'Dinner',
    diet: 'Gluten-free',
    image: '/images/citrus-salmon.png',
    color: 'bg-[#d98d50]',
    description: 'A bright tray-bake with flaky salmon, sweet citrus, and a handful of soft herbs. It is light enough for a midweek supper and lovely enough to bring to the table whole.',
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    ingredients: ['4 salmon fillets, skin on', '1 orange, thinly sliced', '1 lemon, thinly sliced', '2 tbsp extra-virgin olive oil', '1 tsp honey', '1 small bunch dill and parsley', 'Sea salt and cracked black pepper'],
    instructions: ['Heat the oven to 200°C and line a shallow roasting tray with baking paper.', 'Arrange the citrus slices in the tray. Set the salmon on top, skin-side down.', 'Whisk the olive oil and honey, spoon over the fillets, then season generously.', 'Roast for 12–15 minutes, depending on thickness, until the salmon flakes gently.', 'Scatter over chopped herbs and serve with the roasted citrus and pan juices.'],
  },
  {
    id: 'green-goddess-grain-bowl',
    title: 'Green goddess grain bowl',
    author: 'Ari Chen',
    time: '25 min',
    rating: '0',
    category: 'Fresh & light',
    diet: 'Vegan',
    image: '/images/green-goddess-bowl.png',
    color: 'bg-[#9caf85]',
    description: 'A generous bowl of warm grains, crisp greens, and creamy herby dressing. Prep the dressing while the grains cook and lunch is ready before you know it.',
    prepTime: 15,
    cookTime: 10,
    servings: 2,
    ingredients: ['150 g farro or quinoa', '1 ripe avocado, sliced', '1 small cucumber, ribboned', '2 handfuls baby spinach', '120 g edamame, cooked', '1 small bunch parsley', '2 tbsp tahini', '1 lemon, juiced', '3 tbsp cold water', 'Sea salt and toasted seeds'],
    instructions: ['Cook the farro or quinoa in salted water according to the packet, then drain well.', 'Blend the parsley, tahini, lemon juice, water, and a pinch of salt until smooth.', 'Divide the warm grains between two bowls and arrange the spinach, cucumber, avocado, and edamame on top.', 'Spoon over the green dressing and finish with toasted seeds and extra lemon.'],
  },
]