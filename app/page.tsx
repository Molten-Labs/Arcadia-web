import { DriftBlobs, NoiseOverlay, Reveal } from "@/components/acid";
import { AllocationRail } from "@/components/landing/AllocationRail";
import { Container, Kicker, SectionHeading } from "@/components/landing/bits";
import { DualCta } from "@/components/landing/DualCta";
import { Faq } from "@/components/landing/Faq";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { TheScore } from "@/components/landing/TheScore";
import { TrustMetrics } from "@/components/landing/TrustMetrics";
import { TrustStrip } from "@/components/landing/TrustStrip";

/**
 * Arcadia landing (Acid Graphic). Server component: static marketing sections
 * render on the server for first paint; the only client islands are the
 * metric/accordion interactions and the CountUp animations.
 *
 * Tightened from 10 sections to 7: hero → live metrics → trust strip → the
 * allocation rail (the moat) → the score (the input that feeds it) → FAQ
 * → dual CTA closer. Reads as a product, not a whitepaper.
 */
export default function LandingPage() {
  return (
    <>
      <NoiseOverlay />
      <DriftBlobs />

      <div className="relative z-10">
        <LandingNav />

        <div id="top">
          <HeroSection />
          <TrustMetrics />
          <TrustStrip />
          <AllocationRail />
          <TheScore />

          <section id="faq" aria-label="Frequently asked questions" className="py-[clamp(5rem,12vw,10rem)]">
            <Container>
              <Reveal>
                <Kicker>FAQ</Kicker>
              </Reveal>
              <Reveal delay={80}>
                <SectionHeading className="mt-4 mb-[clamp(2rem,4vw,3rem)]">
                  Questions, answered.
                </SectionHeading>
              </Reveal>
              <Faq />
            </Container>
          </section>

          <DualCta />
        </div>

        <LandingFooter />
      </div>
    </>
  );
}