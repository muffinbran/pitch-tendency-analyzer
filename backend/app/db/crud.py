from sqlalchemy.orm import Session

from app.models import SessionData
from app.db.models import DBSession, DBNoteAnalysis


def create_session_and_notes(db: Session, session_data: SessionData):
    """
    Create a new session and associated note analyses in the database.

    :param db: The database session
    :param session_data: The session data to store
    :return: The created DBSession object
    """
    db_session = DBSession(
        session_id=session_data.session_id,
        instrument=session_data.instrument,
        instrument_id=session_data.instrument_id
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    for note in session_data.note_strings:
        db_note = DBNoteAnalysis(
            session_id=session_data.session_id,
            note_string=note.note_string,
            mean_cents=note.mean_cents,
            count=note.count
        )
        db.add(db_note)

    db.commit()
    return db_session