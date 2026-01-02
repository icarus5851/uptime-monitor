from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class MonitorBase(BaseModel):
    url: str
    name: Optional[str] = None
    frequency: int = 60

class MonitorCreate(MonitorBase):
    pass

class MonitorUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    frequency: Optional[int] = None

class PingLogSchema(BaseModel):
    id: str
    status_code: int
    latency_ms: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

class MonitorResponse(MonitorBase):
    id: str
    is_active: bool
    created_at: datetime
    last_status: Optional[int] = None 
    last_latency: Optional[int] = None

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class DowntimeIncident(BaseModel):
    monitor_id: str
    start_time: datetime
    end_time: datetime
    duration_seconds: int
    error_code: int