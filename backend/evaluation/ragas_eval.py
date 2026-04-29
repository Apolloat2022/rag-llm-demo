"""
RAGAS evaluation guide and runner for InsurAgent AI.

RAGAS metrics used:
  - faithfulness        : Is the answer grounded in the retrieved context?
  - answer_relevancy    : Is the answer relevant to the question asked?
  - context_precision   : Are the retrieved chunks actually useful?
  - context_recall      : Did retrieval find all relevant ground-truth info?
  - answer_correctness  : End-to-end: does the answer match ground truth?

Run: python -m evaluation.ragas_eval
"""
from __future__ import annotations

import json
import os
from pathlib import Path

from datasets import Dataset
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall,
    answer_correctness,
)
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings

from retrieval.retriever import retrieve


# ── Sample evaluation set ─────────────────────────────────────────────────────
# In production, load from a curated JSON/CSV file annotated by domain experts.

EVAL_QUESTIONS: list[dict] = [
    {
        "question": "What is the deductible for water damage claims?",
        "ground_truth": "The standard deductible for water damage is $2,500 per occurrence.",
    },
    {
        "question": "Are acts of God covered under the liability section?",
        "ground_truth": "Acts of God, including floods and earthquakes, are excluded from liability coverage unless the Enhanced Natural Disaster rider is attached.",
    },
    {
        "question": "What is the maximum coverage for personal property?",
        "ground_truth": "Personal property is covered up to $150,000 with a replacement cost value basis.",
    },
]


# ── Build RAGAS dataset ───────────────────────────────────────────────────────

def build_eval_dataset() -> Dataset:
    """Run retrieval for each question and package into a RAGAS Dataset."""
    rows = {
        "question": [],
        "answer": [],
        "contexts": [],
        "ground_truth": [],
    }

    for item in EVAL_QUESTIONS:
        q = item["question"]
        result = retrieve(q, child_k=20, final_k=5)

        # Simulate LLM answer (replace with actual agent call in production)
        contexts = [doc.page_content for doc in result.documents]
        answer = _mock_llm_answer(q, contexts)

        rows["question"].append(q)
        rows["answer"].append(answer)
        rows["contexts"].append(contexts)
        rows["ground_truth"].append(item["ground_truth"])

    return Dataset.from_dict(rows)


def _mock_llm_answer(question: str, contexts: list[str]) -> str:
    """Placeholder — swap with agent.graph.get_graph().invoke(...) call."""
    if contexts:
        return f"Based on the policy: {contexts[0][:300]}"
    return "No relevant policy information found."


# ── Run evaluation ────────────────────────────────────────────────────────────

def run_ragas_evaluation() -> dict:
    """
    Execute RAGAS evaluation and return a metrics summary dict.

    Outputs a report to ./data/ragas_report.json.
    """
    dataset = build_eval_dataset()

    llm = ChatGroq(
        model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        groq_api_key=os.getenv("GROQ_API_KEY", ""),
    )
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    result = evaluate(
        dataset=dataset,
        metrics=[
            faithfulness,
            answer_relevancy,
            context_precision,
            context_recall,
            answer_correctness,
        ],
        llm=llm,
        embeddings=embeddings,
    )

    scores = result.to_pandas()[
        ["faithfulness", "answer_relevancy", "context_precision",
         "context_recall", "answer_correctness"]
    ].mean().to_dict()

    report = {
        "per_question": result.to_pandas().to_dict(orient="records"),
        "aggregate": {k: round(v, 4) for k, v in scores.items()},
    }

    out_path = Path("./data/ragas_report.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, indent=2))

    print("\n=== RAGAS Evaluation Results ===")
    for metric, score in report["aggregate"].items():
        bar = "█" * int(score * 20)
        print(f"  {metric:<25} {score:.4f}  {bar}")

    return report


if __name__ == "__main__":
    run_ragas_evaluation()
