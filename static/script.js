document.addEventListener("DOMContentLoaded", () => {
    const complaint = document.getElementById("complaint");
    const charCount = document.getElementById("charCount");
    const submitBtn = document.getElementById("submitBtn");
    const loading = document.getElementById("loading");
    const loadingText = document.getElementById("loadingText");
    const results = document.getElementById("results");
    const resetBtn = document.getElementById("resetBtn");
    const shareBtn = document.getElementById("shareBtn");

    const coffeeFill = document.getElementById("coffeeFill");
    const foam = document.getElementById("foam");
    const meterScore = document.getElementById("meterScore");
    const meterStars = document.getElementById("meterStars");
    const meterText = document.getElementById("meterText");

    const cynicText = document.getElementById("cynicText");
    const philosopherText = document.getElementById("philosopherText");
    const kereshText = document.getElementById("kereshText");

    const loadingMessages = [
        "...מנתח את רמת התלונה",
        "...מייצר ציניות ברמה גבוהה",
        "...מחפש משחקי מילים גרועים",
        "...מתפלסף על הקיום שלך",
        "...מגלגל עיניים דיגיטליות",
        "...מחשב כמה זה באמת נורא",
        "...מכין תגובה שתעלה חיוך",
    ];

    // Character counter
    complaint.addEventListener("input", () => {
        charCount.textContent = complaint.value.length;
    });

    // Submit on Enter (with Ctrl/Cmd)
    complaint.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submitBtn.click();
        }
    });

    // Submit
    submitBtn.addEventListener("click", async () => {
        const text = complaint.value.trim();
        if (!text) {
            showError("כתוב משהו שמציק לך קודם!");
            return;
        }

        // Show loading
        submitBtn.disabled = true;
        results.classList.add("hidden");
        loading.classList.remove("hidden");

        // Cycle loading messages
        let msgIndex = 0;
        const msgInterval = setInterval(() => {
            msgIndex = (msgIndex + 1) % loadingMessages.length;
            loadingText.textContent = loadingMessages[msgIndex];
        }, 1500);

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ complaint: text }),
            });

            const data = await response.json();

            if (data.error) {
                showError(data.error);
                return;
            }

            // Show results
            showResults(data);
        } catch (err) {
            showError("משהו השתבש, נסה שוב");
        } finally {
            clearInterval(msgInterval);
            loading.classList.add("hidden");
            submitBtn.disabled = false;
        }
    });

    function showResults(data) {
        lastResult = data;
        // Coffee fill animation - rating 1-5 maps to fill level
        const rating = data.rating || 3;
        // y goes from 130 (empty) to 32 (full). Each level = ~20px
        const fillY = 130 - (rating * 20);
        coffeeFill.setAttribute("y", fillY);

        // Show foam for ratings >= 4
        if (rating >= 4) {
            foam.classList.remove("hidden");
            foam.classList.add("visible");
        } else {
            foam.classList.add("hidden");
            foam.classList.remove("visible");
        }

        // Score
        meterScore.innerHTML = `${rating} <span>/ 5</span>`;

        // Stars
        const fullStar = "☕";
        const emptyStar = "·";
        meterStars.textContent = fullStar.repeat(rating) + emptyStar.repeat(5 - rating);

        // Meter text
        meterText.textContent = data.rating_text || "";

        // Response texts
        cynicText.textContent = data.cynic || "";
        philosopherText.textContent = data.philosopher || "";
        kereshText.textContent = data.keresh || "";

        // Show results section
        results.classList.remove("hidden");

        // Scroll to results
        setTimeout(() => {
            results.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    }

    // Reset
    resetBtn.addEventListener("click", () => {
        results.classList.add("hidden");
        complaint.value = "";
        charCount.textContent = "0";

        // Reset coffee
        coffeeFill.setAttribute("y", "130");
        foam.classList.add("hidden");
        foam.classList.remove("visible");

        // Close all cards
        document.querySelectorAll(".response-card.open").forEach(card => {
            card.classList.remove("open");
        });

        complaint.focus();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Share on WhatsApp
    let lastResult = null;

    shareBtn.addEventListener("click", () => {
        if (!lastResult) return;

        const stars = "⭐".repeat(lastResult.rating) + "☆".repeat(5 - lastResult.rating);
        const text = [
            "💨 *קיטורים* by Barak Markov",
            "",
            `*מד התלונה:* ${stars} (${lastResult.rating}/5)`,
            lastResult.rating_text,
            "",
            `😼 *הציניקן:*`,
            lastResult.cynic,
            "",
            `🦉 *הפילוסוף:*`,
            lastResult.philosopher,
            "",
            `🪵 *הקרש:*`,
            lastResult.keresh,
            "",
            "---",
            "נסו גם! 👇",
            "https://kiturim.onrender.com",
        ].join("\n");

        const encoded = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encoded}`, "_blank");
    });

    // Error toast
    function showError(message) {
        // Remove existing toast
        const existing = document.querySelector(".error-toast");
        if (existing) existing.remove();

        const toast = document.createElement("div");
        toast.className = "error-toast";
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.classList.add("visible");
            });
        });

        setTimeout(() => {
            toast.classList.remove("visible");
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
});
