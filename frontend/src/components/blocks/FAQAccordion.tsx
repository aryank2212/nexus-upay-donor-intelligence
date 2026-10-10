import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { IcChevronDown } from '../Icons'

const FAQS = [
  {
    q: 'What exactly does NEXUS automate?',
    a: "Ingesting donor data from Razorpay, bank statements and manual sheets, matching it to one verified donor identity, reconciling payments into gifts, and drafting (never sending) thank-you messages the moment a gift reconciles.",
  },
  {
    q: "What happens when the system isn't sure about a match?",
    a: 'It never guesses. A close-but-uncertain name match, an unmatched bank credit, or a bad import row all land in the Review Queue for a staff member to resolve — merge, dismiss, or fix.',
  },
  {
    q: 'Does this replace Razorpay or our bank?',
    a: "No. NEXUS reads from them — it's the connecting layer that gives you one donor view across sources, not a replacement for the payment gateway or the bank itself.",
  },
  {
    q: 'Is donor data protected?',
    a: 'Every screen in the app sits behind a real login. Passwords are hashed, sessions are signed tokens with an expiry, and API routes reject requests without a valid session.',
  },
  {
    q: 'Can I try it without real UPAY data?',
    a: "Yes — sign in and use “Load demo data” on the Import page. It runs a realistic 64-row dataset through the exact same pipeline real imports use, so every screen has something genuine to show.",
  },
]

export function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      {FAQS.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i} className="card overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold">{item.q}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="dim flex-none"
              >
                <IcChevronDown size={16} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <p className="muted px-5 pb-4 text-sm leading-relaxed">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
