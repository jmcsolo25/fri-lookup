import { FormEvent, useState } from 'react';
import { states } from '../lib/states';

export interface LookupFormValues {
  date: string;
  state: string;
  cityOrCounty: string;
}

interface LookupFormProps {
  initialValues: LookupFormValues;
  loading: boolean;
  onSubmit: (values: LookupFormValues) => void;
}

export const LookupForm = ({ initialValues, loading, onSubmit }: LookupFormProps) => {
  const [formValues, setFormValues] = useState<LookupFormValues>(initialValues);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(formValues);
  };

  return (
    <form className="lookup-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label htmlFor="date">Date</label>
        <input
          id="date"
          type="date"
          value={formValues.date}
          max={new Date().toISOString().split('T')[0]}
          onChange={(event) => setFormValues({ ...formValues, date: event.target.value })}
          required
        />
      </div>
      <div className="form-row">
        <label htmlFor="state">State</label>
        <select
          id="state"
          value={formValues.state}
          onChange={(event) => setFormValues({ ...formValues, state: event.target.value })}
          required
        >
          {states.map((state) => (
            <option key={state.code} value={state.code}>
              {state.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label htmlFor="city">City or County (optional)</label>
        <input
          id="city"
          type="text"
          placeholder="e.g. Webster"
          value={formValues.cityOrCounty}
          onChange={(event) => setFormValues({ ...formValues, cityOrCounty: event.target.value })}
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Checking…' : 'Check Risk'}
      </button>
    </form>
  );
};
