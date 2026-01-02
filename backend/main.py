import os
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm

import models
import schemas
import monitor
import auth
from database import engine, get_db
from scheduler import scheduler, ping_all_monitors, cleanup_old_logs

models.Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 System Starting...")
    scheduler.add_job(ping_all_monitors, 'interval', seconds=60)
    scheduler.add_job(cleanup_old_logs, 'interval', hours=24)
    scheduler.start()
    yield
    print("🛑 System Shutting Down...")
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        os.getenv("FRONTEND_URL")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Overseer Backend is running"}


@app.post("/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, name=user.name, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/auth/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.patch("/auth/me", response_model=schemas.UserResponse)
def update_user(
    update_data: schemas.UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if update_data.email and update_data.email != current_user.email:
        existing = db.query(models.User).filter(models.User.email == update_data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = update_data.email

    if update_data.name:
        current_user.name = update_data.name
        
    if update_data.password:
        current_user.hashed_password = auth.get_password_hash(update_data.password)

    db.commit()
    db.refresh(current_user)
    return current_user

@app.delete("/auth/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    db.delete(current_user)
    db.commit()
    return None


@app.post("/monitors", response_model=schemas.MonitorResponse, status_code=status.HTTP_201_CREATED)
def create_monitor(
    monitor_data: schemas.MonitorCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    existing = monitor.get_monitor_by_url(db, monitor_data.url, current_user.id)
    if existing:
        raise HTTPException(status_code=400, detail="Monitor for this URL already exists")

    return monitor.create_monitor(
        db, 
        url=monitor_data.url, 
        name=monitor_data.name, 
        frequency=monitor_data.frequency,
        user_id=current_user.id
    )

@app.get("/monitors", response_model=List[schemas.MonitorResponse])
def read_monitors(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    return monitor.get_monitors(db, user_id=current_user.id, active_only=False)

@app.get("/monitors/{monitor_id}", response_model=schemas.MonitorResponse)
def read_monitor(
    monitor_id: str, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    db_monitor = monitor.get_monitor_by_id(db, monitor_id, current_user.id)
    if not db_monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    return db_monitor

@app.get("/monitors/{monitor_id}/history", response_model=List[schemas.PingLogSchema])
def read_monitor_history(
    monitor_id: str, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    db_monitor = monitor.get_monitor_by_id(db, monitor_id, current_user.id)
    if not db_monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
        
    logs = monitor.get_monitor_history(db, monitor_id, limit=50)
    return logs

@app.patch("/monitors/{monitor_id}", response_model=schemas.MonitorResponse)
def update_monitor(
    monitor_id: str, 
    update_data: schemas.MonitorUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    updated = monitor.update_monitor(
        db, 
        monitor_id, 
        user_id=current_user.id,
        name=update_data.name, 
        url=update_data.url, 
        frequency=update_data.frequency
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Monitor not found")
    return updated

@app.delete("/monitors/{monitor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_monitor(
    monitor_id: str, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    success = monitor.delete_monitor(db, monitor_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Monitor not found")
    return None

@app.post("/monitors/{monitor_id}/pause", response_model=schemas.MonitorResponse)
def pause_monitor(
    monitor_id: str, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    updated_monitor = monitor.toggle_monitor_status(db, monitor_id, current_user.id)
    if not updated_monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    return updated_monitor

@app.get("/monitors/{monitor_id}/incidents", response_model=List[schemas.DowntimeIncident])
def read_monitor_incidents(
    monitor_id: str, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    return monitor.get_monitor_incidents(db, monitor_id, current_user.id)