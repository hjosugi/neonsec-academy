import type { Question } from '../../types'
import { Markdown } from '../ui/Markdown'

export function Explanation({ q }: { q: Question }) {
  return (
    <div className="explain rise-in">
      <div className="explain__row">
        <div className="explain__k">Answer</div>
        <Markdown source={q.explanation.answer} />
      </div>
      <div className="explain__row">
        <div className="explain__k">Why</div>
        <Markdown source={q.explanation.why} />
      </div>
      <div className="explain__row">
        <div className="explain__k explain__k--trap">Trap</div>
        <Markdown source={q.explanation.trap} />
      </div>
      <div>
        <div className="explain__k">Memory phrase</div>
        <span className="explain__mem">{q.explanation.memory_phrase}</span>
      </div>
    </div>
  )
}
