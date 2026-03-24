import { SpotlightBackground } from '../components/ui/SpotlightBackground'
import { Footer } from '../components/sections/Footer'

export function AboutPage() {
  return (
    <>
      <SpotlightBackground
        imageSrc="/Roman-testudo-Trajan-column-966204074.jpg"
        spotlightRadius={300}
      />
      <main className="relative z-10">
        <section className="min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24 py-32">
          <div className="max-w-3xl">

            {/* Title */}
            <h1
              className="font-display text-5xl md:text-7xl font-bold tracking-tight text-text-primary leading-[0.95] mb-16"
              style={{ textShadow: '0 2px 16px rgb(var(--bg-core) / 0.6)' }}
            >
              THE FORMATION
            </h1>

            {/* Manifesto body */}
            <div className="space-y-12 font-display text-base md:text-lg text-text-secondary leading-relaxed" style={{ textShadow: '0 1px 12px rgb(var(--bg-core) / 0.8)' }}>

              <div className="space-y-4">
                <h2 className="font-mono text-xs tracking-widest text-text-tertiary uppercase">I. The Problem</h2>
                <p>
                  Most traders don't lose because they can't read a chart. They lose because they can't manage themselves. The entry is the easy part. Everything after — sizing, stops, targets, the decision to hold or cut — is where accounts go to die.
                </p>
                <p>
                  The market doesn't care about your analysis. It doesn't care about your conviction. It only responds to one thing: how much you risk, and whether you survive long enough to collect your edge.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="font-mono text-xs tracking-widest text-text-tertiary uppercase">II. The Testudo</h2>
                <p>
                  The Roman testudo was not a weapon. It was a formation. Shields locked overhead and on all sides, the legion advanced through arrow fire, oil, and stone. Not by being stronger — by being disciplined. By covering the gaps.
                </p>
                <p>
                  This is the principle. You don't beat the market by predicting it. You beat it by refusing to be destroyed by what you didn't predict.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="font-mono text-xs tracking-widest text-text-tertiary uppercase">III. Position Sizing Is Everything</h2>
                <p>
                  A trader with a 40% win rate and proper position sizing will outlast a trader with an 80% win rate who sizes recklessly. This is not intuitive. It is mathematical. The size of the bet determines whether you survive the inevitable losing streak — and every system produces losing streaks.
                </p>
                <p>
                  Risk a fixed percentage. Calculate from the stop. Let the stop distance dictate the size, not the other way around. The moment you override your sizing rules is the moment you've left the formation.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="font-mono text-xs tracking-widest text-text-tertiary uppercase">IV. Expectancy Over Prediction</h2>
                <p>
                  Your edge is not any single trade. Your edge is the expected value across hundreds of trades. A system that wins $2 for every $1 it loses, even at a coin-flip win rate, prints money over time. But only if you take every signal. Only if you don't flinch.
                </p>
                <p>
                  The R-multiple is the only number that matters. How much did you make relative to what you risked? Track this. Obsess over this. Everything else is noise.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="font-mono text-xs tracking-widest text-text-tertiary uppercase">V. The Enemy Is You</h2>
                <p>
                  After the third consecutive loss, something changes. The stop gets widened. The size gets doubled. The system gets abandoned. This is not a strategy failure — it is a psychological one. The market didn't change. You did.
                </p>
                <p>
                  Automation exists to protect you from this version of yourself. Not the version that writes the plan on Sunday evening, but the version that abandons it on Tuesday at 2am with a leveraged position moving against you.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="font-mono text-xs tracking-widest text-text-tertiary uppercase">VI. The Journal Is The Mirror</h2>
                <p>
                  You cannot improve what you do not measure. Every trade is data. Every loss is information. The difference between a gambler and a trader is that the trader writes it down, reviews it, and adjusts.
                </p>
                <p>
                  Not feelings. Not narratives. Numbers. Entry, exit, risk, reward, duration, R-multiple. The patterns in your data will tell you truths your ego never will.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="font-mono text-xs tracking-widest text-text-tertiary uppercase">VII. The Formation Holds</h2>
                <p>
                  Testudo is not a signal service. It is not a bot that trades for you. It is the shield wall between your analysis and your execution — ensuring that every trade you take is sized correctly, managed automatically, and recorded permanently.
                </p>
                <p>
                  You bring the edge. We enforce the discipline.
                </p>
                <p className="text-text-primary font-semibold mt-8">
                  Adapt. Outlast. Don't break.
                </p>
              </div>

            </div>
          </div>
        </section>
        <Footer />
      </main>
    </>
  )
}
