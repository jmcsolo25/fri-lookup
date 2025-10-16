# Seed sample document

Use the Firebase Console to add a sample document for manual testing.

1. Open **Firestore Database** → **Data** → click **Start collection** (or **Add document** if the collection exists).
2. Set the collection ID to `risk_by_place_date`.
3. Set the document ID to `2025-10-18_fl_webster`.
4. Add the following fields:

   | Field            | Type   | Value                                 |
   | ---------------- | ------ | ------------------------------------- |
   | `date`           | string | `2025-10-18`                          |
   | `state`          | string | `FL`                                  |
   | `place_type`     | string | `city`                                |
   | `city_or_county` | string | `Webster`                             |
   | `risk_score`     | number | `7`                                   |
   | `risk_band`      | string | `High`                                |
   | `advisory`       | string | `Bring legal hotline; avoid chokepoints; …` |
   | `sources`        | array  | `https://example.com/a`, `https://example.com/b` |

5. Save the document. The app can now resolve the lookup for **2025-10-18 / FL / Webster**.
