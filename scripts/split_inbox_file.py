import os
import sys
import datetime

def split_haikus(input_file, start_date, per_file, output_dir="data"):
    # Read raw file
    with open(input_file, "r", encoding="utf-8") as f:
        raw_text = f.read().strip()
    haikus = [h.strip() for h in raw_text.split("\n\n") if h.strip()]

    current_date = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
    idx = 0
    day_count = 0

    while idx < len(haikus):
        batch = haikus[idx: idx + per_file]
        idx += per_file
        if not batch:
            break

        file_name = os.path.join(os.getcwd(), current_date.strftime("%Y%m%d") + ".txt")
        with open(file_name, "w", encoding="utf-8") as f:
            f.write("\n\n".join(batch))

        print(f"Wrote: {file_name} ({len(batch)} haikus)")
        day_count += 1
        current_date += datetime.timedelta(days=1)

    print(f"\nDone! {day_count} daily files created, {len(haikus)} haikus distributed.")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python split_haikus.py <inputfile> <startdate YYYY-MM-DD> <haikus_per_file>")
        sys.exit(1)

    input_file = sys.argv[1]
    start_date = sys.argv[2]
    per_file = int(sys.argv[3])

    split_haikus(input_file, start_date, per_file)
