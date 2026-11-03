from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


connection_url = URL.create(
    "mssql+pyodbc",
    username=settings.DB_USER,
    password=settings.DB_PASSWORD,
    host=settings.DB_SERVER,
    database=settings.DB_NAME,
    query={
        "driver": "ODBC Driver 18 for SQL Server",
        "TrustServerCertificate": "yes"
    }
)


engine = create_engine(
    connection_url,
    pool_pre_ping=True
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


