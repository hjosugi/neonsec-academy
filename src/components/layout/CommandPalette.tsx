import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { NAV } from './nav'
import { useActiveQuestions } from '../../store/selectors'

interface Cmd {
  id: string
  label: string
  icon: string
  hint: string
  run: () => void
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const questions = useActiveQuestions()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const commands: Cmd[] = useMemo(() => {
    const actions: Cmd[] = [
      { id: 'a-review', label: 'Start daily review', icon: '↻', hint: 'action', run: () => navigate('/review') },
      { id: 'a-exam', label: 'Start a mock exam', icon: '⏱', hint: 'action', run: () => navigate('/exam') },
      { id: 'a-practice', label: 'Start practice session', icon: '✦', hint: 'action', run: () => navigate('/practice') },
      { id: 'a-new', label: 'Create a question', icon: '＋', hint: 'action', run: () => navigate('/bank/new') },
    ]
    const navCmds: Cmd[] = NAV.flatMap((s) => s.items).map((it) => ({
      id: 'n' + it.to,
      label: it.label,
      icon: it.icon,
      hint: 'go to',
      run: () => navigate(it.to),
    }))
    return [...actions, ...navCmds]
  }, [navigate])

  const flat = useMemo(() => {
    const term = q.trim().toLowerCase()
    const cmds = term ? commands.filter((c) => c.label.toLowerCase().includes(term)).slice(0, 6) : commands.slice(0, 8)
    const qs = term
      ? questions
          .filter(
            (question) =>
              question.body.toLowerCase().includes(term) ||
              question.tags.some((t) => t.includes(term)) ||
              question.moduleName.toLowerCase().includes(term),
          )
          .slice(0, 8)
      : []
    return [
      ...cmds.map((c) => ({ type: 'cmd' as const, cmd: c })),
      ...qs.map((question) => ({ type: 'q' as const, question })),
    ]
  }, [q, commands, questions])

  useEffect(() => {
    setActive(0)
  }, [q])

  const select = (i: number) => {
    const item = flat[i]
    if (!item) return
    if (item.type === 'cmd') item.cmd.run()
    else navigate('/bank/' + encodeURIComponent(item.question.id))
    onClose()
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      select(active)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="cmdk" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmdk__input"
          placeholder="Search questions, jump to a screen…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
        />
        <div className="cmdk__list">
          {flat.length === 0 && <div className="cmdk__item muted">No matches</div>}
          {flat.map((item, i) => (
            <button
              key={i}
              className={`cmdk__item ${i === active ? 'is-active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => select(i)}
            >
              {item.type === 'cmd' ? (
                <>
                  <span className="k">{item.cmd.icon}</span>
                  <span className="grow">{item.cmd.label}</span>
                  <span className="term t-xs dim">{item.cmd.hint}</span>
                </>
              ) : (
                <>
                  <span className="k">▤</span>
                  <span className="grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.question.body}
                  </span>
                  <span className="badge">{item.question.module === 0 ? 'CEH+' : 'M' + item.question.module}</span>
                </>
              )}
            </button>
          ))}
        </div>
        <div className="cmdk__item dim" style={{ justifyContent: 'space-between' }}>
          <span className="term t-xs">
            <span className="kbd">↑↓</span> move <span className="kbd">↵</span> open <span className="kbd">esc</span> close
          </span>
          <span className="term t-xs">{questions.length} questions</span>
        </div>
      </div>
    </div>
  )
}
