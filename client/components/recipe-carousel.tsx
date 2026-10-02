'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from 'lucide-react'

export type CarouselRecipe = {
  id: string
  title: string
  author: string
  category: string
  time: string
  image: string
  source?: 'mealdb'
}

type RecipeCarouselProps = {
  recipes: CarouselRecipe[]
}

export function RecipeCarousel({ recipes }: RecipeCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(preference.matches)
    updatePreference()
    preference.addEventListener('change', updatePreference)
    return () => preference.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    if (recipes.length < 2 || paused || reducedMotion) return
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % recipes.length), 5000)
    return () => window.clearInterval(timer)
  }, [paused, recipes.length, reducedMotion])

  useEffect(() => {
    setActiveIndex((index) => recipes.length ? index % recipes.length : 0)
  }, [recipes.length])

  if (!recipes.length) return null

  const activeRecipe = recipes[activeIndex]
  const activeRecipeHref = activeRecipe.source === 'mealdb' ? `/recipes/mealdb/${activeRecipe.id}` : `/recipes/${activeRecipe.id}`
  const move = (direction: number) => setActiveIndex((index) => (index + direction + recipes.length) % recipes.length)

  return (
    <section id="top" className="group relative isolate flex min-h-[620px] items-center overflow-hidden bg-[#263d32] text-white lg:min-h-[calc(100svh-72px)]">
      {recipes.map((recipe, index) => <img key={recipe.id} src={recipe.image} alt={index === activeIndex ? recipe.title : ''} aria-hidden={index !== activeIndex} className={`absolute inset-0 size-full object-cover transition-opacity duration-700 motion-reduce:transition-none ${index === activeIndex ? 'opacity-100' : 'opacity-0'}`} />)}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1d3028]/90 via-[#1d3028]/68 to-[#1d3028]/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#17271f]/45 via-transparent to-[#17271f]/15" />
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#17271f]/55 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-[1240px] px-5 py-20 lg:px-8 lg:py-24">
        <div key={activeRecipe.id} className="max-w-[760px] animate-[hero-fade-in_450ms_ease-out] motion-reduce:animate-none">
          <p className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#f0b27e]"><span className="h-px w-7 bg-[#f0b27e]" /> Cook with intention</p>
          <h1 className="font-serif text-[54px] leading-[0.96] tracking-[-0.045em] sm:text-[72px] lg:text-[82px]">Good food is<br /><em className="font-normal text-[#efad80]">meant to be shared.</em></h1>
          <p className="mt-6 max-w-[500px] text-[15px] leading-7 text-white/80 sm:text-base">A thoughtful collection of recipes from home cooks, food lovers, and curious kitchens around the world.</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href={activeRecipeHref} className="inline-flex h-12 items-center gap-3 rounded-full bg-[#e08358] px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#d1744b]">Explore the latest <ArrowUpRight size={17} /></Link>
            <div className="border-l border-white/35 pl-4"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/65">On the table now</p><Link href={activeRecipeHref} className="mt-1 block max-w-[250px] truncate font-serif text-[17px] text-white hover:text-[#f5c9a8]">{activeRecipe.title}</Link></div>
          </div>
        </div>
      </div>

      {recipes.length > 1 && <div className="absolute right-5 top-5 z-20 flex items-center gap-1.5 sm:right-8 sm:top-8 lg:right-[max(calc((100vw-1240px)/2+32px),32px)]">
        <button type="button" onClick={() => move(-1)} aria-label="Previous recipe" className="grid size-10 place-items-center rounded-full border border-white/25 bg-[#fbfaf7]/90 text-[#40564a] shadow-sm transition hover:scale-105 hover:bg-white"><ArrowLeft size={16} /></button>
        <button type="button" onClick={() => move(1)} aria-label="Next recipe" className="grid size-10 place-items-center rounded-full border border-white/25 bg-[#fbfaf7]/90 text-[#40564a] shadow-sm transition hover:scale-105 hover:bg-white"><ArrowRight size={16} /></button>
        <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Play recipe carousel' : 'Pause recipe carousel'} className="grid size-10 place-items-center rounded-full border border-white/25 bg-[#fbfaf7]/90 text-[#40564a] shadow-sm transition hover:scale-105 hover:bg-white">{paused ? <Play size={15} /> : <Pause size={15} />}</button>
      </div>}

      {recipes.length > 1 && <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 sm:bottom-8 sm:right-8 lg:right-[max(calc((100vw-1240px)/2+32px),32px)]">{recipes.map((recipe, index) => <button key={recipe.id} type="button" onClick={() => setActiveIndex(index)} aria-label={`Show recipe ${index + 1}: ${recipe.title}`} aria-current={index === activeIndex ? 'true' : undefined} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-7 bg-white' : 'w-1.5 bg-white/60 hover:bg-white'}`} />)}</div>}
    </section>
  )
}