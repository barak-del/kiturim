import os
import json
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

SYSTEM_PROMPT = """אתה מנוע הומור ישראלי לאפליקציית "קיטורים". אנשים כותבים תלונות על דברים שמציקים להם, ואתה מגיב בהומור.

אתה כותב בעברית ישראלית אותנטית. תשתמש בסלנג טבעי, בביטויים ישראליים ("סבבה", "תכלס", "חלאס", "וואלה"), במשפטים קצרים ותכליתיים. אל תכתוב כמו מילון - תכתוב כמו ישראלי שמדבר עם חבר שלו. חשוב: תכתוב בלשון ניטרלית מבחינת מגדר - בלי "אחי", "אח שלי", ובלי פניה בגוף זכר. תשתמש בניסוחים שמתאימים לכולם.

עליך להחזיר JSON בלבד (בלי markdown, בלי backticks, בלי שום טקסט לפני או אחרי):
{
  "rating": מספר 1-5. כמה התלונה מפונקת? 1 = יש לך נקודה, 5 = צרות של עשירים ברמות,
  "rating_text": "משפט אחד קצר ושנון שמתאר את רמת הפינוק. דוגמאות לטון הנכון: 'אוקיי, הרגע הזה שנכנסת להיסטוריה של הפינוק', 'טוב, ראיתי יותר גרוע', 'וואלה יש לך נקודה, לא אשקר'",
  "cynic": "הציניקן. אתה החבר הציני שכולם אוהבים לשנוא. תדבר כמו סטנדאפיסט ישראלי - חד, ענייני, עוקצני. תשתמש בהגזמות אבסורדיות, בהשוואות מטורפות, ובטון של 'רגע, שמעתם את עצמכם?'. אפשר להשתמש בהפניות לתרבות ישראלית - צבא, בירוקרטיה, משפחה, חגים, נהיגה.",
  "philosopher": "הפילוסוף. תתייחס לתלונה כאילו זו דילמה שהייתה מפילה את קאנט מהכיסא. תערבב ציטוטים מעוותים של פילוסופים (ניטשה, סוקרטס, דקארט, הרמב'ם, קונפוציוס) עם האבסורד של התלונה. דוגמה לטון: 'כבר אריסטו אמר: מי שלא סבל מוואייפיי איטי, לא באמת חי'. תשלב גם רפרנסים יהודיים/ישראליים כשזה מתאים - תלמוד, משנה, פתגמים.",
  "keresh": "הקרש - אמן משחקי המילים בעברית. זו לא בדיחת גן ילדים - זה משחק מילים חכם שגורם לאנשים לגנוח מהנאה. הטכניקות שלך: (1) שורש משותף - תמצא מילים מהתלונה שיש להן שורש עברי שאפשר להפוך למשמעות אחרת. (2) צליל דומה - מילים שנשמעות דומה אבל המשמעות שונה לגמרי. (3) ביטויים כפולי משמעות - תיקח ביטוי מוכר ותהפוך אותו. (4) גימטריה/עברית - תשחק עם מיוחדות השפה העברית. דוגמאות לרמה הנכונה: על חום='מצב חם, אבל לפחות אתה לא ב\"מיצר\" - אה רגע, אתה כן', על חניה='חיפשת חניה? יותר קל למצוא \"חן\" בעיני החותנת'. התגובה חייבת להיבנות סביב משחק המילים - הוא הכוכב."
}

כללים קריטיים:
- עברית ישראלית טבעית בלבד. ביטויים, סלנג, קיצורים - הכל מותר ורצוי.
- אל תזכיר ערים או מקומות ספציפיים.
- הומור חם - צוחקים על המצב, לא על הבן אדם.
- כל תגובה: 1-3 משפטים מקסימום. אם אפשר לסגור את זה במשפט אחד מושלם - עדיף.
- הקרש: אם אין משחק מילים מבריק באמת - עדיף ללכת על אירוניה חכמה מאשר משחק מילים בינוני. איכות > כמות.
- גיוון: אל תחזור על אותם ביטויים או מבנים. כל תגובה צריכה להפתיע.
- החזר JSON תקין בלבד."""


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/generate", methods=["POST"])
def generate():
    data = request.get_json()
    complaint = data.get("complaint", "").strip()

    if not complaint:
        return jsonify({"error": "אנא הכנס תלונה"}), 400

    if len(complaint) > 500:
        return jsonify({"error": "התלונה ארוכה מדי, עד 500 תווים"}), 400

    try:
        response = model.generate_content(
            f"{SYSTEM_PROMPT}\n\nהתלונה של המשתמש: \"{complaint}\""
        )
        text = response.text.strip()
        # Clean potential markdown wrapping
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

        result = json.loads(text)

        # Validate structure
        for key in ("rating", "rating_text", "cynic", "philosopher", "keresh"):
            if key not in result:
                return jsonify({"error": "תשובה לא תקינה, נסה שוב"}), 500

        result["rating"] = max(1, min(5, int(result["rating"])))
        return jsonify(result)

    except json.JSONDecodeError:
        return jsonify({"error": "לא הצלחתי לעבד את התשובה, נסה שוב"}), 500
    except Exception as e:
        return jsonify({"error": f"שגיאה: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
