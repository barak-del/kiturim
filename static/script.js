document.addEventListener("DOMContentLoaded", () => {
    const complaint = document.getElementById("complaint");
    const charCount = document.getElementById("charCount");
    const submitBtn = document.getElementById("submitBtn");
    const loading = document.getElementById("loading");
    const loadingText = document.getElementById("loadingText");
    const results = document.getElementById("results");
    const resetBtn = document.getElementById("resetBtn");
    const shareBtn = document.getElementById("shareBtn");

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
        const rating = data.rating || 3;

        // Stars
        let starsHtml = "";
        for (let i = 1; i <= 5; i++) {
            starsHtml += `<span class="star ${i <= rating ? 'star-filled' : 'star-empty'}">${i <= rating ? '★' : '☆'}</span>`;
        }
        meterStars.innerHTML = starsHtml;

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

        const stars = "★".repeat(lastResult.rating) + "☆".repeat(5 - lastResult.rating);
        const text = [
            "💨 *קיטורים* by Barak Markov",
            "",
            `*התלונה:* ${complaint.value.trim()}`,
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
