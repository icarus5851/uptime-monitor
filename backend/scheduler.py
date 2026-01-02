import httpx
import asyncio
from sqlalchemy.orm import Session
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import logging
from datetime import datetime, timezone, timedelta
from database import SessionLocal
import monitor
from models import PingLog

logger = logging.getLogger("uvicorn")

scheduler = AsyncIOScheduler()

async def ping_url(client: httpx.AsyncClient, monitor_obj, db: Session):
    """
    Ping a url and log the result.
    """
    try:
        response = await client.get(monitor_obj.url, timeout=10)
        latency = int(response.elapsed.total_seconds() * 1000)
        status_code = response.status_code
        
        if status_code >= 400:
            logger.warning(f"❌ {monitor_obj.url} is DOWN ({status_code}) - {latency}ms")
        else:
            logger.info(f"✅ {monitor_obj.url} is UP ({status_code}) - {latency}ms")
            
        monitor.log_ping(db, monitor_obj.id, status_code, latency)
        
    except httpx.RequestError:
        logger.warning(f"❌ {monitor_obj.url} is DOWN (Connection Error)")
        monitor.log_ping(db, monitor_obj.id, 0, 0) 
    except Exception as e:
        logger.error(f"⚠️ Error pinging {monitor_obj.url}: {e}")

def cleanup_old_logs():
    """
    Deletes all ping logs older than 5 days.
    """
    db = SessionLocal()
    try:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=5)
        deleted_count = db.query(PingLog).filter(PingLog.timestamp < cutoff_date).delete()
        db.commit()
        if deleted_count > 0:
            logger.info(f"🧹 Cleaned up {deleted_count} old ping logs.")
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
    finally:
        db.close()

async def ping_all_monitors():
    """
    Fetch all monitors and ping them in PARALLEL.
    """
    db = SessionLocal()
    try:
        monitors = monitor.get_monitors(db, active_only=True)
        if not monitors: return

        async with httpx.AsyncClient() as client:
            tasks = []
            for m in monitors:
                if m.last_checked:
                    time_since_last = (datetime.now(timezone.utc) - m.last_checked).total_seconds()
                    if time_since_last < (m.frequency - 1): 
                        continue
                
                m.last_checked = datetime.now(timezone.utc)
                tasks.append(ping_url(client, m, db))
            
            db.commit()

            if tasks:
                await asyncio.gather(*tasks)
                
    except Exception as e:
        logger.error(f"Scheduler Error: {e}")
    finally:
        db.close()