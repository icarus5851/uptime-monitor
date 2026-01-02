from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    monitors = relationship("Monitor", back_populates="user", cascade="all, delete-orphan")

class Monitor(Base):
    __tablename__ = "monitors"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=True)
    url = Column(String, index=True)
    frequency = Column(Integer, default=60)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_checked = Column(DateTime(timezone=True), nullable=True)
    user_id = Column(String, ForeignKey("users.id"))
    user = relationship("User", back_populates="monitors")

    logs = relationship("PingLog", back_populates="monitor", cascade="all, delete")

class PingLog(Base):
    __tablename__ = "ping_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    monitor_id = Column(String, ForeignKey("monitors.id"), nullable=False)
    status_code = Column(Integer)
    latency_ms = Column(Integer)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    monitor = relationship("Monitor", back_populates="logs")