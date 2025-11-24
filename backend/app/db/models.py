from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from .db import Base

class DBNoteAnalysis(Base):
    __tablename__ = "note_analyses"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.session_id"))
    note_string = Column(String, index=True)
    mean_cents = Column(Float)
    count = Column(Integer)

    session = relationship("DBSession", back_populates="notes")

class DBSession(Base):
    __tablename__ = "sessions"

    session_id = Column(String, primary_key=True, index=True)
    instrument = Column(String)
    instrument_id = Column(Integer)
    notes = relationship("DBNoteAnalysis", back_populates="session")
