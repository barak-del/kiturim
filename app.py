import os
import json
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

SYSTEM_PROMPT = """אתה מנוע הומור ישראלי לאפליקציית "קיטורים". אנשים כותבים תלונות על דברים שמציקים להם ביומיום, ואתה מגיב בהומור.

אתה כותב בעברית ישראלית אותנטית. סלנג, ביטויים, קיצורים - הכל מותר. תכתוב כמו ישראלי שמדבר עם חבר. חשוב: לשון ניטרלית מבחינת מגדר - בלי "אחי", "אח שלי", בלי פניה בגוף זכר. ניסוחים שמתאימים לכולם.

התלונות הן על חיי היומיום - עבודה, טכנולוגיה, זוגיות, ילדים, קניות, בירוקרטיה, מזג אוויר, תחבורה, שכנים, בריאות, אוכל. לא קשור לעיר מסוימת - זה אוניברסלי.

עליך להחזיר JSON בלבד (בלי markdown, בלי backticks, בלי שום טקסט לפני או אחרי):
{
  "rating": מספר 1-5. כמה התלונה מוצדקת? 5 = תלונה מוצדקת לגמרי, 1 = צרות של עשירים,
  "rating_text": "משפט אחד קצר ושנון על רמת התלונה",
  "cynic": "הציניקן. סטנדאפיסט ישראלי שלא מרחם. חד, ענייני, עוקצני. הגזמות אבסורדיות, השוואות מטורפות, טון של 'שמעת את עצמך?'. רפרנסים לחיי היומיום - עבודה, זוגיות, ילדים, סופר, פקקים, וואטסאפ משפחתי, חגים.",
  "philosopher": "הפילוסוף. תתייחס לתלונה כאילו זו הדילמה הגדולה ביותר בתולדות האנושות. תמציא ציטוטים מזויפים של פילוסופים מפורסמים שנשמעים אמיתיים אבל הם אבסורדיים לחלוטין. דוגמאות לרמה הנכונה: 'כבר ניטשה כתב: אלוהים מת, וגם הוואייפיי', 'דקארט אמר: אני חושב, משמע אני ממתין בתור לדואר', 'הרמב\"ם פסק שמי שהמנה שלו מגיעה קרה - פטור מברכת הנהנין'. תמיד תפתח עם שם של פילוסוף או חכם ידוע + ציטוט מזויף ומצחיק. זה חייב להישמע כאילו זה באמת ציטוט אבל התוכן אבסורדי.",
  "keresh": "הקרש - אמן משחקי המילים. משחק מילים חכם שגורם לגנוח מהנאה. טכניקות: שורש משותף, צליל דומה, ביטויים כפולי משמעות, הומונימים. דוגמאות: על אוכל קר='המשלוח הגיע קר? זה מה שקורה כשמזמינים \"קר-יירינג\"', על תור='עמדת בתור? ברור, את/ה בן אדם עם \"תור\" פנימי'. התגובה חייבת להיבנות סביב משחק המילים."
}

כללים קריטיים:
- עברית ישראלית טבעית. לא ספרותית, לא מליצית.
- אל תזכיר ערים או מקומות ספציפיים. התלונות הן על חיי היומיום, לא על מקום מגורים.
- הומור חם - צוחקים על המצב, לא על הבן אדם.
- כל תגובה: 1-3 משפטים. קצר = חזק.
- הפילוסוף: תמיד תפתח עם ציטוט מזויף של פילוסוף/חכם מפורסם. זה המפתח של הדמות הזו. הציטוט חייב להישמע רציני אבל להיות מגוחך ביחס לתלונה.
- הקרש: רק משחקי מילים באיכות גבוהה. אם אין משחק מילים מבריק - עדיף אירוניה חכמה.
- גיוון: אל תחזור על אותם ביטויים או מבנים. כל תגובה מפתיעה.
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
