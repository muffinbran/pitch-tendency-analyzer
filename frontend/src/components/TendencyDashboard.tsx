import { useOverallTendencies } from "../hooks/useOverallTendencies";

export function TendencyDashboard() {
  // 1. Consume the data hook
  const { tendencies, isLoading, error } = useOverallTendencies(1); // TODO: Make instrument ID dynamic

  if (isLoading) {
    return <p>Loading overall tendencies...</p>;
  }

  if (error) {
    return <p className="error">Error: {error}</p>;
  }

  // 2. Sort the data for better visualization (e.g., sharpest notes first)
  const sortedTendencies = tendencies.sort((a, b) => b.meanCents - a.meanCents);

  return (
    <div className="tendency-dashboard">
      <h2>Overall Instrument Tendencies</h2>
      <p>
        Data based on{" "}
        {sortedTendencies.reduce((sum, t) => sum + t.totalSamples, 0)} total
        pitch samples.
      </p>

      <table>
        <thead>
          <tr>
            <th>Note</th>
            <th>Inst. ID</th>
            <th>Avg. Deviation (Cents)</th>
            <th>Samples</th>
          </tr>
        </thead>
        <tbody>
          {sortedTendencies.map((t) => (
            <tr key={`${t.noteString}-${t.instrumentId}`}>
              <td>
                <strong>{t.noteString}</strong>
              </td>
              <td>{t.instrumentId}</td>
              <td style={{ color: t.meanCents > 0 ? "red" : "blue" }}>
                {t.meanCents.toFixed(2)}
              </td>
              <td>{t.totalSamples}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
