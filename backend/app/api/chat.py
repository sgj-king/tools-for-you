"""
AI Chat API endpoints
"""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import ChatRequest, ChatResponse, ChatHistoryResponse
from app.services.ai_service import ai_service
from app.models.models import ChatMessage

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    request: Request,
    chat_request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    AI Chat endpoint for tool recommendations
    
    - **message**: User's message describing what tool they need
    - **session_id**: Optional session ID for conversation continuity
    """
    # Generate session ID if not provided
    session_id = chat_request.session_id or str(uuid.uuid4())
    
    # Get user ID if authenticated (optional)
    user_id = None
    # You can extract user from auth header if needed
    
    try:
        response, recommendations = await ai_service.chat(
            db=db,
            user_message=chat_request.message,
            session_id=session_id,
            user_id=user_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
    
    return ChatResponse(
        message=response,
        session_id=session_id,
        recommended_tools=recommendations,
        created_at=datetime.utcnow()
    )


@router.get("/history/{session_id}", response_model=list[ChatHistoryResponse])
def get_chat_history(
    session_id: str,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get chat history for a session"""
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at.asc()).limit(limit).all()
    
    return [ChatHistoryResponse.model_validate(m) for m in messages]


@router.delete("/history/{session_id}")
def clear_chat_history(session_id: str, db: Session = Depends(get_db)):
    """Clear chat history for a session"""
    db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
    db.commit()
    return {"message": "Chat history cleared"}
