import { useMemo, useState } from 'react';
import { Diagnostics, DiagnosticsSnapshot } from './components/Diagnostics';
import { LookupForm, LookupFormValues } from './components/LookupForm';
import { RiskResult } from './components/RiskResult';
import { FetchRiskResult, fetchRisk, RiskDoc } from './lib/fetchRisk';

const todayIso = new Date().toISOString().split('T')[0];

const createInitialValues = (): LookupFormValues => ({
  date: todayIso,
  state: 'AL',
  cityOrCounty: '',
});

export type QueryStatus = 'idle' | 'loading' | 'success' | 'not-found' | 'error';

export const App = () => {
  const [formKey, setFormKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<QueryStatus>('idle');
  const [result, setResult] = useState<RiskDoc | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [lastFetchMeta, setLastFetchMeta] = useState<Pick<FetchRiskResult, 'attemptedId' | 'fallbackAttempted' | 'error'> | null>(null);
  const [lastQuery, setLastQuery] = useState<LookupFormValues | null>(null);

  const isDiagnosticsEnabled = useMemo(() => new URL(window.location.href).searchParams.get('debug') === '1', []);

  const handleLookup = async (values: LookupFormValues) => {
    setLoading(true);
    setStatus('loading');
    setMessage(null);
    setResult(null);
    setLastQuery(values);

    try {
      const fetchResult = await fetchRisk({
        date: values.date,
        state: values.state,
        cityOrCounty: values.cityOrCounty,
      });

      setLastFetchMeta({
        attemptedId: fetchResult.attemptedId,
        fallbackAttempted: fetchResult.fallbackAttempted,
        error: fetchResult.error,
      });

      if (fetchResult.found && fetchResult.data) {
        setResult(fetchResult.data);
        setStatus('success');
        setMessage(null);
      } else {
        setStatus('not-found');
        setMessage('No data published for that place/date.');
      }
    } catch (error) {
      console.error('Lookup failed', error);
      setStatus('error');
      setMessage('Unable to fetch risk data right now. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormKey((key) => key + 1);
    setStatus('idle');
    setResult(null);
    setMessage(null);
    setLastFetchMeta(null);
    setLastQuery(null);
  };

  const diagnosticsSnapshot: DiagnosticsSnapshot = {
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    origin: window.location.origin,
    lastQuery,
    lastStatus: status,
    lastError: lastFetchMeta?.error ?? undefined,
    attemptedId: lastFetchMeta?.attemptedId,
    fallbackAttempted: lastFetchMeta?.fallbackAttempted,
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Flashpoint Risk Index (FRI)</h1>
        <p className="disclaimer">Harm-reduction gauge for situational awareness. No predictions. No tracking.</p>
      </header>
      <main>
        <LookupForm key={formKey} initialValues={createInitialValues()} loading={loading} onSubmit={handleLookup} />
        <p className="data-source-note">
          Risk data is fetched directly from the configured Firebase Firestore project. Deployers must publish and maintain
          their own records—no external live feed is bundled with this app.
        </p>
        {status === 'success' && result ? <RiskResult result={result} /> : null}
        {status !== 'success' && message ? <p className="status-message">{message}</p> : null}
        {status !== 'idle' && !loading ? (
          <button className="reset-button" type="button" onClick={resetForm}>
            Clear
          </button>
        ) : null}
        {isDiagnosticsEnabled ? <Diagnostics snapshot={diagnosticsSnapshot} /> : null}
      </main>
    </div>
  );
};

export default App;
