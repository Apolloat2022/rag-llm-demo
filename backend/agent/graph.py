"""
LangGraph agent graph.

Nodes:
  agent   — LLM decides which tool to call (or none → END)
  tools   — executes the selected tool and returns result

Edges:
  agent → tools   (if tool_calls present)
  agent → END     (if no tool_calls)
  tools → agent   (always, loop back for multi-step reasoning)
"""
from __future__ import annotations

import os
from typing import Annotated, TypedDict

from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage, SystemMessage
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from agent.tools import TOOLS
from agent.prompts import SYSTEM_PROMPT


# ── State ────────────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]


# ── LLM ──────────────────────────────────────────────────────────────────────

def _build_llm():
    return ChatGroq(
        model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        groq_api_key=os.getenv("GROQ_API_KEY", ""),
        temperature=0,
    ).bind_tools(TOOLS)


# ── Nodes ─────────────────────────────────────────────────────────────────────

def agent_node(state: AgentState):
    llm = _build_llm()
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    response = llm.invoke(messages)
    return {"messages": [response]}


def should_continue(state: AgentState) -> str:
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return END


# ── Graph ─────────────────────────────────────────────────────────────────────

def build_graph():
    tool_node = ToolNode(TOOLS)

    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)

    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue)
    graph.add_edge("tools", "agent")

    return graph.compile()


# Singleton compiled graph
_graph = None


def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph
