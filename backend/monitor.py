from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import Monitor, PingLog
from datetime import timedelta
import logging

logger = logging.getLogger("uvicorn")

def create_monitor(db: Session, url: str, user_id: str, name: str = None, frequency: int = 60):
    new_monitor = Monitor(
        url=url,
        name=name or url,
        frequency=frequency,
        user_id=user_id
    )
    db.add(new_monitor)
    try:
        db.commit()
        db.refresh(new_monitor)
        return new_monitor
    except Exception as e:
        db.rollback()
        raise e

def update_monitor(db: Session, monitor_id: str, user_id: str, name: str = None, url: str = None, frequency: int = None):
    monitor = get_monitor_by_id(db, monitor_id, user_id)
    if not monitor:
        return None 
    
    if name is not None: monitor.name = name
    if url is not None: monitor.url = url
    if frequency is not None: monitor.frequency = frequency

    try:
        db.commit()
        db.refresh(monitor)
        return monitor
    except Exception as e:
        db.rollback()
        raise e

def delete_monitor(db: Session, monitor_id: str, user_id: str):
    monitor = get_monitor_by_id(db, monitor_id, user_id)
    if not monitor:
        return None
    
    db.delete(monitor)
    try:
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise e

def toggle_monitor_status(db: Session, monitor_id: str, user_id: str):
    monitor = get_monitor_by_id(db, monitor_id, user_id)
    if not monitor:
        return None
    
    monitor.is_active = not monitor.is_active
    try:
        db.commit()
        db.refresh(monitor)
        return monitor
    except Exception as e:
        db.rollback()
        raise e

def get_monitors(db: Session, user_id: str = None, active_only: bool = False):
    query = db.query(Monitor)
    if user_id:
        query = query.filter(Monitor.user_id == user_id)
    if active_only:
        query = query.filter(Monitor.is_active == True)
    
    monitors = query.all()

    for m in monitors:
        last_log = db.query(PingLog).filter(PingLog.monitor_id == m.id).order_by(PingLog.timestamp.desc()).first()
        if last_log:
            m.last_status = last_log.status_code
            m.last_latency = last_log.latency_ms
            
    return monitors



def get_monitor_by_url(db: Session, url: str, user_id: str):
    return db.query(Monitor).filter(Monitor.url == url, Monitor.user_id == user_id).first()

def get_monitor_by_id(db: Session, monitor_id: str, user_id: str):
    m = db.query(Monitor).filter(Monitor.id == monitor_id, Monitor.user_id == user_id).first()

    if m:
        last_log = db.query(PingLog).filter(PingLog.monitor_id == m.id).order_by(PingLog.timestamp.desc()).first()
        if last_log:
            m.last_status = last_log.status_code
            m.last_latency = last_log.latency_ms
            
    return m

def get_monitor_history(db: Session, monitor_id: str, limit: int = 50):
    return db.query(PingLog)\
             .filter(PingLog.monitor_id == monitor_id)\
             .order_by(PingLog.timestamp.desc())\
             .limit(limit)\
             .all()

def log_ping(db: Session, monitor_id: str, status: int, latency: int):
    log_entry = PingLog(
        monitor_id=monitor_id,
        status_code=status,
        latency_ms=latency
    )
    db.add(log_entry)
    try:
        db.commit()
    except Exception as e:
        logger.error(f"Failed to log ping: {e}")
        db.rollback()

def get_monitor_incidents(db: Session, monitor_id: str, user_id: str):
    mon = get_monitor_by_id(db, monitor_id, user_id)
    if not mon: return []

    fail_logs = db.query(PingLog)\
        .filter(PingLog.monitor_id == monitor_id)\
        .filter((PingLog.status_code < 200) | (PingLog.status_code >= 400))\
        .order_by(PingLog.timestamp.asc())\
        .all()

    if not fail_logs:
        return []

    incidents = []
    current_incident = None

    for log in fail_logs:
        if current_incident is None:
            current_incident = {
                "monitor_id": monitor_id,
                "start_time": log.timestamp,
                "end_time": log.timestamp,
                "error_code": log.status_code
            }
        else:
            time_diff = (log.timestamp - current_incident["end_time"]).total_seconds()
            if time_diff <= (mon.frequency * 2 + 30): 
                current_incident["end_time"] = log.timestamp
                current_incident["error_code"] = log.status_code 
            else:
                current_incident["duration_seconds"] = int((current_incident["end_time"] - current_incident["start_time"]).total_seconds())
                incidents.append(current_incident)
                current_incident = {
                    "monitor_id": monitor_id,
                    "start_time": log.timestamp,
                    "end_time": log.timestamp,
                    "error_code": log.status_code
                }

    if current_incident:
        current_incident["duration_seconds"] = int((current_incident["end_time"] - current_incident["start_time"]).total_seconds())
        incidents.append(current_incident)

    return incidents[::-1]