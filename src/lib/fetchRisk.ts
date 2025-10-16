import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export type RiskBand = 'Low' | 'Elevated' | 'High' | 'Critical';

export interface RiskDoc {
  date: string;
  state: string;
  place_type: 'state' | 'city' | 'county';
  city_or_county?: string;
  risk_score: number;
  risk_band: RiskBand;
  advisory?: string;
  sources?: string[];
}

export interface FetchRiskParams {
  date: string;
  state: string;
  cityOrCounty?: string;
}

export interface FetchRiskResult {
  found: boolean;
  data?: RiskDoc;
  attemptedId: string;
  fallbackAttempted?: string;
  error?: string;
}

const collectionName = 'risk_by_place_date';

const buildDocId = ({ date, state, cityOrCounty }: FetchRiskParams): string => {
  const normalizedDate = date.trim();
  const normalizedState = state.trim().toLowerCase();
  const normalizedCity = cityOrCounty
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') ?? '';

  return normalizedCity ? `${normalizedDate}_${normalizedState}_${normalizedCity}` : `${normalizedDate}_${normalizedState}`;
};

export const fetchRisk = async (params: FetchRiskParams): Promise<FetchRiskResult> => {
  const primaryId = buildDocId(params);
  const docRef = doc(db, collectionName, primaryId);

  try {
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return {
        found: true,
        data: snapshot.data() as RiskDoc,
        attemptedId: primaryId,
      };
    }

    if (params.cityOrCounty) {
      const fallbackId = buildDocId({ date: params.date, state: params.state });
      if (fallbackId !== primaryId) {
        const fallbackRef = doc(db, collectionName, fallbackId);
        const fallbackSnap = await getDoc(fallbackRef);
        if (fallbackSnap.exists()) {
          return {
            found: true,
            data: fallbackSnap.data() as RiskDoc,
            attemptedId: primaryId,
            fallbackAttempted: fallbackId,
          };
        }
        return {
          found: false,
          attemptedId: primaryId,
          fallbackAttempted: fallbackId,
        };
      }
    }

    return {
      found: false,
      attemptedId: primaryId,
    };
  } catch (error) {
    console.error('Failed to fetch risk document', error);
    return {
      found: false,
      attemptedId: primaryId,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
