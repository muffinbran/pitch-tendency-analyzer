import type { NoteSummary, SessionData } from "../types/api";

const FASTAPI_URL = "http://localhost:8000";

/**
 * Attempts to send session data to the FastAPI backend.
 */
export async function exportSessionData(
  sessionData: SessionData,
): Promise<void> {
  const url = `${FASTAPI_URL}/api/sessions`;
  try {
    console.log(`Sending session ${sessionData.sessionId}`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionData),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error(
        `Export failed with HTTP status ${response.status}:`,
        errorBody,
      );
      throw new Error(`HTTP Error ${response.status}`);
    }

    console.log(`Session ${sessionData.sessionId} successfully exported.`);
  } catch (error) {
    console.warn("Export failed!", error);
    console.error(error);
    // TODO: Add local storage fallback
    throw error;
  }
}

/**
 * Fetches note analysis for a specific instrument from the FastAPI backend.
 */
export async function fetchOverallTendencies(
  instrumentId: number,
): Promise<NoteSummary[]> {
  const url = `${FASTAPI_URL}/api/tendencies?instrument_id=${instrumentId}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Fetch failed with HTTP status ${response.status}:`);
      throw new Error(`HTTP Error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching overall tendencies:", error);
    return [];
  }
}
