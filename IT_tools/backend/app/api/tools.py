"""
Tools API endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import (
    ToolCreate, ToolUpdate, ToolResponse, ToolDetail,
    ToolListResponse, SearchRequest, ToolRecommendation,
    CategoryResponse, CategoryWithTools
)
from app.services.tool_service import tool_service
from app.models.models import Tool, Category

router = APIRouter(prefix="/tools", tags=["tools"])


@router.get("", response_model=ToolListResponse)
def get_tools(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category_id: int = None,
    is_vip_only: bool = None,
    is_featured: bool = None,
    db: Session = Depends(get_db)
):
    """Get paginated list of tools"""
    skip = (page - 1) * page_size
    tools, total = tool_service.get_tools(
        db, skip=skip, limit=page_size,
        category_id=category_id, is_vip_only=is_vip_only, is_featured=is_featured
    )
    
    return ToolListResponse(
        items=[ToolResponse.model_validate(t) for t in tools],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/search", response_model=ToolListResponse)
def search_tools(
    query: str = "",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category_id: int = None,
    is_vip_only: bool = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db)
):
    """Search tools with filters"""
    request = SearchRequest(
        query=query,
        page=page,
        page_size=page_size,
        category_id=category_id,
        is_vip_only=is_vip_only,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    tools, total = tool_service.search_tools(db, request)
    
    return ToolListResponse(
        items=[ToolResponse.model_validate(t) for t in tools],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/featured", response_model=List[ToolResponse])
def get_featured_tools(db: Session = Depends(get_db)):
    """Get featured tools"""
    tools = tool_service.get_featured_tools(db)
    return [ToolResponse.model_validate(t) for t in tools]


@router.get("/popular", response_model=List[ToolResponse])
def get_popular_tools(db: Session = Depends(get_db)):
    """Get popular tools"""
    tools = tool_service.get_popular_tools(db)
    return [ToolResponse.model_validate(t) for t in tools]


@router.get("/new", response_model=List[ToolResponse])
def get_new_tools(db: Session = Depends(get_db)):
    """Get newly added tools"""
    tools = tool_service.get_new_tools(db)
    return [ToolResponse.model_validate(t) for t in tools]


@router.get("/{slug}", response_model=ToolDetail)
def get_tool(slug: str, request: Request, db: Session = Depends(get_db)):
    """Get tool details by slug"""
    tool = tool_service.get_tool_by_slug(db, slug)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    # Log view
    tool_service.log_usage(
        db, tool.id, "view",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    return ToolDetail.model_validate(tool)


@router.post("/{tool_id}/use")
def use_tool(
    tool_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Log tool usage"""
    tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    tool_service.log_usage(
        db, tool_id, "use",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    return {"message": "Usage logged"}


@router.post("", response_model=ToolResponse)
def create_tool(tool_data: ToolCreate, db: Session = Depends(get_db)):
    """Create new tool (admin only)"""
    tool = tool_service.create_tool(db, tool_data)
    return ToolResponse.model_validate(tool)


@router.patch("/{tool_id}", response_model=ToolResponse)
def update_tool(tool_id: int, tool_data: ToolUpdate, db: Session = Depends(get_db)):
    """Update tool (admin only)"""
    tool = tool_service.update_tool(db, tool_id, tool_data)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return ToolResponse.model_validate(tool)


@router.get("/categories/all", response_model=List[CategoryWithTools])
def get_categories(db: Session = Depends(get_db)):
    """Get all categories with tool counts"""
    results = tool_service.get_categories_with_counts(db)
    
    return [
        CategoryWithTools(
            **CategoryResponse.model_validate(r["category"]).model_dump(),
            tool_count=r["tool_count"]
        )
        for r in results
    ]
