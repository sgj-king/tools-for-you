"""
AI Service - Handles LLM integration for tool recommendations
"""
import httpx
import json
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import Tool, ChatMessage
from app.schemas.schemas import ToolRecommendation


class AIService:
    """Service for AI-powered tool recommendations"""
    
    def __init__(self):
        self.api_url = settings.AI_API_URL
        self.api_key = settings.AI_API_KEY
        self.model = settings.AI_MODEL
    
    async def chat(
        self,
        db: Session,
        user_message: str,
        session_id: str,
        user_id: Optional[int] = None
    ) -> tuple[str, List[ToolRecommendation]]:
        """
        Process user message and return AI response with tool recommendations
        """
        # Get available tools for context
        tools = db.query(Tool).filter(
            Tool.status == "published"
        ).limit(100).all()
        
        # Build tools context
        tools_context = self._build_tools_context(tools)
        
        # Build system prompt
        system_prompt = f"""你是一个工具推荐助手，帮助用户找到合适的在线工具。

你可以推荐以下工具：
{tools_context}

你的任务是：
1. 理解用户的需求描述
2. 从工具列表中推荐最相关的工具（最多3个）
3. 简要说明推荐理由和使用方法
4. 如果用户询问具体工具使用方法，提供详细指导

回复格式要求：
- 用友好的语气交流
- 如果推荐工具，用JSON格式列出：{{"recommendations": [{{"name": "工具名", "reason": "推荐理由"}}]}}
- 不推荐工具时正常对话即可"""

        # Get chat history for context
        history = db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.created_at.desc()).limit(10).all()
        
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add history (reversed to get chronological order)
        for msg in reversed(history):
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        # Call AI API
        try:
            response_text, tokens = await self._call_llm(messages)
        except Exception as e:
            # Fallback response if AI fails
            response_text = f"抱歉，AI 服务暂时不可用。您可以浏览分类或使用搜索功能找到需要的工具。"
            tokens = 0
        
        # Parse recommendations from response
        recommendations = self._parse_recommendations(response_text, tools)
        
        # Save user message
        user_msg = ChatMessage(
            user_id=user_id,
            session_id=session_id,
            role="user",
            content=user_message
        )
        db.add(user_msg)
        
        # Save assistant message
        assistant_msg = ChatMessage(
            user_id=user_id,
            session_id=session_id,
            role="assistant",
            content=response_text,
            model_used=self.model,
            tokens_used=tokens,
            recommended_tools=json.dumps([r.dict() for r in recommendations]) if recommendations else None
        )
        db.add(assistant_msg)
        db.commit()
        
        return response_text, recommendations
    
    async def _call_llm(self, messages: List[dict]) -> tuple[str, int]:
        """Call the LLM API"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.api_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": 1000,
                    "temperature": 0.7
                }
            )
            response.raise_for_status()
            data = response.json()
            
            content = data["choices"][0]["message"]["content"]
            tokens = data.get("usage", {}).get("total_tokens", 0)
            
            return content, tokens
    
    def _build_tools_context(self, tools: List[Tool]) -> str:
        """Build context string from tools"""
        lines = []
        for tool in tools:
            tags = ", ".join([t.name for t in tool.tags]) if tool.tags else ""
            line = f"- {tool.name}: {tool.description[:100]}..."
            if tags:
                line += f" (标签: {tags})"
            lines.append(line)
        return "\n".join(lines[:50])  # Limit to prevent token overflow
    
    def _parse_recommendations(
        self,
        response: str,
        tools: List[Tool]
    ) -> List[ToolRecommendation]:
        """Parse tool recommendations from AI response"""
        recommendations = []
        
        # Try to extract JSON from response
        try:
            # Look for JSON in the response
            start = response.find("{")
            end = response.rfind("}") + 1
            if start != -1 and end > start:
                json_str = response[start:end]
                data = json.loads(json_str)
                
                if "recommendations" in data:
                    tool_map = {t.name.lower(): t for t in tools}
                    
                    for rec in data["recommendations"]:
                        name = rec.get("name", "").lower()
                        if name in tool_map:
                            tool = tool_map[name]
                            recommendations.append(ToolRecommendation(
                                id=tool.id,
                                name=tool.name,
                                slug=tool.slug,
                                description=tool.description,
                                icon=tool.icon,
                                relevance_score=0.9
                            ))
        except (json.JSONDecodeError, KeyError):
            pass
        
        # Fallback: keyword matching in response
        if not recommendations:
            tool_map = {t.name.lower(): t for t in tools}
            for name, tool in tool_map.items():
                if name in response.lower():
                    recommendations.append(ToolRecommendation(
                        id=tool.id,
                        name=tool.name,
                        slug=tool.slug,
                        description=tool.description,
                        icon=tool.icon,
                        relevance_score=0.7
                    ))
                    if len(recommendations) >= 3:
                        break
        
        return recommendations[:3]  # Max 3 recommendations


# Singleton instance
ai_service = AIService()
