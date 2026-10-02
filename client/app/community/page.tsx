'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { LoaderCircle, MessageSquareQuote, Send, Star } from 'lucide-react'
import { SiteHeader } from '../../components/site-header'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api'

type CommunityReview = {
  _id: string
  name: string
  rating: number
  message: string
  createdAt: string
}

export default function CommunityPage() {
  const [reviews, setReviews] = useState<CommunityReview[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let active = true
    fetch(`${API_BASE_URL}/community/reviews`)
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.message ?? 'Community feedback is unavailable right now.')
        return result as { reviews: CommunityReview[] }
      })
      .then((result) => { if (active) setReviews(result.reviews) })
      .catch((error: unknown) => { if (active) setLoadError(error instanceof Error ? error.message : 'Could not load community feedback.') })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [])

  const stats = useMemo(() => {
    const total = reviews.length
    const average = total ? reviews.reduce((sum, review) => sum + review.rating, 0) / total : null
    const recommendPercent = total ? Math.round((reviews.filter((review) => review.rating >= 4).length / total) * 100) : 0
    const ratingCounts = [5, 4, 3, 2, 1].map((value) => ({
      value,
      count: reviews.filter((review) => review.rating === value).length,
    }))
    return { total, average, recommendPercent, ratingCounts }
  }, [reviews])

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setSubmitted(false)
    setSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/community/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rating, message }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message ?? 'Your rating could not be saved.')
      setReviews((current) => [result.review as CommunityReview, ...current])
      setName('')
      setMessage('')
      setRating(5)
      setSubmitted(true)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Your rating could not be saved. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#294337]">
      <SiteHeader />
      <section className="border-b border-[#dfe3dc] bg-[#fbfaf7]">
        <div className="mx-auto max-w-[1240px] px-5 pb-10 pt-12 lg:px-8 lg:pb-14 lg:pt-16">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b76e43]"><span className="h-px w-7 bg-[#b76e43]" />The people around our table</p>
          <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
            <div><h1 className="max-w-[760px] font-serif text-5xl leading-[.98] tracking-[-0.045em] sm:text-6xl">A little love from the kitchen.</h1><p className="mt-5 max-w-[630px] text-[15px] leading-7 text-[#718078]">A recipe is better when it brings people together. Here’s what our community thinks of recipeShare.</p></div>
            <div className="flex items-end gap-3 border-l-2 border-[#dbe8c9] pl-5">
              <div><p className="font-serif text-[54px] leading-none text-[#294337]">{stats.average === null ? '—' : stats.average.toFixed(1)}</p><div className="mt-2 flex gap-0.5 text-[#c8754c]" aria-label={stats.average === null ? 'No ratings yet' : `${stats.average.toFixed(1)} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((value) => <Star key={value} size={15} fill={stats.average !== null && value <= Math.round(stats.average) ? 'currentColor' : 'none'} />)}
              </div></div>
              <p className="pb-1 text-xs leading-5 text-[#7a877e]">{stats.total ? `from ${stats.total} community ${stats.total === 1 ? 'rating' : 'ratings'}` : 'Be the first to rate us'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1240px] gap-10 px-5 py-9 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14 lg:px-8 lg:py-12">
        <div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#dfe3dc] bg-[#dfe3dc] sm:grid-cols-3">
            <div className="bg-[#fbfaf7] p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9aa49a]">Ratings</p><p className="mt-2 font-serif text-3xl">{stats.total}</p></div>
            <div className="bg-[#fbfaf7] p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9aa49a]">Recommend us</p><p className="mt-2 font-serif text-3xl">{stats.total ? `${stats.recommendPercent}%` : '—'}</p></div>
            <div className="col-span-2 bg-[#fbfaf7] p-4 sm:col-span-1 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9aa49a]">Rating spread</p><div className="mt-2 space-y-1">{stats.ratingCounts.map(({ value, count }) => <div key={value} className="flex items-center gap-2 text-[10px] text-[#8a968d]"><span className="w-2">{value}</span><Star size={10} fill="currentColor" className="text-[#c8754c]" /><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#edf0e9]"><span className="block h-full rounded-full bg-[#96aa83]" style={{ width: `${stats.total ? (count / stats.total) * 100 : 0}%` }} /></span><span className="w-4 text-right">{count}</span></div>)}</div></div>
          </div>

          <div className="mt-10 flex items-end justify-between border-b border-[#dfe3dc] pb-4"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b76e43]">Notes from the community</p><h2 className="font-serif text-3xl tracking-[-0.035em]">What people are saying</h2></div><span className="text-xs text-[#89958d]">{stats.total} {stats.total === 1 ? 'note' : 'notes'}</span></div>

          {loading ? <div className="py-12 text-sm text-[#7a877e]">Gathering community notes…</div> : loadError && !reviews.length ? <div role="alert" className="mt-5 rounded-lg border border-[#e7c7ba] bg-[#fbefea] p-4 text-sm text-[#9b4e34]">{loadError}</div> : reviews.length ? <div className="divide-y divide-[#dfe3dc]">{reviews.map((review) => <article key={review._id} className="grid gap-4 py-6 sm:grid-cols-[1fr_auto] sm:items-start"><div><div className="flex flex-wrap items-center gap-3"><h3 className="text-sm font-semibold text-[#40564a]">{review.name}</h3><time className="text-[11px] text-[#9aa49a]" dateTime={review.createdAt}>{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(review.createdAt))}</time></div><p className="mt-3 max-w-[700px] text-[14px] leading-7 text-[#65746b]">“{review.message}”</p></div><div className="flex gap-0.5 text-[#c8754c]" aria-label={`${review.rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((value) => <Star key={value} size={14} fill={value <= review.rating ? 'currentColor' : 'none'} />)}</div></article>)}</div> : <div className="flex gap-4 py-12"><MessageSquareQuote className="mt-1 shrink-0 text-[#a1b294]" size={24} /><div><p className="font-serif text-2xl">The first note is yours.</p><p className="mt-2 text-sm leading-6 text-[#7a877e]">Share what you enjoy about recipeShare and help the next home cook feel welcome.</p></div></div>}
        </div>

        <aside className="h-fit rounded-[16px] bg-[#294337] p-5 text-[#f7f3e9] sm:p-7 lg:sticky lg:top-[96px]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c7d9b5]">Your turn</p>
          <h2 className="mt-2 font-serif text-3xl leading-tight">How’s recipeShare feeling?</h2>
          <p className="mt-3 text-sm leading-6 text-[#c5d2c5]">Leave a rating and a few words for the cooks who come after you.</p>
          <form onSubmit={submitReview} className="mt-6 space-y-4">
            <fieldset><legend className="mb-2 text-[11px] font-semibold text-[#e4eadc]">Your rating</legend><div className="flex gap-1" role="radiogroup" aria-label="Your rating from one to five stars">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`} onClick={() => setRating(value)} className="grid size-9 place-items-center rounded-md text-[#f0b276] transition hover:bg-white/10"><Star size={20} fill={value <= rating ? 'currentColor' : 'none'} /></button>)}</div></fieldset>
            <label className="block text-[11px] font-semibold text-[#e4eadc]">Your name<input value={name} onChange={(event) => setName(event.target.value)} name="name" required maxLength={60} placeholder="Name to show with your note" className="mt-2 h-10 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm font-normal text-white outline-none placeholder:text-white/45 focus:border-[#c7d9b5] focus:ring-2 focus:ring-[#c7d9b5]/30" /></label>
            <label className="block text-[11px] font-semibold text-[#e4eadc]">Your note<textarea value={message} onChange={(event) => setMessage(event.target.value)} name="message" required minLength={10} maxLength={500} rows={4} placeholder="What do you enjoy about this community?" className="mt-2 w-full resize-y rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-normal leading-6 text-white outline-none placeholder:text-white/45 focus:border-[#c7d9b5] focus:ring-2 focus:ring-[#c7d9b5]/30" /></label>
            {formError && <p role="alert" className="rounded-md bg-[#f7d9ce] px-3 py-2 text-xs leading-5 text-[#773d2a]">{formError}</p>}
            {submitted && <p role="status" className="text-xs text-[#c7d9b5]">Thanks for sharing your thoughts.</p>}
            <button type="submit" disabled={submitting} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#d9794f] px-4 text-sm font-semibold text-white transition hover:bg-[#c86942] disabled:cursor-wait disabled:opacity-70">{submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={15} />}{submitting ? 'Sending note…' : 'Share your rating'}</button>
          </form>
        </aside>
      </section>
    </main>
  )
}