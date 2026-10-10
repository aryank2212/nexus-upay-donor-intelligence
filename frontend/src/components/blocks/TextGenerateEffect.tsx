import { motion, stagger, useAnimate } from 'framer-motion'
import { useEffect } from 'react'

/**
 * Adapted from Aceternity UI's "Text Generate Effect" — each word fades in
 * and un-blurs in sequence rather than appearing all at once.
 */
export function TextGenerateEffect({
  words,
  className = '',
  wordClassName = '',
  highlight = [],
  highlightClassName = '',
}: {
  words: string
  className?: string
  wordClassName?: string
  highlight?: string[]
  highlightClassName?: string
}) {
  const [scope, animate] = useAnimate()
  const wordsArray = words.split(' ')

  useEffect(() => {
    animate(
      'span',
      { opacity: 1, filter: 'blur(0px)' },
      { duration: 0.6, delay: stagger(0.08) },
    )
  }, [animate, words])

  const isHighlighted = (word: string) =>
    highlight.some((h) => word.toLowerCase().includes(h.toLowerCase()))

  return (
    <motion.div ref={scope} className={className}>
      {wordsArray.map((word, idx) => (
        <motion.span
          key={word + idx}
          className={`${wordClassName} ${isHighlighted(word) ? highlightClassName : ''}`}
          style={{ opacity: 0, filter: 'blur(8px)', display: 'inline-block' }}
        >
          {word}
          {idx < wordsArray.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </motion.div>
  )
}
