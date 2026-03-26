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
    shareBtn.addEventListener("click", async () => {
        shareBtn.disabled = true;
        shareBtn.textContent = "...מכין תמונה";

        // Remember which cards were open
        const cards = document.querySelectorAll(".response-card");
        const wasOpen = Array.from(cards).map(c => c.classList.contains("open"));

        try {
            // Open all cards and force-show content
            cards.forEach(card => {
                card.classList.add("open");
                const body = card.querySelector(".card-body");
                if (body) body.style.maxHeight = "500px";
            });

            // Hide buttons and hints
            const actionBtns = document.querySelector(".action-buttons");
            const hints = document.querySelectorAll(".card-tap-hint, .card-chevron");
            actionBtns.style.display = "none";
            hints.forEach(h => h.style.display = "none");

            // Add branding header temporarily
            const brandEl = document.createElement("div");
            brandEl.id = "share-brand";
            brandEl.style.cssText = "text-align:center;padding:16px 0 8px;";
            brandEl.innerHTML = '<div style="font-size:1.8rem;font-weight:900;color:#f0a07a;font-family:Rubik,sans-serif;">קיטורים</div><div style="font-size:0.75rem;color:#999;font-family:Rubik,sans-serif;">by Barak Markov</div>';
            results.insertBefore(brandEl, results.firstChild);

            // Add footer temporarily
            const footerEl = document.createElement("div");
            footerEl.id = "share-footer";
            footerEl.style.cssText = "text-align:center;padding:12px 0 16px;border-top:1px dashed #ddd;font-size:0.8rem;color:#aaa;font-family:Rubik,sans-serif;";
            footerEl.textContent = "kiturim.onrender.com";
            results.appendChild(footerEl);

            await new Promise(resolve => setTimeout(resolve, 400));

            const canvas = await html2canvas(results, {
                backgroundColor: "#FFF9F5",
                scale: 2,
                useCORS: true,
            });

            // Cleanup temporary elements
            brandEl.remove();
            footerEl.remove();
            actionBtns.style.display = "";
            hints.forEach(h => h.style.display = "");
            cards.forEach((card, i) => {
                if (!wasOpen[i]) card.classList.remove("open");
                const body = card.querySelector(".card-body");
                if (body) body.style.maxHeight = "";
            });

            const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
            const file = new File([blob], "kiturim.png", { type: "image/png" });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: "קיטורים",
                    text: "תראו מה קיבלתי באפליקציית קיטורים 😂",
                });
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "kiturim.png";
                a.click();
                URL.revokeObjectURL(url);

                const whatsappText = encodeURIComponent("תראו מה קיבלתי באפליקציית קיטורים 😂\nhttps://kiturim.onrender.com");
                window.open(`https://wa.me/?text=${whatsappText}`, "_blank");
            }
        } catch (err) {
            // Cleanup on error too
            const brandEl = document.getElementById("share-brand");
            const footerEl = document.getElementById("share-footer");
            if (brandEl) brandEl.remove();
            if (footerEl) footerEl.remove();
            document.querySelector(".action-buttons").style.display = "";
            document.querySelectorAll(".card-tap-hint, .card-chevron").forEach(h => h.style.display = "");
            cards.forEach((card, i) => {
                if (!wasOpen[i]) card.classList.remove("open");
                const body = card.querySelector(".card-body");
                if (body) body.style.maxHeight = "";
            });
            if (err.name !== "AbortError") {
                showError("לא הצלחתי לשתף, נסה שוב");
            }
        } finally {
            shareBtn.disabled = false;
            shareBtn.textContent = "שתף בוואטסאפ 📲";
        }
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
