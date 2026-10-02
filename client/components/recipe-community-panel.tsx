'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { LoaderCircle, MessageCircleQuestion, Send, Star } from 'lucide-react'
import { getRecipeFeedback, submitRecipeQuestion, submitRecipeRating, type RecipeFeedback } from '../lib/recipe-api'

type RecipeCommunityPanelProps = {
  recipeId: string
  recipeTitle: string
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export function RecipeCommunityPanel({ recipeId, recipeTitle }: RecipeCommunityPanelProps) {
  const [feedback, setFeedback] = useState<RecipeFeedback | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [ratingName, setRatingName] = useState('')
  const [ratingNote, setRatingNote] = useState('')
  const [rating, setRating] = useState(5)
  const [questionName, setQuestionName] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [ratingError, setRatingError] = useState('')
  const [questionError, setQuestionError] = useState('')
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [questionSubmitting, setQuestionSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    getRecipeFeedback(recipeId)
      .then((result) => { if (active) setFeedback(result) })
      .catch((error: unknown) => { if (active) setLoadError(error instanceof Error ? error.message : 'Recipe feedback is unavailable.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [recipeId])

  async function refreshFeedback() {
    try {
      setFeedback(await getRecipeFeedback(recipeId))
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not refresh recipe feedback.')
    }
  }

  async function postRating(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRatingError('')
    setRatingSubmitting(true)
    try {
      await submitRecipeRating(recipeId, { name: ratingName, rating, message: ratingNote })
      setRatingName('')
      setRatingNote('')
      setRating(5)
      await refreshFeedback()
    } catch (error) {
      setRatingError(error instanceof Error ? error.message : 'Could not save your rating.')
    } finally {
      setRatingSubmitting(false)
    }
  }

  async function postQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQuestionError('')
    setQuestionSubmitting(true)
    try {
      await submitRecipeQuestion(recipeId, { name: questionName, message: questionText })
      setQuestionName('')
      setQuestionText('')
      await refreshFeedback()
    } catch (error) {
      setQuestionError(error instanceof Error ? error.message : 'Could not post your question.')
    } finally {
      setQuestionSubmitting(false)
    }
  }

  const summary = feedback?.summary

  return (
    <section className="mt-14 border-t border-[#dfe3dc] pt-10 lg:mt-16 lg:pt-12" aria-labelledby="recipe-community-title">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b76e43]">Cooked by the community</p>
          <h2 id="recipe-community-title" className="font-serif text-3xl tracking-[-0.035em]">About & community</h2>
          <p className="mt-3 text-sm leading-6 text-[#718078]">Rate {recipeTitle}, share a helpful note, or ask a question for other cooks.</p>

          <div className="mt-6 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-5 rounded-xl border border-[#dfe3dc] bg-[#fbfaf7] p-5">
            <div className="font-serif text-4xl leading-none text-[#294337]">{summary?.average === null || summary?.average === undefined ? '—' : summary.average.toFixed(1)}</div>
            <div><div className="flex gap-0.5 text-[#c8754c]" aria-label={summary?.average ? `${summary.average} out of 5 stars` : 'No ratings yet'}>{[1, 2, 3, 4, 5].map((value) => <Star key={value} size={14} fill={(summary?.average ?? 0) >= value - 0.5 ? 'currentColor' : 'none'} />)}</div><p className="mt-1 text-[11px] text-[#8a968d]">{summary?.total || 0} {summary?.total === 1 ? 'rating' : 'ratings'}</p></div>
            <div className="col-span-2 space-y-1">{summary?.distribution.map((item) => <div key={item.rating} className="flex items-center gap-2 text-[10px] text-[#8a968d]"><span className="w-2">{item.rating}</span><Star size={10} fill="currentColor" className="text-[#c8754c]" /><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#edf0e9]"><span className="block h-full rounded-full bg-[#96aa83]" style={{ width: `${summary.total ? item.count / summary.total * 100 : 0}%` }} /></span><span className="w-4 text-right">{item.count}</span></div>)}</div>
          </div>

          <form onSubmit={postRating} className="mt-5 space-y-3 rounded-xl bg-[#e9eee3] p-5">
            <h3 className="text-sm font-semibold text-[#40564a]">Leave a rating</h3>
            <fieldset><legend className="mb-1 text-[11px] text-[#68766e]">Your stars</legend><div className="flex gap-1" role="radiogroup" aria-label="Rate this recipe from one to five stars">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`} onClick={() => setRating(value)} className="grid size-8 place-items-center rounded text-[#c8754c] hover:bg-white/70"><Star size={19} fill={value <= rating ? 'currentColor' : 'none'} /></button>)}</div></fieldset>
            <label className="block text-[11px] font-semibold text-[#52635a]">Your name<input value={ratingName} onChange={(event) => setRatingName(event.target.value)} required maxLength={60} className="mt-1.5 h-10 w-full rounded-lg border border-[#d4ddd0] bg-[#fbfaf7] px-3 text-sm font-normal text-[#294337] outline-none focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /></label>
            <label className="block text-[11px] font-semibold text-[#52635a]">Note <span className="font-normal text-[#89958d]">(optional)</span><textarea value={ratingNote} onChange={(event) => setRatingNote(event.target.value)} maxLength={500} rows={2} className="mt-1.5 w-full resize-y rounded-lg border border-[#d4ddd0] bg-[#fbfaf7] px-3 py-2 text-sm font-normal text-[#294337] outline-none focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /></label>
            {ratingError && <p role="alert" className="text-xs text-[#9b4e34]">{ratingError}</p>}
            <button type="submit" disabled={ratingSubmitting} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#294337] px-4 text-sm font-semibold text-white hover:bg-[#3d5949] disabled:opacity-60">{ratingSubmitting ? <LoaderCircle size={15} className="animate-spin" /> : <Star size={15} />} Submit rating</button>
          </form>
        </div>

        <div>
          <form onSubmit={postQuestion} className="rounded-xl border border-[#dfe3dc] bg-[#fbfaf7] p-5 sm:p-6">
            <div className="flex items-center gap-3"><MessageCircleQuestion className="text-[#788d6b]" size={20} /><div><h3 className="font-serif text-2xl text-[#294337]">Ask about this recipe</h3><p className="mt-1 text-xs text-[#89958d]">Your question will be visible to other cooks.</p></div></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1.5fr]">
              <label className="block text-[11px] font-semibold text-[#52635a]">Your name<input value={questionName} onChange={(event) => setQuestionName(event.target.value)} required maxLength={60} className="mt-1.5 h-10 w-full rounded-lg border border-[#dce2d8] bg-white px-3 text-sm font-normal text-[#294337] outline-none focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /></label>
              <label className="block text-[11px] font-semibold text-[#52635a]">Question<textarea value={questionText} onChange={(event) => setQuestionText(event.target.value)} required minLength={10} maxLength={500} rows={2} placeholder="Can I prepare any part of this ahead?" className="mt-1.5 w-full resize-y rounded-lg border border-[#dce2d8] bg-white px-3 py-2 text-sm font-normal text-[#294337] outline-none placeholder:text-[#a0aaa1] focus:border-[#91a887] focus:ring-2 focus:ring-[#dcebd3]" /></label>
            </div>
            {questionError && <p role="alert" className="mt-3 text-xs text-[#9b4e34]">{questionError}</p>}
            <button type="submit" disabled={questionSubmitting} className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[#d9794f] px-4 text-sm font-semibold text-white hover:bg-[#c86942] disabled:opacity-60">{questionSubmitting ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={14} />} Post question</button>
          </form>

          <div className="mt-8 border-b border-[#dfe3dc] pb-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b76e43]">Community questions</p><h3 className="mt-1 font-serif text-2xl text-[#294337]">What cooks are asking</h3></div>
          {loading ? <p className="py-6 text-sm text-[#89958d]">Loading recipe feedback…</p> : loadError ? <p role="status" className="py-6 text-sm text-[#9b4e34]">{loadError}</p> : feedback?.questions.length ? <div className="divide-y divide-[#dfe3dc]">{feedback.questions.map((question) => <article key={question._id} className="py-5"><div className="flex items-center justify-between gap-4"><p className="text-sm font-semibold text-[#40564a]">{question.name}</p><time className="shrink-0 text-[10px] text-[#9aa49a]">{formatDate(question.createdAt)}</time></div><p className="mt-2 text-sm leading-6 text-[#65746b]">{question.message}</p></article>)}</div> : <div className="flex gap-3 py-7"><MessageCircleQuestion className="mt-1 shrink-0 text-[#a1b294]" size={20} /><div><p className="font-serif text-xl text-[#40564a]">No questions yet</p><p className="mt-1 text-sm text-[#89958d]">Ask the first question about this recipe.</p></div></div>}

          {feedback?.ratings.some((item) => item.message) && <div className="mt-7 border-t border-[#dfe3dc] pt-6"><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#b76e43]">Cook notes</p>{feedback.ratings.filter((item) => item.message).slice(0, 4).map((item) => <article key={item._id} className="border-b border-[#e3e7df] py-4"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-[#40564a]">{item.name}</span><span className="flex items-center gap-0.5 text-[#c8754c]" aria-label={`${item.rating} stars`}>{[1, 2, 3, 4, 5].map((value) => <Star key={value} size={11} fill={value <= item.rating ? 'currentColor' : 'none'} />)}</span></div><p className="mt-2 text-sm leading-6 text-[#65746b]">{item.message}</p></article>)}</div>}
        </div>
      </div>
    </section>
  )
}