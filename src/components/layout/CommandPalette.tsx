import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { NAV, QUICK_ACTION_ICONS } from './nav'
import { useActiveQuestions } from '../../store/selectors'

interface Cmd {
  id: string
  label: string
  aliases: string[]
  icon: LucideIcon
  hint: string
  run: () => void
}

function CommandIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className="k k--icon" aria-hidden="true" strokeWidth={1.9} />
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
      { id: 'a-review', label: 'Start daily review', aliases: ['review', 'srs', 'due'], icon: QUICK_ACTION_ICONS.review, hint: 'action', run: () => navigate('/review') },
      { id: 'a-exam', label: 'Start a mock exam', aliases: ['mock', 'exam', 'test'], icon: QUICK_ACTION_ICONS.exam, hint: 'action', run: () => navigate('/exam') },
      { id: 'a-weak', label: 'Start weak-module drill', aliases: ['weak', 'drill', 'weakness'], icon: QUICK_ACTION_ICONS.practice, hint: 'action', run: () => navigate('/practice?mode=weak') },
      { id: 'a-practice', label: 'Start practice session', aliases: ['practice', 'train'], icon: QUICK_ACTION_ICONS.practice, hint: 'action', run: () => navigate('/practice') },
      { id: 'a-lab', label: 'Open safe labs', aliases: ['lab', 'challenge', 'practical'], icon: QUICK_ACTION_ICONS.lab, hint: 'action', run: () => navigate('/labs') },
      { id: 'a-report', label: 'Open report exporter', aliases: ['report', 'export', 'markdown'], icon: QUICK_ACTION_ICONS.report, hint: 'action', run: () => navigate('/reports') },
      { id: 'a-final', label: 'Open final gate', aliases: ['final', 'gate', 'booking'], icon: QUICK_ACTION_ICONS.exam, hint: 'action', run: () => navigate('/final-gate') },
      { id: 'a-new', label: 'Create a question', aliases: ['new', 'author', 'question'], icon: QUICK_ACTION_ICONS.createQuestion, hint: 'action', run: () => navigate('/bank/new') },
    ]
    const navCmds: Cmd[] = NAV.flatMap((s) => s.items).map((it) => ({
      id: 'n' + it.to,
      label: it.label,
      aliases: [it.label.toLowerCase(), it.to.replace('/', '')],
      icon: it.icon,
      hint: 'go to',
      run: () => navigate(it.to),
    }))
    return [...actions, ...navCmds]
  }, [navigate])

  const flat = useMemo(() => {
    const term = q.trim().toLowerCase()
    const cmds = term
      ? commands.filter((c) => c.label.toLowerCase().includes(term) || c.aliases.some((alias) => alias.includes(term))).slice(0, 8)
      : commands.slice(0, 9)
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
                  <CommandIcon icon={item.cmd.icon} />
                  <span className="grow">{item.cmd.label}</span>
                  <span className="term t-xs dim">{item.cmd.hint}</span>
                </>
              ) : (
                <>
                  <CommandIcon icon={QUICK_ACTION_ICONS.question} />
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
