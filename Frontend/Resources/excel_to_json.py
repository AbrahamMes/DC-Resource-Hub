import pandas as pd
import json
from pathlib import Path

def excel_to_json(
    excel_path: str,
    json_path: str,
    sheet_name: str | int = 0
) -> None:
    """
    Convert an Excel contact sheet to a JSON file.

    :param excel_path: Path to the source Excel file (.xlsx)
    :param json_path: Path to the output JSON file
    :param sheet_name: Sheet name or index (default: first sheet)
    """

    # Read Excel file
    df = pd.read_excel(excel_path, sheet_name=sheet_name)

    # Normalize column names (optional but recommended)
    df.columns = [col.strip().lower() for col in df.columns]
    df = df.fillna("N/A")
    required_columns = {"name", "company", "email", "phone", "position", "area/equipment"}
    missing = required_columns - set(df.columns)

    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # Convert DataFrame to list of dicts
    records = df[list(required_columns)].to_dict(orient="records")

    # Write JSON output
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)

    print(f"Converted {len(records)} contacts to {json_path}")


if __name__ == "__main__":
    excel_file = "contacts.xlsx"
    json_file = "contacts.json"

    excel_to_json(excel_file, json_file)
