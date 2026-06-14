// Hatan Digital AI Assistant - Privacy-First Intimacy & Relationship Advisor

class HatanAi {
    constructor(appInstance) {
        this.app = appInstance;
        this.apiKey = SafeStorage.getItem("hatan_gemini_api_key") || "";
        this.chatHistory = [];
        this.localKnowledge = this.initLocalKnowledge();
    }

    setApiKey(key) {
        this.apiKey = key.trim();
        if (this.apiKey) {
            SafeStorage.setItem("hatan_gemini_api_key", this.apiKey);
        } else {
            SafeStorage.removeItem("hatan_gemini_api_key");
        }
    }

    getApiKey() {
        return this.apiKey;
    }

    // Comprehensive Q&A database for offline/local mode
    initLocalKnowledge() {
        return [
            {
                keywords: ["כאב", "כואב", "לילה הראשון", "חדירה", "מגע פיזי", "קושי פיזי", "ראשון", "דם בתולים", "בתולים"],
                title: "התמודדות עם כאב או קושי פיזי בלילה הראשון ובמגע אינטימי",
                content: `<strong>חשוב לדעת: מגע אינטימי צריך להיות נעים ומשמח עבור שניכם. אין שום מקום לכאב או לחץ.</strong>

1. **הדרגתיות וסבלנות:** הלילה הראשון (ולעיתים גם השבועות הראשונים) נועד ליצירת קרבה רגשית, חיבוק, ליטוף ותחושת ביטחון. אין שום חובה הלכתית או מוסרית להגיע לחדירה מלאה בלילה הראשון. לכו בקצב של הכלה בלבד.
2. **חומר סיכוך על בסיס מים:** זהו כלי חיוני ביותר! שימוש נדיב בחומר סיכוך על בסיס מים (הוא כשר לחלוטין ואינו מהווה חציצה) מפחית משמעותית את החיכוך והכאב ומקל על המגע הראשוני.
3. **משחק מקדים (Foreplay):** הגוף של האישה זקוק לזמן כדי להתכונן פיזית. עוררו אינטימיות וחיבה באמצעות מילים טובות, חיבוקים ונשיקות. אל תמהרו למגע ישיר לפני שהיא רגועה ומוכנה לחלוטין.
4. **עצירה בכל שלב:** אם אשתך מביעה כאב או אי-נוחות - עצור מיד! שאל אותה בעדינות מה היא מרגישה, וחזרו למגע מרגיע ולא מאיים. הביטחון שהיא תרגיש בכך שאתה קשוב לה יפחית את הכיווץ השרירי (וגיניזמוס) ויקל על המגע הבא.`
            },
            {
                keywords: ["חרדה", "לחץ", "חרדת ביצוע", "זקפה", "לא עומד", "לחץ בלילה הראשון", "נכשל", "פחד"],
                title: "התמודדות עם חרדת ביצוע, לחץ או קושי בזקפה אצל החתן",
                content: `<strong>דע לך: לחץ וחרדת ביצוע הם התופעה הנפוצה ביותר אצל חתנים טריים. אתה לא לבד, וזה נורמלי לחלוטין!</strong>

1. **הורדת ציפיות:** התרבות המודרנית מייצרת מצג שווא שהכל צריך לעבוד בצורה מושלמת מהרגע הראשון. בהלכה וברגש היהודי, המטרה בלילה הראשון היא חיבור, חום רגשי ובניית אמון - לא ביצועים פיזיים.
2. **השפעת הלחץ על הגוף:** מבחינה פיזיולוגית, לחץ וחרדה מפרישים אדרנלין שמכווץ כלי דם ומונע זקפה באופן מיידי. זהו מנגנון הישרדותי תקין של הגוף. ברגע שהלחץ יירד - הגוף יגיב מחדש.
3. **התמקדות בקשר רגשי:** אם אתה מרגיש שהזקפה נחלשת או נעלמת, אל תיכנס ללחץ. אמור לאשתך שאתה מתרגש ושאתה פשוט רוצה לחבק אותה. התמקדו בליטופים, נשיקות ושיחה נעימה. החום והביטחון יחזירו את הרגיעה.
4. **דברו על זה:** שיתוף עדין ברגשות ("אני קצת מתרגש ולחוץ, אבל כל כך שמח להיות איתך") מוריד את חומת המבוכה באופן מיידי ומקרב ביניכם.`
            },
            {
                keywords: ["חומר סיכוך", "ג'ל", "סיכוך", "יובש", "חיכוך", "שמן"],
                title: "שימוש בחומרי סיכוך והיבטים הלכתיים",
                content: `<strong>שימוש בחומר סיכוך מומלץ מאוד לכל זוג בתחילת דרכו כדי להבטיח מגע נעים וללא כאבים.</strong>

1. **סוג החומר:** יש להשתמש **אך ורק בחומר סיכוך על בסיס מים** (Water-based lubricant). חומרים על בסיס שמן או סיליקון עלולים לגרום לגירויים, להרוס קונדומים (במידה ומשתמשים למניעה רפואית) והם קשים לשטיפה.
2. **היבט הלכתי:** חומר סיכוך על בסיס מים אינו מהווה חציצה (כיוון שהוא נשטף בקלות ואינו נספג כדבר קבוע), והשימוש בו מותר וכשר לחלוטין לכל הדעות לצורך מניעת כאב והנאה משותפת.
3. **אופן השימוש:** מרחו כמות נדיבה על איבר המין של החתן ועל פתח הנרתיק של הכלה לפני המגע ובמהלכו לפי הצורך.`
            },
            {
                keywords: ["ויכוח", "ריב", "כועס", "שלום בית", "תקשורת", "מריבה", "צעקות", "אי הבנה"],
                title: "ניהול תקשורת זוגית נכונה בזמן ויכוח או כעס",
                content: `<strong>ויכוחים הם חלק טבעי מכל קשר זוגי בריא. הסוד הוא לדעת כיצד לנהל אותם מבלי לפגוע בקשר.</strong>

1. **טכניקת 'הקשבה פעילה' (שיקוף):** כשאשתך מדברת, אל תתכנן את התשובה שלך. הקשב, ואז שקף לה את מה שהבנת: *"אני שומע שפגע בי שהלכתי בלי להגיד, ושאת מרגישה שלא התחשבתי בך. הבנתי נכון?"*. השיקוף מעניק לה תחושה שהיא נשמעת ומפחית את הכעס מיידית.
2. **דיבור בגוף ראשון (I statements):** במקום להאשים: *"את תמיד כועסת ולא מבינה!"*, אמור: *"אני מרגיש לחוץ ומבולבל כשאנחנו מדברים בטונים גבוהים, והייתי רוצה שננסה לדבר בשקט"*.
3. **פסק זמן יזום:** אם הרוחות סוערות מדי, מותר ואף רצוי לקחת פסק זמן קצר. אמור: *"הקשר שלנו חשוב לי מאוד ואני רוצה שנדבר על זה ברצינות, אבל כרגע אני מוצף. בואי ניקח חצי שעה להירגע ואז נשב לדבר"*.
4. **שלום בית קודם לצדק:** נישואין הם לא בית משפט. המטרה היא לא להיות צודק, אלא להיות ביחד. ויתור וענווה מתוך אהבה הם סוד שלום הבית.`
            },
            {
                keywords: ["פערים בחשק", "חשק", "פער", "לא רוצה", "קרירות", "אינטימיות רגשית"],
                title: "התמודדות עם פערים בחשק המיני בין הבעל לאישה",
                content: `<strong>פערים ברמת החשק המיני קיימים אצל רוב הזוגות בשלב זה או אחר. מפתח הפתרון טמון בהבנת המנגנון והשקעה בקשר הרגשי.</strong>

1. **הבדלים פיזיולוגיים ורגשיים:** אצל גברים רבים החשק הוא "ספונטני" וממוקד פיזית. אצל נשים רבות, החשק הוא "תגובתי" ומתעורר בעיקר בעקבות אינטימיות רגשית, שיחה עמוקה, מחמאות ותחושת ביטחון ופינוק לאורך היום.
2. **אינטימיות ללא מטרה פיזית:** אל תהפוך כל חיבוק או נשיקה לניסיון להגיע למגע מלא. תן לאשתך חיבוקים חמים, עיסוי או מילים טובות מבלי לצפות לכלום בתמורה. הדבר יסיר ממנה את תחושת הלחץ ויאפשר לחשק שלה להתעורר בטבעיות.
3. **יצירת אווירה נינוחה:** עייפות, עומס בעבודה, לחץ כלכלי או משפחתי מכבים את החשק באופן מיידי. עזור לה במטלות הבית, תכנן זמן זוגי שקט (יציאה משותפת), ודאג שהיא תרגיש אהובה ומוערכת גם בלי קשר לחדר המיטות.
4. **שיחה פתוחה ללא אשמה:** שוחחו על כך בזמן רגוע (לא בחדר השינה). שאל אותה: *"מה גורם לך להרגיש קרובה אליי?"*, *"איך אוכל לעזור לך להרגיש רגועה ומוכנה יותר למגע?"*`
            },
            {
                keywords: ["שבעה נקיים", "הפסק", "בדיקות", "כתם", "מתי מקווה", "שקיעה"],
                title: "כללים קצרים ומעודדים לשבעה נקיים ובדיקות טהרה",
                content: `<strong>ימי השבעה נקיים נועדו להעביר אתכם מתקופת הריחוק לקרבה מתוך שמחה וציפייה.</strong>

1. **הפסק טהרה:** מבוצע ביום שהדימום פסק לחלוטין, לפני שקיעת החמה. יש לרחוץ היטב את האזור ולבצע בדיקה יסודית בבד לבן.
2. **הבדיקות במהלך 7 הימים:** ההלכה דורשת לבצע בדיקה אחת בבוקר ואחת לפני שקיעה בכל יום. עם זאת, בדיעבד, אם נעשתה בדיקה ביום הראשון וביום השביעי בלבד - הספירה כשרה.
3. **התמודדות עם כתמים:** אם נמצא כתם צבעוני על הבגד או על הבד, **לא להחליט לבד שהכל נהרס!** הלכות כתמים הן מורכבות ומלאות הקלות (כתם על בגד צבעוני אינו מטמא, כתם קטן מגריס אינו מטמא ועוד). פנו מיד לרב או יועצת טהרה להצגת השאלה בדיסקרטיות.`
            }
        ];
    }

    // Dynamic Context Builder: Gathers lesson text and uploaded booklets info
    buildSystemContext() {
        let context = "You are the 'Hatan-Guide' AI Assistant, a highly professional, sensitive, and knowledgeable advisor for newly married Jewish grooms. ";
        context += "Your purpose is to answer questions about marriage, communication, Shalom Bayit, intimacy, sexuality, and Halachic purity (Taharat Hamishpacha).\n\n";
        
        context += "### KEY GUIDELINES FOR YOUR BEHAVIOR:\n";
        context += "1. Respond with warmth, sensitivity, and absolute respect. Avoid vulgarity; use mature, clean, and explicit Hebrew anatomical and relational terminology suitable for an orthodox or traditional groom.\n";
        context += "2. **Privacy Assurance**: Remind the user that their questions are private.\n";
        context += "3. **Jewish/Halachic Alignment**: Respect Torah values, Shalom Bayit (domestic peace), and Jewish purity laws, but emphasize that physical intimacy is a holy, healthy, and pleasurable part of marriage, and should never involve pain or coercion.\n";
        context += "4. **Always recommend Water-Based Lubricants** for initial discomfort, and highlight that it is kosher and permitted.\n";
        context += "5. Encourage couples to proceed gradually, highlighting that reaching full intercourse can take days or weeks and is completely normal.\n";
        context += "6. In case of severe physical pain or persistent emotional distress, advise consulting a physician or a certified couple therapist.\n\n";

        // Inject Lessons Information
        context += "### AVAILABLE WEBSITE LESSONS CONTENT:\n";
        if (window.LESSONS_DATA && Array.isArray(window.LESSONS_DATA)) {
            window.LESSONS_DATA.forEach(les => {
                context += `- Lesson ${les.id}: "${les.title}". Content Summary: ${les.content.replace(/<[^>]*>/g, ' ').substring(0, 400)}...\n`;
            });
        } else {
            context += "- Default lessons cover: Couple communication, emotional differences, preparation for the wedding night, anatomy, intimacy techniques, and Halachic calculations.\n";
        }
        context += "\n";

        // Inject Booklets Information
        context += "### AVAILABLE PDF BOOKLETS IN LIBRARY:\n";
        if (this.app && this.app.booklets && Array.isArray(this.app.booklets)) {
            this.app.booklets.forEach(bk => {
                context += `- Booklet: "${bk.title}". Category: ${bk.category}. Description: ${bk.description}\n`;
            });
        } else {
            context += "- Booklets cover: Intimacy guides, Halachic cycle calculations, physical stamina, and touches/massage techniques.\n";
        }
        context += "\n";

        context += "Please answer the user's question in Hebrew, using formatting (markdown, bold text) for readability. Keep it concise, practical, and encouraging.";
        return context;
    }

    // Client-side Semantic Matcher for Offline/Local mode
    searchLocalKnowledge(query) {
        const cleanedQuery = query.toLowerCase().trim();
        if (!cleanedQuery) return null;

        // Tokenize query
        const queryWords = cleanedQuery.split(/[\s,.\-?\"']+/).filter(w => w.length > 1);

        let bestMatch = null;
        let highestScore = 0;

        // 1. Search in pre-seeded local Q&A database
        this.localKnowledge.forEach(item => {
            let score = 0;
            item.keywords.forEach(keyword => {
                if (cleanedQuery.includes(keyword)) {
                    score += 5; // Direct phrase/word match
                }
            });

            // Count shared words
            queryWords.forEach(word => {
                item.keywords.forEach(keyword => {
                    if (word === keyword) score += 2;
                });
                if (item.title.toLowerCase().includes(word)) score += 3;
                if (item.content.toLowerCase().includes(word)) score += 1;
            });

            if (score > highestScore && score >= 4) {
                highestScore = score;
                bestMatch = {
                    title: item.title,
                    content: item.content,
                    type: 'qa'
                };
            }
        });

        // 2. Search in Lessons Content full-text
        if (window.LESSONS_DATA && Array.isArray(window.LESSONS_DATA)) {
            window.LESSONS_DATA.forEach(les => {
                let score = 0;
                const lesTitle = les.title.toLowerCase();
                const lesContent = les.content.replace(/<[^>]*>/g, ' ').toLowerCase();

                queryWords.forEach(word => {
                    if (lesTitle.includes(word)) score += 4;
                    if (lesContent.includes(word)) score += 1;
                });

                if (score > highestScore && score >= 6) {
                    highestScore = score;
                    // Extract relevant snippet or show intro
                    bestMatch = {
                        title: `מתוך שיעור: ${les.title}`,
                        content: `שאלתך קשורה לחומר הנלמד ב**${les.title}**.<br><br>להלן קטע רלוונטי מהשיעור:<br><p style="font-style: italic; background: rgba(197, 168, 128, 0.05); padding: 10px; border-right: 3px solid var(--primary); margin: 10px 0;">${lesContent.substring(0, 600)}...</p><br>מומלץ מאוד לפתוח את לשונית "שיעורי ההדרכה" ולקרוא את השיעור המלא לקבלת מענה מקיף!`,
                        type: 'lesson',
                        lessonId: les.id
                    };
                }
            });
        }

        // 3. Search in Booklet descriptions
        if (this.app && this.app.booklets && Array.isArray(this.app.booklets)) {
            this.app.booklets.forEach(bk => {
                let score = 0;
                const bkTitle = bk.title.toLowerCase();
                const bkDesc = bk.description.toLowerCase();

                queryWords.forEach(word => {
                    if (bkTitle.includes(word)) score += 5;
                    if (bkDesc.includes(word)) score += 2;
                });

                if (score > highestScore && score >= 6) {
                    highestScore = score;
                    bestMatch = {
                        title: `חוברת מומלצת: ${bk.title}`,
                        content: `מצאתי את החוברת **"${bk.title}"** בספריית המדריכים שלך המתאימה במיוחד לשאלתך.<br><br>**תיאור החוברת:** ${bk.description}<br><br>מומלץ לגשת ללשונית "ספריית מדריכים (PDF)" ולפתוח את המדריך לקריאה מלאה ודיסקרטית.`,
                        type: 'booklet'
                    };
                }
            });
        }

        return bestMatch;
    }

    getEffectiveApiKey() {
        return this.apiKey || window.globalGeminiApiKey || "";
    }

    // Main query interface - routes to local matching or cloud Gemini API
    async ask(userQuestion) {
        // Record in history
        this.chatHistory.push({ role: 'user', text: userQuestion });

        const activeKey = this.getEffectiveApiKey();

        // If API key is configured, perform remote query
        if (activeKey) {
            try {
                return await this.askGemini(userQuestion, activeKey);
            } catch (e) {
                console.error("Gemini API failed, falling back to local database", e);
                return this.generateLocalResponse(userQuestion, true);
            }
        }

        // Default to local/offline response
        return this.generateLocalResponse(userQuestion, false);
    }

    // Handles local matching and constructs a nice response
    generateLocalResponse(query, apiFailed = false) {
        const match = this.searchLocalKnowledge(query);
        let prefix = "";
        if (apiFailed) {
            prefix = `<div style="font-size: 0.8rem; color: var(--error); margin-bottom: 8px; font-weight: 700;"><i class="fas fa-exclamation-circle"></i> שגיאה בחיבור לענן ה-AI. מעבר אוטומטי למצב מקומי מאובטח:</div>`;
        }

        if (match) {
            return prefix + `<h3>${match.title}</h3><br>${match.content}`;
        }

        // Fallback response if no keywords matched
        return prefix + `<h3>שלום חתן יקר!</h3>
<p>אני כאן כדי לעזור לך בכל שאלה בנושאי זוגיות, שלום בית, אינטימיות והלכות הבית היהודי.</p>
<p>שאלתך היא ייחודית, ובמצב המקומי (Offline) לא מצאתי מענה מדויק עבורה במאגר המקומי המהיר שלי.</p>
<p><strong>המלצות עבורך:</strong></p>
<ul>
    <li>נסה להשתמש במילים פשוטות יותר (כגון: *כאב*, *לחץ*, *חומר סיכוך*, *ויכוח*, *שבעה נקיים*).</li>
    <li>תוכל לקרוא בהרחבה ב**שיעורי ההדרכה** (במיוחד שיעור 4 ו-5 העוסקים באינטימיות פיזית ואנטומיה).</li>
    <li>תוכל לעיין ב**ספריית המדריכים (PDF)** המכילה חוברות הדרכה מפורטות ביותר.</li>
    <li>למענה חופשי ופתוח לכל שאלה, תוכל להזין מפתח API אישי של Gemini בהגדרות ה-AI (כפתור גלגל השיניים) כדי לחבר את הצ'אט לענן ה-AI בצורה מאובטחת.</li>
</ul>`;
    }

    // Fetch call to Gemini API using Google Generative Language endpoints
    async askGemini(query, apiKey) {
        const systemPrompt = this.buildSystemContext();
        
        // Build recent history for context (last 6 messages)
        const recentHistory = this.chatHistory.slice(-6).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: recentHistory,
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 1000
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
            const botText = data.candidates[0].content.parts[0].text;
            // Parse basic markdown to HTML for rendering
            const formattedText = this.formatMarkdown(botText);
            this.chatHistory.push({ role: 'model', text: formattedText });
            return formattedText;
        } else {
            throw new Error("Invalid response format from Gemini API");
        }
    }

    // Basic markdown formatter to make Gemini responses readable in browser
    formatMarkdown(text) {
        let html = text;
        // Escape HTML tags to prevent XSS except basic markup we introduce
        html = html.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
        
        // Bullet lists
        html = html.replace(/^\s*-\s+(.*?)$/gm, "<li>$1</li>");
        html = html.replace(/(<li>.*?<\/li>)/gs, "<ul>$1<\/ul>");
        // Fix nested ul tags
        html = html.replace(/<\/ul>\s*<ul>/g, "");

        // Headings
        html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
        html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
        html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");

        // Paragraphs / Newlines
        html = html.replace(/\n\n/g, "<br><br>");
        html = html.replace(/\n/g, "<br>");
        
        return html;
    }
}

// Export for app.js
window.HatanAi = HatanAi;
