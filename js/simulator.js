// Simulator & Ask the Rabbi Logic

class HatanSimulator {
    constructor() {
        this.currentScenarioIndex = 0;
        this.chatContainer = null;
        this.optionsContainer = null;
        this.faqContainer = null;
    }

    init(chatId, optionsId, faqId) {
        this.chatContainer = document.getElementById(chatId);
        this.optionsContainer = document.getElementById(optionsId);
        this.faqContainer = document.getElementById(faqId);
        
        this.resetRoleplay();
        this.renderFAQs();
    }

    // --- Roleplay Simulator ---
    
    resetRoleplay() {
        if (!this.chatContainer || !this.optionsContainer) return;
        
        this.currentScenarioIndex = 0;
        this.chatContainer.innerHTML = "";
        this.optionsContainer.innerHTML = "";
        
        this.addMessage("system", "הסימולטור מופעל. כאן תוכל לתרגל תרחישים אמיתיים מחיי הנישואין.");
        this.loadScenario(this.currentScenarioIndex);
    }

    addMessage(sender, text) {
        if (!this.chatContainer) return;
        
        const msg = document.createElement("div");
        msg.className = `chat-message ${sender}`;
        msg.innerHTML = text.replace(/\n/g, "<br>");
        
        this.chatContainer.appendChild(msg);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    loadScenario(index) {
        if (index >= SIMULATOR_SCENARIOS.length) {
            this.addMessage("system", "כל הכבוד! סיימת את כל תרחישי התקשורת בסימולטור בהצלחה. אתה מוכן לבנות קשר בריא ומכבד!");
            this.optionsContainer.innerHTML = `
                <button class="btn" onclick="app.simulator.resetRoleplay()">התחל סימולטור מחדש</button>
            `;
            return;
        }

        const scenario = SIMULATOR_SCENARIOS[index];
        this.addMessage("bot", `<strong>סיטואציה זוגית:</strong><br>${scenario.prompt}`);
        
        this.optionsContainer.innerHTML = "";
        
        scenario.options.forEach((opt, optIndex) => {
            const card = document.createElement("div");
            card.className = "chat-option-card";
            card.innerText = opt.text;
            card.addEventListener("click", () => this.handleOptionSelect(index, optIndex));
            this.optionsContainer.appendChild(card);
        });
    }

    handleOptionSelect(scenarioIndex, optionIndex) {
        const scenario = SIMULATOR_SCENARIOS[scenarioIndex];
        const selected = scenario.options[optionIndex];

        // Disable options during animation
        this.optionsContainer.innerHTML = "";

        // Print user choice
        this.addMessage("user", selected.text);

        // Simulated thinking and bot reply
        setTimeout(() => {
            let feedbackClass = selected.success ? "success" : "error";
            let feedbackText = selected.success ? 
                `<strong>מעולה! תגובה נכונה:</strong><br>${selected.feedback}` : 
                `<strong>פחות מומלץ. בוא נבין למה:</strong><br>${selected.feedback}`;
            
            this.addMessage("bot", feedbackText);
            
            // Show next steps
            setTimeout(() => {
                if (selected.success) {
                    this.currentScenarioIndex++;
                    this.optionsContainer.innerHTML = `
                        <button class="btn" id="next-scen-btn">עבור לסיטואציה הבאה <i class="fas fa-arrow-left"></i></button>
                    `;
                    document.getElementById("next-scen-btn")?.addEventListener("click", () => {
                        this.loadScenario(this.currentScenarioIndex);
                    });
                } else {
                    this.optionsContainer.innerHTML = `
                        <button class="btn btn-secondary" id="retry-scen-btn">נסה שוב תרחיש זה <i class="fas fa-undo"></i></button>
                    `;
                    document.getElementById("retry-scen-btn")?.addEventListener("click", () => {
                        // Clear last bot & user messages from visual but just reload options
                        this.chatContainer.innerHTML = "";
                        this.addMessage("system", "מנסים שוב את התרחיש...");
                        this.loadScenario(this.currentScenarioIndex);
                    });
                }
            }, 600);
        }, 800);
    }

    // --- Ask the Rabbi ---

    renderFAQs(filteredData = FAQ_DATA) {
        if (!this.faqContainer) return;
        this.faqContainer.innerHTML = "";

        if (filteredData.length === 0) {
            this.faqContainer.innerHTML = `
                <div class="card" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-info-circle" style="font-size: 2rem; color: var(--primary); margin-bottom: 1rem;"></i>
                    <p>לא נמצאו שאלות תואמות. הקלד שאלה אחרת או פנה למדריך החתנים או לרב שלך.</p>
                </div>
            `;
            return;
        }

        filteredData.forEach(item => {
            const faqItem = document.createElement("div");
            faqItem.className = "faq-item";
            
            faqItem.innerHTML = `
                <div class="faq-question">
                    <span>${item.question}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="faq-answer">
                    <p>${item.answer}</p>
                </div>
            `;

            faqItem.querySelector(".faq-question").addEventListener("click", () => {
                faqItem.classList.toggle("open");
            });

            this.faqContainer.appendChild(faqItem);
        });
    }

    searchFAQs(query) {
        if (!query.trim()) {
            this.renderFAQs(FAQ_DATA);
            return;
        }

        const q = query.toLowerCase();
        const filtered = FAQ_DATA.filter(item => 
            item.question.toLowerCase().includes(q) || 
            item.answer.toLowerCase().includes(q)
        );

        this.renderFAQs(filtered);
    }

    // Simulate custom questions typing
    handleCustomQuestion(questionText, chatOutputId) {
        const out = document.getElementById(chatOutputId);
        if (!out || !questionText.trim()) return;

        out.innerHTML = `
            <div class="chat-message user">${questionText}</div>
            <div class="chat-message bot id="bot-thinking">הרב חושב על תשובה...</div>
        `;
        out.scrollTop = out.scrollHeight;

        // Simple keywords analysis
        const text = questionText.toLowerCase();
        let answer = "";

        if (text.includes("כאב") || text.includes("כואב") || text.includes("לכאוב")) {
            answer = "שלום חתן יקר. מובן לגמרי החשש מכאב. יחסי אישות ראשונים עלולים לגרור רגישות או כאב קל אצל הכלה עקב מתיחת קרום הבתולים. אולם, בעבודה עדינה ביותר, הדרגתיות, משחק מקדים ארוך שמעורר את האישה, ושימוש נדיב ב- <strong>חומר סיכוך על בסיס מים</strong>, הכאב כמעט ולא יורגש. אם הכלה מביעה כאב עז - יש לעצור מיד, לחבק, להרגיע ולא לפעול בכוח בשום אופן. זכור: עונתה ורצונה קודמים לכל.";
        } else if (text.includes("דם") || text.includes("בתולים") || text.includes("נאסרים")) {
            answer = "שלום לך. הלכת דם בתולים קובעת שלאחר ביאה ראשונה בה היה מגע מלא (חדירה), בני הזוג נאסרים זה לזו מיד, בין אם ראו דם בפועל ובין אם לאו (חזקת דם בתולים). מנקודה זו מתנהגים כבכל ימי הנידה. ממתינים 4 או 5 ימים, עושים הפסק טהרה, שבעה נקיים וטובלים. אין להילחץ מכך, זהו חלק מהמסלול ההלכתי של כל זוג יהודי.";
        } else if (text.includes("זקפה") || text.includes("איבר") || text.includes("לחץ") || text.includes("מתרגש")) {
            answer = "ברכה והצלחה. חוסר זקפה או אובדן זקפה בלילה הראשון נפוצים ביותר עקב רמת מתח, עייפות עצומה מהחתונה, וחששות טבעיים. דע שאין פה שום בעיה בריאותית. הדרך לפתור זאת היא להוריד את רמת הציפיות - אל תתחייבו לקיים יחסים מלאים בלילה הראשון. תתרכזו בשיחה, חיבוק, ליטוף הדדי וחיבור עדין. ברגע שהלחץ יירד והקרבה תתחזק, הגוף יגיב בטבעיות.";
        } else if (text.includes("סיכוך") || text.includes("חומר")) {
            answer = "שלום חתן. חומר סיכוך על בסיס מים הוא כלי עזר מצוין וחשוב מאוד, במיוחד לפעמים הראשונות. הוא הופך את המגע לחלק ונעים יותר ומונע פציעות וכאבים. מותר להשתמש בו ללא שום חשש הלכתי. מומלץ לקנות בקבוקון בבית מרקחת מראש ולשים בתיק האישי לליל הכלולות.";
        } else if (text.includes("כתם") || text.includes("ראייה") || text.includes("תחתונים")) {
            answer = "שלום וברכה. הלכות כתמים הן מורכבות ומלאות פרטים. הכלל הבסיסי הוא שלא כל כתם אוסר. הדבר תלוי בגודל הכתם, סוג הבגד (צבעוני או לבן), והמקום בו נמצא. הנחיה מעשית: אם נמצא כתם, אין לאסור את עצמכם לבד. הראו את הכתם לרב פוסק מומחה והוא יורה לכם אם מדובר בכתם אוסר או מותר. השתדלו שהכלה תלבש תחתונים צבעוניים (לא לבנים) בימים שאינם שבעה נקיים כדי להימנע מבעיות כתמים.";
        } else {
            answer = "שלום חתן יקר וישר כוח על השאלה. שאלה זו חשובה מאוד. באופן כללי, כל עניין של ספק או חשש הלכתי ורפואי בחיי הנישואין מומלץ להעלות בפני רב מורה הוראה המבין בתחום זה או בפני מדריך החתנים שלך. זכור שהכול צריך להיעשות מתוך שלום בית, סבלנות הדדית וקדושה. אם תרצה לפרט יותר, אנסה לענות לך.";
        }

        setTimeout(() => {
            const thinking = document.getElementById("bot-thinking");
            if (thinking) thinking.remove();
            
            const botMsg = document.createElement("div");
            botMsg.className = "chat-message bot";
            botMsg.innerHTML = answer;
            out.appendChild(botMsg);
            out.scrollTop = out.scrollHeight;
        }, 1200);
    }
}

// Export for app.js
window.HatanSimulator = HatanSimulator;
