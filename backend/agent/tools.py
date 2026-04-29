"""
LangGraph-compatible tool definitions.

search_policy   — wraps the full RAG retrieval chain
calculate_quote — deterministic Python math (no LLM arithmetic)
"""
from __future__ import annotations

import json
from typing import Any

from langchain_core.tools import tool

from retrieval.retriever import retrieve, RetrievalResult


@tool
def search_policy(query: str) -> str:
    """
    Search the insurance policy documents for coverage information.
    Returns policy excerpts with source citations.
    """
    result: RetrievalResult = retrieve(query)

    if not result.documents:
        return "No relevant policy sections found for that query."

    sections = []
    for i, (doc, citation) in enumerate(
        zip(result.documents, result.citations), start=1
    ):
        header = (
            f"[{i}] Source: {citation['source']} | "
            f"Page: {citation['page']} | "
            f"Type: {citation['block_type']} | "
            f"Relevance: {citation['rerank_score']:.2f}"
        )
        sections.append(f"{header}\n{doc.page_content}")

    return "\n\n---\n\n".join(sections)


@tool
def calculate_quote(params_json: str) -> str:
    """
    Calculate an insurance premium.

    Expected JSON input:
    {
      "base_rate": 0.015,
      "coverage_amount": 500000,
      "risk_factor": 1.2,
      "deductible": 2500
    }

    Formula: premium = base_rate * coverage_amount * risk_factor
    Net coverage = coverage_amount - deductible
    """
    try:
        params: dict[str, Any] = json.loads(params_json)
        base_rate: float = float(params["base_rate"])
        coverage_amount: float = float(params["coverage_amount"])
        risk_factor: float = float(params["risk_factor"])
        deductible: float = float(params["deductible"])
    except (KeyError, ValueError, json.JSONDecodeError) as exc:
        return f"Error parsing parameters: {exc}. Provide valid JSON with base_rate, coverage_amount, risk_factor, deductible."

    if not (0.5 <= risk_factor <= 3.0):
        return "risk_factor must be between 0.5 and 3.0."

    annual_premium = round(base_rate * coverage_amount * risk_factor, 2)
    net_coverage = round(coverage_amount - deductible, 2)
    monthly_premium = round(annual_premium / 12, 2)

    return json.dumps(
        {
            "annual_premium": annual_premium,
            "monthly_premium": monthly_premium,
            "net_coverage": net_coverage,
            "deductible": deductible,
            "effective_rate_pct": round(base_rate * risk_factor * 100, 4),
        },
        indent=2,
    )


TOOLS = [search_policy, calculate_quote]
