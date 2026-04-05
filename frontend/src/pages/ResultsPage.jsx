import { useState, useEffect } from "react";
import axios from "axios";

const ResultsPage = () => {
  const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/results");
      setResults(res.data.candidates || []);
      setTotalVotes(res.data.total_votes || 0);
    } catch (err) {
      setError("Failed to load results");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Loading results...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800">Election Results</h1>
          <p className="text-gray-600 mt-2">
            Total votes cast:{" "}
            <span className="font-semibold">{totalVotes}</span>
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {results.length === 0 ? (
            <p className="text-center text-gray-500 py-12">
              No results available yet.
            </p>
          ) : (
            <div className="space-y-6">
              {results.map((candidate, index) => (
                <div
                  key={candidate.id}
                  className="flex items-center justify-between border-b pb-6 last:border-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl">
                        {candidate.name}
                      </h3>
                      <p className="text-blue-600">{candidate.position}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-800">
                      {candidate.votes}
                    </div>
                    <div className="text-sm text-gray-500">
                      {candidate.percentage ? `${candidate.percentage}%` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-10">
          <a href="/" className="text-blue-600 hover:underline">
            Back to Voting Station
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
