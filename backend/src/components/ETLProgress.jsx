
import { useETLProgress } from "../hooks/useETLProgress";

export default function ETLProgress({ jobId }) {
  const { progress, status } = useETLProgress(jobId);

  const percentage = progress?.percentage ?? 0;

  return (
    <div>
      <h2>ETL Job Progress</h2>

      <p>Status: {status}</p>

      <progress
        value={percentage}
        max="100"
        style={{ width: "100%" }}
      />

      <p>{percentage}% completed</p>

      <p>
        Processed rows: {progress?.processedRows ?? 0}
        {" / "}
        {progress?.totalRows ?? "Calculating"}
      </p>

      <p>
        Speed: {progress?.speed ?? 0} rows/sec
      </p>
    </div>
  );
}
