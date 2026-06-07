"""Pydantic-Schemas für die KI-Vorschläge (strukturierte Ausgabe)."""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class GlossaryEntry(BaseModel):
    type: Literal["Personen", "Orte"] = Field(description="Personen oder Orte")
    name: str = Field(description="Name ohne Sonderzeichen, taugt als Dateiname")
    content: str = Field(description="Kompletter Markdown-Inhalt des Eintrags. Nutze [[Wikilinks]].")


class QuestProposal(BaseModel):
    title: str
    giver: str = ""
    status: Literal["rumor", "active", "done"] = "active"
    priority: Literal["low", "normal", "high"] = "normal"
    next_step: str = ""
    reward: str = ""


class ItemProposal(BaseModel):
    name: str
    quantity: int = 1
    weight: float = 0
    category: Literal["gear", "magic", "treasure"] = "gear"
    note: str = ""


class CharacterProposal(BaseModel):
    hp_max: Optional[int] = Field(default=None, description="Neue maximale TP, falls geändert (z.B. Stufenaufstieg)")
    level: Optional[int] = Field(default=None, description="Neue Stufe, falls geändert")
    gold_delta: int = Field(default=0, description="Veränderung Gold (+ erhalten / - ausgegeben)")
    silver_delta: int = 0
    copper_delta: int = 0
    new_conditions: List[str] = Field(default_factory=list, description="Neu hinzugekommene Zustände")


class SessionUpdates(BaseModel):
    chronik_append: str = Field(
        default="",
        description="Neue Ereignisse als Markdown-Stichpunkte (jede Zeile mit '* '). Leer lassen, wenn nichts Neues passiert ist.",
    )
    analyse_content: str = Field(
        default="",
        description="Kompletter aktualisierter Markdown-Inhalt für die strategische Analyse. Leer lassen, wenn unverändert.",
    )
    quests: List[QuestProposal] = Field(default_factory=list)
    inventory: List[ItemProposal] = Field(default_factory=list)
    glossar: List[GlossaryEntry] = Field(default_factory=list)
    character: Optional[CharacterProposal] = None


class ParseRequest(BaseModel):
    transcript: str
    context: dict = Field(default_factory=dict)
    provider: Optional[str] = None
    model: Optional[str] = None
