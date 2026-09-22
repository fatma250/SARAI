from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone


class ChatMessage(Base):
    """
    One question/answer exchange with the SARAI chatbot.
    user_id is nullable so anonymous visitors can still use the chatbot;
    only messages from authenticated users are tied to a history.
    """
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    intent_type = Column(String(50), nullable=True)
    source = Column(String(20), nullable=True, comment="ollama / template")

    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="chat_messages")

    __table_args__ = (
        Index("idx_chat_messages_user_id", "user_id"),
        Index("idx_chat_messages_created_at", "created_at"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "question": self.question,
            "answer": self.answer,
            "intent_type": self.intent_type,
            "source": self.source,
            "created_at": self.created_at,
        }
