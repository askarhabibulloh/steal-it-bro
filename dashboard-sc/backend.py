from flask import Flask, request, jsonify
import requests
from datetime import datetime
import json
from flask_cors import CORS
from datetime import datetime, time, timedelta


app = Flask(__name__)
CORS(app)

DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
DEEPSEEK_API_KEY = "///ISI SENDIRI///"

PROMPT_TEMPLATE = """
You are a scheduling assistant for a co-working building.

Operating hours: 08:00 to 21:00. Any booking outside this range must be ignored completely.

Your task is to analyze room usage data for a specific date and return available time slots for each room. These available slots must:

- Be at least 30 minutes long
- Fall entirely within the operating hours (08:00–21:00)
- Not overlap with any approved bookings
- Start before the end time

Rules for determining whether a booking is approved:

1. Approved if status is "Disetujui".
2. Approved if status is empty AND there is no conflict.
3. Ignore bookings with overlapping times unless approved.
4. Slight overlaps (15 minutes or less) can be accepted if the description indicates approval.
5. Discard all other bookings.
6. If there is a rejected booking, but a re-submission is made and approved, the approved one will be used.

Processing steps:

- For each room, list all approved bookings on the same date.
- Identify time gaps between those bookings that meet the criteria above.
- Exclude any slot that is shorter than 30 minutes or outside working hours.
- Do not include any slot that overlaps or touches disapproved bookings.

Expected output:

Return a valid JSON object structured like this:

{{ 
  "available_slots": {{ 
    "A": [ 
      {{ "time": "08.00-09.00" }}, 
      {{ "time": "14.30-15.00" }} 
    ], 
    "B": [ 
      {{ "time": "08.00-11.00" }} 
    ] 
  }} 
}}

Input data format:

- A dictionary where each key is a room name (e.g., "A", "B", etc.)
- Each room contains a key called "filteredData", which is an array of bookings
- Each booking is a list with fixed indexes:
  - Index 8: Booking date (e.g., "Saturday, May 3, 2025")
  - Index 9: Time range in "HH.MM-HH.MM" or "HH:MM-HH:MM" format
  - Index 11: Description or notes
  - Index 12: Status — such as "Disetujui", "Perhatikan kembali...", or empty

Now, analyze the following room data and return the available time slots:

{room_data}
"""

def filter_short_slots(data):
    def duration_okay(time_range):
        try:
            start, end = time_range.split("-")
            fmt = "%H.%M"
            t_start = datetime.strptime(start.replace(":", "."), fmt)
            t_end = datetime.strptime(end.replace(":", "."), fmt)
            delta = (t_end - t_start).total_seconds() / 60  # in minutes
            return delta >= 30
        except:
            return False

    for room in data.get("available_slots", {}):
        valid_slots = []
        for slot in data["available_slots"][room]:
            if duration_okay(slot.get("time", "")):
                valid_slots.append(slot)
        data["available_slots"][room] = valid_slots
    return data

@app.route('/api/recommend', methods=['POST'])
def get_recommendation():
    try:

        from datetime import datetime, UTC

        now_utc = datetime.now(UTC)

        current_minutes = now_utc.hour * 60 + now_utc.minute

        # Waktu mulai dan akhir dalam menit
        start_minutes = 16 * 60 + 31   # 16:31 UTC = 991
        end_minutes = 0 * 60 + 29      # 00:29 UTC = 29

        # Periksa apakah sekarang berada dalam rentang waktu
        in_range = current_minutes >= start_minutes or current_minutes <= end_minutes

        if not in_range:
            return jsonify({"message": "API not available"}), 403

        data = request.get_json()
        room_data = data.get("roomData", {})
        # print(json.dumps(room_data, indent=2))
        
        prompt = PROMPT_TEMPLATE.format(
            room_data=json.dumps(room_data, indent=2),
            current_time=datetime.now().isoformat()
        )
        
        print("Attempting DeepSeek API call...")
        response = requests.post(
            DEEPSEEK_API_URL,
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "deepseek-chat",
                "messages": [
                    { "role": "system", "content": "You are a time-slot analysis assistant that only returns unbooked room slots. Always validate durations, exclude conflicts, and stay within working hours." },
                    { "role": "user", "content": prompt }
                ],
                "temperature": 0.1,
                "response_format": {"type": "json_object"}
            },
            timeout=100
        )

        print(f"API response status: {response.status_code}")
        print(f"API response body: {response.text}")

        if response.status_code != 200:
            return jsonify({
                "error": "DeepSeek API request failed",
                "status_code": response.status_code,
                "response": response.text
            }), 500

        result = response.json()
        parsed_result = json.loads(result['choices'][0]['message']['content'])
        filtered_result = filter_short_slots(parsed_result)
        return jsonify(filtered_result)

    except (KeyError, json.JSONDecodeError) as e:
        print(f"Data parsing error: {str(e)}")
        return jsonify({"error": "Invalid request data"}), 400
            
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
