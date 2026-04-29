import json
from collections import defaultdict

from fastapi import APIRouter
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage

from agent.graph import get_graph
from api.models import ChatRequest, ChatResponse, Citation

router = APIRouter(prefix="/api", tags=["chat"])

# In-memory session store — replace with Redis for production
_sessions: dict[str, list] = defaultdict(list)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    history = _sessions[request.session_id]
    history.append(HumanMessage(content=request.message))

    graph = get_graph()
    result = graph.invoke({"messages": history})

    new_messages = result["messages"][len(history):]
    _sessions[request.session_id] = result["messages"]

    # Extract final AI text
    answer = ""
    tool_calls_made: list[str] = []
    citations: list[Citation] = []

    for msg in new_messages:
        if isinstance(msg, AIMessage):
            if msg.content:
                answer = msg.content if isinstance(msg.content, str) else str(msg.content)
            if hasattr(msg, "tool_calls"):
                for tc in msg.tool_calls:
                    tool_calls_made.append(tc["name"])

        elif isinstance(msg, ToolMessage) and msg.name == "search_policy":
            # Parse citation metadata embedded in tool output
            for section in msg.content.split("\n\n---\n\n"):
                lines = section.split("\n", 1)
                if lines and lines[0].startswith("["):
                    header = lines[0]
                    try:
                        source = _extract(header, "Source: ", " |")
                        page_str = _extract(header, "Page: ", " |")
                        btype = _extract(header, "Type: ", " |")
                        score_str = _extract(header, "Relevance: ", None)
                        snippet = lines[1][:200] if len(lines) > 1 else ""
                        citations.append(
                            Citation(
                                source=source,
                                page=page_str,
                                block_type=btype,
                                rerank_score=float(score_str or 0),
                                snippet=snippet,
                            )
                        )
                    except Exception:
                        pass

    return ChatResponse(
        session_id=request.session_id,
        answer=answer,
        citations=citations,
        tool_calls_made=tool_calls_made,
    )


def _extract(text: str, start: str, end: str | None) -> str:
    idx = text.index(start) + len(start)
    if end is None:
        return text[idx:].strip()
    end_idx = text.index(end, idx)
    return text[idx:end_idx].strip()
