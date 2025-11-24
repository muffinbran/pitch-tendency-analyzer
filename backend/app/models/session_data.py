from pydantic import BaseModel
from typing import List

from backend.app.models.note_analysis import NoteAnalysis

class SessionData(BaseModel):
    session_id: str
    instrument: str
    instrument_id: int
    note_strings: List[NoteAnalysis]