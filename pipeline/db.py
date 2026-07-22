import pandas as pd
from sqlalchemy import create_engine, text

from config import DB_CONFIG


def get_engine():
    url = (
        f"postgresql+psycopg2://{DB_CONFIG['user']}:{DB_CONFIG['password']}"
        f"@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['name']}"
    )
    return create_engine(url)


def query(engine, sql: str, params: dict | None = None) -> pd.DataFrame:
    return pd.read_sql(text(sql), engine, params=params or {})
