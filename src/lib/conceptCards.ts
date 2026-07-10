import type { ConceptCard, Question } from '../types'

function tagOverlap(a: string[], b: string[]): number {
  const right = new Set(b)
  return a.reduce((count, tag) => count + (right.has(tag) ? 1 : 0), 0)
}

export function relatedQuestionsForCard(card: ConceptCard, questions: Question[], limit = 8): Question[] {
  const sameModule = questions.filter((question) => question.module === card.module)
  const scored = sameModule
    .map((question) => ({ question, score: tagOverlap(card.tags, question.tags) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.question.id.localeCompare(b.question.id))

  const linked = scored.map((item) => item.question)
  const fallback = sameModule
    .filter((question) => !linked.some((linkedQuestion) => linkedQuestion.id === question.id))
    .sort((a, b) => a.id.localeCompare(b.id))
  return [...linked, ...fallback].slice(0, limit)
}

export function conceptCardsForQuestion(question: Question, cards: ConceptCard[], limit = 5): ConceptCard[] {
  const sameModule = cards.filter((card) => card.module === question.module)
  const scored = sameModule
    .map((card) => ({ card, score: tagOverlap(card.tags, question.tags) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.card.id.localeCompare(b.card.id))

  const linked = scored.map((item) => item.card)
  const fallback = sameModule
    .filter((card) => !linked.some((linkedCard) => linkedCard.id === card.id))
    .sort((a, b) => a.id.localeCompare(b.id))
  return [...linked, ...fallback].slice(0, limit)
}
