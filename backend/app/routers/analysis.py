from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.models import NoteSummary
from app.db import crud
from app.db import get_db
from typing import List, Optional

router = APIRouter()


@router.get("/tendencies", response_model=List[NoteSummary], status_code=201)
async def read_mean_tendencies(
    instrument_id=Optional[int], db: Session = Depends(get_db)
):
    """
    Analyzes pitch tendencies from the provided session data and stores the results in the database.

    :param instrument_id: The instrument ID to filter by
    :param db: The SQLAlchemy DB session (injected via dependency)
    :return: A list of NoteSummary objects representing mean pitch tendencies
    """
    tendencies = crud.read_mean_deviations(db, instrument_id=instrument_id)

    return [
        NoteSummary(
            note_string=t[0],
            instrument_id=t[1],
            mean_cents=round(t[2], 2),
            total_samples=t[3],
        )
        for t in tendencies
    ]
