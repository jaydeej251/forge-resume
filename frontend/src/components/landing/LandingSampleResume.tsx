/** Static decorative resume for the landing hero — not interactive. */
export function LandingSampleResume() {
  return (
    <article className="landing-sample-resume">
      <header className="landing-sample-resume__header">
        <div className="landing-sample-resume__avatar" aria-hidden />
        <div>
          <h2 className="landing-sample-resume__name">Jordan Lee</h2>
          <p className="landing-sample-resume__role">Product Designer</p>
          <p className="landing-sample-resume__contact">
            jordan@email.com · San Francisco · linkedin.com/in/jordan
          </p>
        </div>
      </header>

      <section className="landing-sample-resume__section">
        <h3>Summary</h3>
        <p>
          Designer who turns messy product problems into clear flows and shippable
          interfaces. 6+ years across B2B SaaS and consumer apps.
        </p>
      </section>

      <section className="landing-sample-resume__section">
        <h3>Experience</h3>
        <div className="landing-sample-resume__job">
          <div className="landing-sample-resume__job-head">
            <span>Senior Product Designer · Northline</span>
            <span>2022 — Present</span>
          </div>
          <ul>
            <li>Led redesign of onboarding; lifted activation by 28%.</li>
            <li>Built a component system used across 4 product squads.</li>
            <li>Partnered with eng to ship weekly experiments end-to-end.</li>
          </ul>
        </div>
        <div className="landing-sample-resume__job">
          <div className="landing-sample-resume__job-head">
            <span>Product Designer · Harbor Labs</span>
            <span>2019 — 2022</span>
          </div>
          <ul>
            <li>Owned design for analytics dashboard used by 12k teams.</li>
            <li>Ran research sprints that cut support tickets by 18%.</li>
          </ul>
        </div>
      </section>

      <section className="landing-sample-resume__section">
        <h3>Education</h3>
        <div className="landing-sample-resume__job-head">
          <span>B.A. Interaction Design · Rhode Island School of Design</span>
          <span>2019</span>
        </div>
      </section>
    </article>
  );
}
