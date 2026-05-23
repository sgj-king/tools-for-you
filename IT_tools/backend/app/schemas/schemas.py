"""
Pydantic schemas for API
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from app.models.models import UserRole, ToolStatus, ToolSource


# ============ User Schemas ============

class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    id: int
    role: UserRole
    avatar_url: Optional[str]
    created_at: datetime
    vip_expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ============ Category Schemas ============

class CategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    slug: str = Field(..., max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class CategoryCreate(CategoryBase):
    parent_id: Optional[int] = None
    sort_order: int = 0


class CategoryResponse(CategoryBase):
    id: int
    parent_id: Optional[int]
    sort_order: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class CategoryWithTools(CategoryResponse):
    tool_count: int = 0


# ============ Tag Schemas ============

class TagBase(BaseModel):
    name: str = Field(..., max_length=50)
    slug: str = Field(..., max_length=50)


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: int
    
    class Config:
        from_attributes = True


# ============ Tool Schemas ============

class ToolBase(BaseModel):
    name: str = Field(..., max_length=200)
    slug: str = Field(..., max_length=200)
    description: str
    category_id: int


class ToolCreate(ToolBase):
    source: ToolSource = ToolSource.SELF_HOSTED
    github_url: Optional[str] = None
    external_url: Optional[str] = None
    embed_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    icon: Optional[str] = None
    is_vip_only: bool = False
    keywords: Optional[str] = None
    tag_ids: List[int] = []


class ToolUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    category_id: Optional[int] = None
    external_url: Optional[str] = None
    embed_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    icon: Optional[str] = None
    is_vip_only: Optional[bool] = None
    is_featured: Optional[bool] = None
    status: Optional[ToolStatus] = None
    keywords: Optional[str] = None
    tag_ids: Optional[List[int]] = None


class ToolResponse(ToolBase):
    id: int
    source: ToolSource
    github_url: Optional[str]
    github_stars: int
    github_forks: int
    external_url: Optional[str]
    embed_url: Optional[str]
    thumbnail_url: Optional[str]
    icon: Optional[str]
    status: ToolStatus
    is_featured: bool
    is_vip_only: bool
    is_new: bool
    view_count: int
    use_count: int
    rating_avg: float
    created_at: datetime
    
    class Config:
        from_attributes = True


class ToolDetail(ToolResponse):
    category: CategoryResponse
    tags: List[TagResponse]
    meta_title: Optional[str]
    meta_description: Optional[str]


class ToolListResponse(BaseModel):
    items: List[ToolResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============ AI Chat Schemas ============

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None


class ToolRecommendation(BaseModel):
    id: int
    name: str
    slug: str
    description: str
    icon: Optional[str]
    relevance_score: float = Field(..., ge=0, le=1)


class ChatResponse(BaseModel):
    message: str
    session_id: str
    recommended_tools: List[ToolRecommendation] = []
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    id: int
    role: str
    content: str
    recommended_tools: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ Statistics Schemas ============

class ToolUsageStats(BaseModel):
    tool_id: int
    tool_name: str
    view_count: int
    use_count: int
    favorite_count: int


class DashboardStats(BaseModel):
    total_tools: int
    total_users: int
    total_views_today: int
    total_uses_today: int
    new_tools_this_week: int
    top_tools: List[ToolUsageStats]


# ============ GitHub Sync Schemas ============

class GitHubToolImport(BaseModel):
    repo_url: str
    category_id: int
    is_vip_only: bool = False
    tags: List[str] = []


class GitHubSyncResult(BaseModel):
    added: int
    updated: int
    failed: int
    tools: List[ToolResponse]


# ============ Common Schemas ============

class Message(BaseModel):
    message: str


class PaginatedRequest(BaseModel):
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class SearchRequest(PaginatedRequest):
    query: str = Field("", max_length=200)
    category_id: Optional[int] = None
    tags: List[str] = []
    is_vip_only: Optional[bool] = None
    sort_by: str = "created_at"  # created_at, view_count, use_count, rating_avg
    sort_order: str = "desc"  # asc, desc
