import { useState, useEffect } from "react";
import { fetchOverallTendencies } from "../services/dataService";
import type { NoteSummary } from "../types/api";

/**
 * Custom hook to fetch and manage the overall pitch tendency data.
 * * @returns An object containing the fetched data, loading state, and error state.
 */
export function useOverallTendencies(
  instrumentId: number,
  refreshTrigger: number,
) {
  const [tendencies, setTendencies] = useState<NoteSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!instrumentId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchOverallTendencies(instrumentId);
        setTendencies(data);
      } catch (err) {
        // Assert error type for TypeScript if necessary
        setError("Failed to load historical pitch data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [instrumentId, refreshTrigger]);

  return { tendencies, isLoading, error };
}
