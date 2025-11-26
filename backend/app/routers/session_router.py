from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.models import SessionData
from app.db import crud
from app.db import get_db

router = APIRouter()


@router.post("/sessions", status_code=201)
async def create_session(session_data: SessionData, db: Session = Depends(get_db)):
    """
    Receives analyzed pitch data from the frontend and stores it in the database.

    :param session_data: The session payload from the frontend
    :param db: The SQLAlchemy DB session (injected via dependency)
    :return: A success message with the session_id
    """
    print("Creating session with data:", session_data)
    try:
        crud.create_session_and_notes(db, session_data)
        print(
            f"Received session data: {session_data} with {len(session_data.note_strings)} unique notes."
        )
        return {
            "status": "success",
            "session_id": session_data.session_id,
            "message": "Session data received.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
