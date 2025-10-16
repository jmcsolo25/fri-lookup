import { RiskBand, RiskDoc } from '../lib/fetchRisk';

const bandDescriptions: Record<RiskBand, string> = {
  Low: 'Normal conditions. Know your route; buddy up.',
  Elevated: 'Share legal hotline; avoid chokepoints; med kit.',
  High: 'Trained marshals; exit lanes; de-escalation scripts.',
  Critical: 'Tight comms; buffers; livestream updates; legal observers visible.',
};

const bandColors: Record<RiskBand, string> = {
  Low: '#1b9e77',
  Elevated: '#d95f02',
  High: '#7570b3',
  Critical: '#e7298a',
};

interface RiskResultProps {
  result: RiskDoc;
}

export const RiskResult = ({ result }: RiskResultProps) => {
  const displayAdvisory = result.advisory?.trim() || bandDescriptions[result.risk_band];

  return (
    <section className="risk-result" aria-live="polite">
      <header>
        <h2>
          {result.risk_band} risk — {result.risk_score}/10
        </h2>
        <div
          className="risk-bar"
          aria-hidden="true"
          style={{ backgroundColor: bandColors[result.risk_band], width: `${(result.risk_score / 10) * 100}%` }}
        />
      </header>
      <p className="risk-advisory">{displayAdvisory}</p>
      {result.sources && result.sources.length > 0 ? (
        <div className="risk-sources">
          <h3>Sources</h3>
          <ul>
            {result.sources.map((source) => (
              <li key={source}>
                <a href={source} target="_blank" rel="noreferrer">
                  {source}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
};
