import type { SessionData } from "../types/api";

const FASTAPI_URL = "http://localhost:8000/api/sessions";

/**
 * Attempts to send session data to the FastAPI backend.
 */
export async function exportSessionData(
  sessionData: SessionData,
): Promise<void> {
  try {
    console.log(`Sending session ${sessionData.sessionId}`);
    const response = await fetch(FASTAPI_URL, {
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
