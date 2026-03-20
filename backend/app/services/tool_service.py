"""
Tool Service - Business logic for tools
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.models import Tool, Category, Tag, ToolUsageLog, ToolStatus
from app.schemas.schemas import ToolCreate, ToolUpdate, SearchRequest


class ToolService:
    """Service for tool operations"""
    
    def get_tools(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 20,
        category_id: Optional[int] = None,
        is_vip_only: Optional[bool] = None,
        is_featured: Optional[bool] = None
    ) -> tuple[List[Tool], int]:
        """Get paginated tools with filters"""
        query = db.query(Tool).filter(Tool.status == ToolStatus.PUBLISHED)
        
        if category_id:
            query = query.filter(Tool.category_id == category_id)
        
        if is_vip_only is not None:
            query = query.filter(Tool.is_vip_only == is_vip_only)
        
        if is_featured is not None:
            query = query.filter(Tool.is_featured == is_featured)
        
        total = query.count()
        tools = query.order_by(Tool.is_featured.desc(), Tool.created_at.desc()).offset(skip).limit(limit).all()
        
        return tools, total
    
    def search_tools(
        self,
        db: Session,
        request: SearchRequest
    ) -> tuple[List[Tool], int]:
        """Search tools with filters and sorting"""
        query = db.query(Tool).filter(Tool.status == ToolStatus.PUBLISHED)
        
        # Search by query
        if request.query:
            search_term = f"%{request.query}%"
            query = query.filter(
                or_(
                    Tool.name.ilike(search_term),
                    Tool.description.ilike(search_term),
                    Tool.keywords.ilike(search_term)
                )
            )
        
        # Filter by category
        if request.category_id:
            query = query.filter(Tool.category_id == request.category_id)
        
        # Filter by VIP
        if request.is_vip_only is not None:
            query = query.filter(Tool.is_vip_only == request.is_vip_only)
        
        # Filter by tags
        if request.tags:
            query = query.join(Tool.tags).filter(Tag.slug.in_(request.tags))
        
        # Sorting
        sort_column = getattr(Tool, request.sort_by, Tool.created_at)
        if request.sort_order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        total = query.count()
        skip = (request.page - 1) * request.page_size
        tools = query.offset(skip).limit(request.page_size).all()
        
        return tools, total
    
    def get_tool_by_slug(self, db: Session, slug: str) -> Optional[Tool]:
        """Get tool by slug"""
        return db.query(Tool).filter(Tool.slug == slug).first()
    
    def get_featured_tools(self, db: Session, limit: int = 6) -> List[Tool]:
        """Get featured tools"""
        return db.query(Tool).filter(
            Tool.status == ToolStatus.PUBLISHED,
            Tool.is_featured == True
        ).order_by(Tool.view_count.desc()).limit(limit).all()
    
    def get_popular_tools(self, db: Session, limit: int = 10) -> List[Tool]:
        """Get most used tools"""
        return db.query(Tool).filter(
            Tool.status == ToolStatus.PUBLISHED
        ).order_by(Tool.use_count.desc()).limit(limit).all()
    
    def get_new_tools(self, db: Session, limit: int = 6) -> List[Tool]:
        """Get newly added tools"""
        return db.query(Tool).filter(
            Tool.status == ToolStatus.PUBLISHED,
            Tool.is_new == True
        ).order_by(Tool.created_at.desc()).limit(limit).all()
    
    def log_usage(
        self,
        db: Session,
        tool_id: int,
        action: str,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        """Log tool usage"""
        log = ToolUsageLog(
            tool_id=tool_id,
            user_id=user_id,
            action=action,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(log)
        
        # Update tool stats
        tool = db.query(Tool).filter(Tool.id == tool_id).first()
        if tool:
            if action == "view":
                tool.view_count += 1
            elif action == "use":
                tool.use_count += 1
        
        db.commit()
    
    def create_tool(self, db: Session, tool_data: ToolCreate) -> Tool:
        """Create new tool"""
        tool_dict = tool_data.dict(exclude={"tag_ids"})
        
        # Handle tags
        tag_ids = tool_data.tag_ids or []
        tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all() if tag_ids else []
        
        tool = Tool(**tool_dict, tags=tags)
        db.add(tool)
        db.commit()
        db.refresh(tool)
        
        return tool
    
    def update_tool(self, db: Session, tool_id: int, tool_data: ToolUpdate) -> Optional[Tool]:
        """Update tool"""
        tool = db.query(Tool).filter(Tool.id == tool_id).first()
        if not tool:
            return None
        
        update_data = tool_data.dict(exclude_unset=True, exclude={"tag_ids"})
        
        for field, value in update_data.items():
            setattr(tool, field, value)
        
        # Handle tags
        if tool_data.tag_ids is not None:
            tags = db.query(Tag).filter(Tag.id.in_(tool_data.tag_ids)).all()
            tool.tags = tags
        
        db.commit()
        db.refresh(tool)
        
        return tool
    
    def get_categories_with_counts(self, db: Session) -> List[dict]:
        """Get all categories with tool counts"""
        categories = db.query(
            Category,
            func.count(Tool.id).label('tool_count')
        ).outerjoin(
            Tool, 
            (Tool.category_id == Category.id) & (Tool.status == ToolStatus.PUBLISHED)
        ).group_by(Category.id).order_by(Category.sort_order).all()
        
        return [
            {
                "category": cat,
                "tool_count": count
            }
            for cat, count in categories
        ]


# Singleton instance
tool_service = ToolService()
