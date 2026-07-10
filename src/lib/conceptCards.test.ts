import { describe, expect, it } from 'vitest'
import { CONCEPT_CARDS } from '../data/conceptCards'
import { SEED_QUESTIONS } from '../data/questions'
import { conceptCardsForQuestion, relatedQuestionsForCard } from './conceptCards'

describe('concept cards', () => {
  it('provides at least five cards for each CEH module', () => {
    expect(CONCEPT_CARDS).toHaveLength(100)
    for (let module = 1; module <= 20; module++) {
      expect(CONCEPT_CARDS.filter((card) => card.module === module)).toHaveLength(5)
    }
  })

  it('keeps required study fields populated and safe concept focused', () => {
    for (const card of CONCEPT_CARDS) {
      expect(card.id).toMatch(/^CC-CEH-\d{2}-\d{2}$/)
      expect(card.title.trim()).not.toBe('')
      expect(card.tags.length).toBeGreaterThan(0)
      expect(card.meaning.trim()).not.toBe('')
      expect(card.whenUsed.trim()).not.toBe('')
      expect(card.examTrap.trim()).not.toBe('')
      expect(card.rememberPhrase.trim()).not.toBe('')
      expect(`${card.meaning} ${card.whenUsed} ${card.examTrap}`.toLowerCase()).not.toContain('payload')
    }
  })

  it('links every card to existing module questions', () => {
    for (const card of CONCEPT_CARDS) {
      const related = relatedQuestionsForCard(card, SEED_QUESTIONS, 5)
      expect(related.length).toBeGreaterThan(0)
      expect(related.every((question) => question.module === card.module)).toBe(true)
    }
  })

  it('links questions back to module concept cards', () => {
    const sample = SEED_QUESTIONS.find((question) => question.module === 20)!
    const cards = conceptCardsForQuestion(sample, CONCEPT_CARDS, 5)
    expect(cards.length).toBeGreaterThan(0)
    expect(cards.every((card) => card.module === sample.module)).toBe(true)
  })
})
