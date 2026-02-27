import { useState } from 'react'
import { Card } from '../ui/Card'

export function FAQ() {
  const faqs = [
    {
      question: "Is this custodial?",
      answer: "No. Your funds stay on your exchanges. We only have trade permissions via API keys, never withdrawal access.",
    },
    {
      question: "How do you handle API keys?",
      answer: "Encrypted at rest using AES-256. Never stored in plaintext. You can revoke access from your exchange at any time.",
    },
    {
      question: "What happens if an exchange goes down?",
      answer: "Circuit breakers activate. Orders route to available exchanges. You get notified immediately.",
    },
    {
      question: "Can I use this for bots?",
      answer: "Elite tier includes full API access for programmatic trading and custom integrations.",
    },
  ]

  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-3xl">
        <Card>
          <p className="font-mono text-text-secondary text-sm tracking-widest mb-4">
            FAQ
          </p>

          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-10">
            COMMON QUESTIONS
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-container-border bg-container-bg"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full p-5 flex justify-between items-center text-left hover:bg-container-bg-hover transition-colors"
                >
                  <span className="font-mono text-text-primary text-sm">{faq.question}</span>
                  <span className="font-mono text-accent-steel ml-4">
                    {openIndex === i ? '−' : '+'}
                  </span>
                </button>

                {openIndex === i && (
                  <div className="px-5 pb-5">
                    <p className="font-mono text-text-secondary text-sm">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}
