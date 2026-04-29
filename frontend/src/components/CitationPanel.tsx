import type { Citation } from "../types";

interface Props {
  citations: Citation[];
}

export function CitationPanel({ citations }: Props) {
  if (citations.length === 0) return null;

  return (
    <div className="citation-panel">
      <h4 className="citation-heading">Source Citations</h4>
      <ul className="citation-list">
        {citations.map((c, i) => (
          <li key={i} className="citation-item">
            <div className="citation-meta">
              <span className="citation-badge">{c.block_type === "table" ? "TABLE" : "TEXT"}</span>
              <span className="citation-source">{c.source}</span>
              <span className="citation-page">p.{c.page}</span>
              <span className="citation-score" title="Re-ranker relevance score">
                {(c.rerank_score * 100).toFixed(0)}%
              </span>
            </div>
            <p className="citation-snippet">
              &ldquo;{c.snippet}&rdquo;
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
