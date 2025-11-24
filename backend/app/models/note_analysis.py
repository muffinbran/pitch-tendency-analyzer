from pydantic import BaseModel

class NoteAnalysis(BaseModel):
    note_string: str
    mean_cents: float
    count: int