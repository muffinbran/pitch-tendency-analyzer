from pydantic import BaseModel, Field
from typing import List

class NoteAnalysis(BaseModel):
    note_string: str = Field(alias="noteString")
    mean_cents: float = Field(alias="meanCents")
    count: int

    class Config:
        validate_by_name = True

class SessionData(BaseModel):
    session_id: int = Field(alias="sessionId")
    instrument: str
    instrument_id: int = Field(alias="instrumentId")
    note_strings: List[NoteAnalysis] = Field(alias="noteStrings")

    class Config:
        validate_by_name = True
