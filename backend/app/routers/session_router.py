from fastapi import APIRouter, HTTPException
from ..models import SessionData

router = APIRouter(prefix="/api")

@router.post("/sessions", status_code=201)
async def create_session(session_data: SessionData):
    """
    Receives analyzed pitch data from the frontend.

    :param session_data: The session data
    :return: A confirmation message
    """
    try:
        print(f"Received session data: {session_data} with {len(session_data.note_strings)} unique notes.")
        return {"status": "success", "session_id": session_data.session_id, "message": "Session data received."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
