import math
from datetime import date, datetime, time
import numpy as np
import pandas as pd

def wire(value):
    if value is None:
        return None
    if isinstance(value, (date, datetime, time)):
        return value.isoformat()
    if isinstance(value, (np.integer, np.bool_)):
        return value.item()
    if isinstance(value, (float, np.floating)):
        return float(value) if math.isfinite(value) else None
    if isinstance(value, dict):
        return {str(k): wire(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [wire(v) for v in value]
    if isinstance(value, pd.DataFrame):
        return {'columns': list(map(str, value.columns)), 'rows': wire(value.to_dict('records'))}
    if value is pd.NA or value is pd.NaT:
        return None
    if isinstance(value, (str, int, bool)):
        return value
    return str(value)
