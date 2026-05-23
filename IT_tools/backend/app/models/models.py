"""
Database models for IT Tools Hub
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, ForeignKey, Table, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


# Many-to-Many relationship: User <-> Tool (Favorites)
user_favorites = Table(
    'user_favorites',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('tool_id', Integer, ForeignKey('tools.id', ondelete='CASCADE'), primary_key=True)
)

# Many-to-Many relationship: Tool <-> Tag
tool_tags = Table(
    'tool_tags',
    Base.metadata,
    Column('tool_id', Integer, ForeignKey('tools.id', ondelete='CASCADE'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)


class UserRole(str, enum.Enum):
    """User roles"""
    FREE = "free"
    VIP = "vip"
    ADMIN = "admin"


class ToolStatus(str, enum.Enum):
    """Tool status"""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ToolSource(str, enum.Enum):
    """Tool source"""
    GITHUB = "github"
    SELF_HOSTED = "self_hosted"
    EMBEDDED = "embedded"


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.FREE)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String(500), nullable=True)
    
    # VIP related
    vip_expires_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)
    
    # Relationships
    favorites = relationship("Tool", secondary=user_favorites, back_populates="favorited_by")
    usage_logs = relationship("ToolUsageLog", back_populates="user", cascade="all, delete-orphan")
    chat_history = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.username}>"


class Category(Base):
    """Tool category"""
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)  # Icon name for frontend
    color = Column(String(20), nullable=True)  # Theme color
    parent_id = Column(Integer, ForeignKey('categories.id'), nullable=True)
    sort_order = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tools = relationship("Tool", back_populates="category")
    children = relationship("Category", backref="parent", remote_side=[id])
    
    def __repr__(self):
        return f"<Category {self.name}>"


class Tag(Base):
    """Tool tags"""
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    slug = Column(String(50), unique=True, index=True, nullable=False)
    
    # Relationships
    tools = relationship("Tool", secondary=tool_tags, back_populates="tags")
    
    def __repr__(self):
        return f"<Tag {self.name}>"


class Tool(Base):
    """Tool model"""
    __tablename__ = "tools"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    slug = Column(String(200), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    
    # Classification
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=False)
    
    # Source information
    source = Column(SQLEnum(ToolSource), default=ToolSource.SELF_HOSTED)
    github_url = Column(String(500), nullable=True)
    github_stars = Column(Integer, default=0)
    github_forks = Column(Integer, default=0)
    github_updated_at = Column(DateTime, nullable=True)
    
    # Tool details
    external_url = Column(String(500), nullable=True)  # External tool URL
    embed_url = Column(String(500), nullable=True)  # Iframe embed URL
    thumbnail_url = Column(String(500), nullable=True)
    icon = Column(String(50), nullable=True)
    
    # Status & Visibility
    status = Column(SQLEnum(ToolStatus), default=ToolStatus.PUBLISHED)
    is_featured = Column(Boolean, default=False)
    is_vip_only = Column(Boolean, default=False)
    is_new = Column(Boolean, default=False)
    
    # Statistics
    view_count = Column(Integer, default=0)
    use_count = Column(Integer, default=0)
    rating_avg = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    
    # SEO
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(String(500), nullable=True)
    keywords = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)
    
    # Relationships
    category = relationship("Category", back_populates="tools")
    tags = relationship("Tag", secondary=tool_tags, back_populates="tools")
    favorited_by = relationship("User", secondary=user_favorites, back_populates="favorites")
    usage_logs = relationship("ToolUsageLog", back_populates="tool", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Tool {self.name}>"


class ToolUsageLog(Base):
    """Track tool usage"""
    __tablename__ = "tool_usage_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    tool_id = Column(Integer, ForeignKey('tools.id', ondelete='CASCADE'), nullable=False)
    action = Column(String(50), nullable=False)  # 'view', 'use', 'favorite', 'unfavorite'
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="usage_logs")
    tool = relationship("Tool", back_populates="usage_logs")
    
    def __repr__(self):
        return f"<ToolUsageLog {self.tool_id} - {self.action}>"


class ChatMessage(Base):
    """AI Chat history"""
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=True)  # Nullable for anonymous
    session_id = Column(String(100), index=True, nullable=False)  # Session identifier
    
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    
    # AI metadata
    model_used = Column(String(100), nullable=True)
    tokens_used = Column(Integer, nullable=True)
    
    # Recommended tools (if any)
    recommended_tools = Column(String, nullable=True)  # JSON string of tool IDs
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="chat_history")
    
    def __repr__(self):
        return f"<ChatMessage {self.session_id} - {self.role}>"


class GitHubSyncLog(Base):
    """GitHub sync history"""
    __tablename__ = "github_sync_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String(20), nullable=False)  # 'success', 'failed', 'partial'
    tools_added = Column(Integer, default=0)
    tools_updated = Column(Integer, default=0)
    tools_failed = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<GitHubSyncLog {self.status} - {self.created_at}>"


class VIPSubscription(Base):
    """VIP subscription records"""
    __tablename__ = "vip_subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # Subscription details
    plan = Column(String(50), nullable=False)  # 'monthly', 'yearly', 'lifetime'
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default='CNY')
    
    # Payment info
    payment_method = Column(String(50), nullable=True)
    payment_id = Column(String(200), nullable=True)  # External payment ID
    
    # Status
    status = Column(String(20), default='active')  # 'active', 'expired', 'cancelled'
    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<VIPSubscription {self.user_id} - {self.plan}>"
