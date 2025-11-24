from pydantic import BaseModel
from typing import List

class NoteAnalysis(BaseModel):
    note_string: str
    mean_cents: float
    count: int

class SessionData(BaseModel):
    session_id: str
    instrument: str
    instrument_id: int
    note_strings: List[NoteAnalysis]
