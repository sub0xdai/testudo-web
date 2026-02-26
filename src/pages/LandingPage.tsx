import { SpotlightBackground } from '../components/ui/SpotlightBackground'
import { Hero } from '../components/sections/Hero'
import { Problem } from '../components/sections/Problem'
import { Solution } from '../components/sections/Solution'
import { RiskEngine } from '../components/sections/RiskEngine'
import { HowItWorks } from '../components/sections/HowItWorks'
import { Exchanges } from '../components/sections/Exchanges'
import { Pricing } from '../components/sections/Pricing'
import { FAQ } from '../components/sections/FAQ'
import { FinalCTA } from '../components/sections/FinalCTA'
import { Footer } from '../components/sections/Footer'

export function LandingPage() {
  return (
    <>
      <SpotlightBackground
        imageSrc="/Roman-testudo-Trajan-column-966204074.jpg"
        spotlightRadius={300}
      />
      <main className="relative z-10">
        <Hero />
        <Problem />
        <Solution />
        <RiskEngine />
        <HowItWorks />
        <Exchanges />
        <Pricing />
        <FAQ />
        <FinalCTA />
        <Footer />
      </main>
    </>
  )
}
