import { SpotlightBackground } from '../components/ui/SpotlightBackground'
import { Hero } from '../components/sections/Hero'
import { Features } from '../components/sections/Features'
import { Pricing } from '../components/sections/Pricing'
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
        <Features />
        <Pricing />
        <Footer />
      </main>
    </>
  )
}
