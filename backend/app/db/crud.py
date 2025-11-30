from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import SessionData
from app.db.models import DBSession, DBNoteAnalysis
from typing import List, Optional


def create_session_and_notes(db: Session, session_data: SessionData):
    """
    Create a new session and associated note analyses in the database.

    :param db: The database session
    :param session_data: The session data to store
    :return: The created DBSession object
    """
    db_session = DBSession(
        session_id=session_data.session_id,
        instrument_id=session_data.instrument_id,
        instrument=session_data.instrument,
    )
    db.add(db_session)
    db.flush()

    for note in session_data.note_strings:
        db_note = DBNoteAnalysis(
            session_id=session_data.session_id,
            note_string=note.note_string,
            mean_cents=note.mean_cents,
            count=note.count,
        )
        db.add(db_note)

    db.commit()
    db.refresh(db_session)
    return db_session


def read_mean_deviations(db: Session, instrument_id: Optional[int] = None):
    """
    Retrieve mean deviations grouped by note string.

    :param db: The database session
    :param instrument_id: The instrument ID to filter by
    :return: A list of tuples containing note_string, instrument_id, mean_cents, and total_samples
    """
    query = db.query(
        DBNoteAnalysis.note_string,
        DBSession.instrument_id,
        func.avg(DBNoteAnalysis.mean_cents).label("mean_cents"),
        func.sum(DBNoteAnalysis.count).label("total_samples"),
    ).join(DBSession, DBNoteAnalysis.session_id == DBSession.session_id)

    if instrument_id is not None:
        query = query.filter(instrument_id == DBSession.instrument_id)

    results = (
        query.group_by(DBNoteAnalysis.note_string, DBSession.instrument_id)
        .order_by(DBSession.instrument_id, func.avg(DBNoteAnalysis.mean_cents).desc())
        .all()
    )

    return results
