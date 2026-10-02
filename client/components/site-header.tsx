'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, ChefHat, Menu, X } from 'lucide-react'
import { RecipeShareForm, type SharedRecipeCard } from './recipe-share-form'

type SiteHeaderProps = {
  onRecipeCreated?: (recipe: SharedRecipeCard) => void
  variant?: 'standard' | 'recipe-detail'
}

const navigation = [
  { label: 'Discover', href: '/#discover' },
  { label: 'Collections', href: '/collections' },
  { label: 'Community', href: '/community' },
]

export function SiteHeader({ onRecipeCreated, variant = 'standard' }: SiteHeaderProps) {
  const pathname = usePathname()
  const recipeDetail = variant === 'recipe-detail'
  const [menuOpen, setMenuOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const isHome = pathname === '/'
  const transparent = menuOpen || (isHome && !scrolled)

  useEffect(() => {
    if (!isHome) {
      setScrolled(false)
      return
    }

    const updateScrollState = () => setScrolled(window.scrollY > 8)
    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })
    return () => window.removeEventListener('scroll', updateScrollState)
  }, [isHome])

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  function shareRecipe(recipe: SharedRecipeCard) {
    onRecipeCreated?.(recipe)
    setShareOpen(false)
  }

  return (
    <>
      <header className={`site-nav ${isHome ? 'fixed inset-x-0 top-0' : 'sticky top-0'} z-40 w-full border-b backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300 ${transparent ? 'border-transparent bg-transparent shadow-none' : 'border-[#dfe3dc]/90 bg-[#fbfaf7]/95 shadow-[0_6px_24px_rgba(35,53,45,0.08)]'}`}>
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <Link href="/" className="group flex items-center gap-3" aria-label="Recipe Share home" onClick={() => setMenuOpen(false)}>
            <span className={`grid size-9 place-items-center rounded-full transition-transform duration-300 group-hover:rotate-[-8deg] ${transparent ? 'bg-white/15 text-white' : 'bg-[#dbe8c9] text-[#486144]'}`}><ChefHat size={19} strokeWidth={1.9} /></span>
            <span className={`font-serif text-[25px] tracking-[-0.04em] transition-colors duration-300 ${transparent ? 'text-white' : 'text-[#294337]'}`}>Recipe Share<span className={transparent ? 'text-[#efad80]' : 'text-[#b76e43]'}>.</span></span>
          </Link>

          {!recipeDetail && <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navigation.map((item, index) => {
              const active = item.href === '/collections' ? pathname === '/collections' : item.href === '/community' ? pathname === '/community' : pathname === '/'
              const activeStyle = transparent ? 'bg-white/15 text-white' : 'bg-[#e9eee3] text-[#294337]'
              const idleStyle = transparent ? 'text-white/85 hover:bg-white/10 hover:text-white' : 'text-[#64736a] hover:bg-[#f0f2ec] hover:text-[#294337]'
              return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} style={{ animationDelay: `${index * 70}ms` }} className={`site-nav-link rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${active ? `is-active ${activeStyle}` : idleStyle}`}>{item.label}</Link>
            })}
          </nav>}

          <div className="flex items-center gap-2">
            {recipeDetail ? <Link href="/collections" aria-label="Back to recipes" className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-[#52635a] transition hover:bg-[#e9eee3] hover:text-[#294337]"><ArrowLeft size={16} /><span className="hidden sm:inline">Back to recipes</span></Link> : <>
              <button type="button" onClick={() => setShareOpen(true)} className="hidden rounded-full bg-[#d9794f] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#c86942] sm:inline-flex">Share a recipe</button>
              <button type="button" onClick={() => setMenuOpen((open) => !open)} className={`grid size-10 place-items-center rounded-full border transition md:hidden ${transparent ? 'border-white/35 text-white hover:bg-white/10' : 'border-[#dfe3dc] text-[#52635a] hover:bg-[#edf0e9]'}`} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen}>{menuOpen ? <X size={18} /> : <Menu size={19} />}</button>
            </>}
          </div>
        </div>

      </header>
      {!recipeDetail && menuOpen && <div className="fixed inset-0 z-30 flex flex-col items-center justify-center px-6 pb-8 pt-20 md:hidden">
        <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu" className="mobile-menu-backdrop absolute inset-0 bg-[#20352b]/80 backdrop-blur-xl" />
        <nav className="relative z-10 flex w-full max-w-sm flex-col items-stretch" aria-label="Mobile navigation">
          {navigation.map((item, index) => {
            const active = item.href === '/collections' ? pathname === '/collections' : item.href === '/community' ? pathname === '/community' : pathname === '/'
            return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} onClick={() => setMenuOpen(false)} style={{ animationDelay: `${index * 90}ms` }} className={`mobile-menu-item border-b border-white/15 py-4 text-center font-serif text-[30px] leading-tight text-white transition-colors hover:text-[#efad80] ${active ? 'text-[#efad80]' : ''}`}>{item.label}</Link>
          })}
          <button type="button" onClick={() => { setShareOpen(true); setMenuOpen(false) }} style={{ animationDelay: `${navigation.length * 90}ms` }} className="mobile-menu-item mt-7 h-12 rounded-full bg-[#e08358] px-6 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:bg-[#d1744b]">Share a recipe</button>
        </nav>
      </div>}
      {!recipeDetail && shareOpen && <RecipeShareForm onClose={() => setShareOpen(false)} onCreated={shareRecipe} />}
    </>
  )
}