// Shiva Neki'im & Halachic Cycle (Vests) Calendar Tracker Logic

const HEBREW_GEMATRIA_DAYS = [
    "", "א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ז'", "ח'", "ט'", "י'",
    "י\"א", "י\"ב", "י\"ג", "י\"ד", "ט\"ו", "ט\"ז", "י\"ז", "י\"ח", "י\"ט", "כ'",
    "כ\"א", "כ\"ב", "כ\"ג", "כ\"ד", "כ\"ה", "כ\"ו", "כ\"ז", "כ\"ח", "כ\"ט", "ל'"
];

class HatanCalendar {
    constructor() {
        this.data = this.loadData();
        this.currentDate = new Date();
        this.selectedMonth = this.currentDate.getMonth();
        this.selectedYear = this.currentDate.getFullYear();
    }

    loadData() {
        const saved = SafeStorage.getItem('hatan_calendar_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Ensure default values exist for new vest properties
                return {
                    hefsekDate: parsed.hefsekDate || "",
                    hefsekTime: parsed.hefsekTime || "before",
                    vestDate: parsed.vestDate || "",
                    vestTime: parsed.vestTime || "night",
                    vestInterval: parsed.vestInterval || "",
                    checksCompleted: parsed.checksCompleted || {},
                    notificationsEnabled: parsed.notificationsEnabled || false
                };
            } catch (e) {
                console.error("Error parsing calendar data", e);
            }
        }
        return {
            hefsekDate: "",
            hefsekTime: "before",
            vestDate: "",
            vestTime: "night",
            vestInterval: "",
            checksCompleted: {},
            notificationsEnabled: false
        };
    }

    saveData() {
        SafeStorage.setItem('hatan_calendar_data', JSON.stringify(this.data));
    }

    setHefsek(hefsekDate, hefsekTime, vestDate, vestTime, vestInterval) {
        this.data.hefsekDate = hefsekDate || "";
        this.data.hefsekTime = hefsekTime || "before";
        this.data.vestDate = vestDate || "";
        this.data.vestTime = vestTime || "night";
        this.data.vestInterval = vestInterval || "";
        this.saveData();
    }

    clearHefsek() {
        this.data.hefsekDate = "";
        this.data.hefsekTime = "before";
        this.data.vestDate = "";
        this.data.vestTime = "night";
        this.data.vestInterval = "";
        this.data.checksCompleted = {};
        this.saveData();
    }

    toggleCheck(dateStr, checkType) {
        if (!this.data.checksCompleted[dateStr]) {
            this.data.checksCompleted[dateStr] = [];
        }
        
        const index = this.data.checksCompleted[dateStr].indexOf(checkType);
        if (index > -1) {
            this.data.checksCompleted[dateStr].splice(index, 1);
        } else {
            this.data.checksCompleted[dateStr].push(checkType);
        }
        this.saveData();
    }

    // Helper to calculate key dates based on Hefsek Taharah
    calculateCycle() {
        if (!this.data.hefsekDate) return null;

        const hefsek = new Date(this.data.hefsekDate);
        
        // If Hefsek was performed AFTER sunset, it counts as the next day's sunset,
        // which means Shiva Neki'im start a day later.
        let startDate = new Date(hefsek);
        if (this.data.hefsekTime === 'after') {
            startDate.setDate(startDate.getDate() + 1);
        }

        const dates = {
            hefsekRaw: new Date(hefsek),
            hefsekEffective: new Date(startDate),
            nekiimDays: [], // Array of 7 Dates
            mikvehDate: null // Date of Mikveh night (night after day 7)
        };

        // Day 1 to 7 of Shiva Neki'im
        for (let i = 1; i <= 7; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            dates.nekiimDays.push(d);
        }

        // Mikveh is the night of Day 7 (which is technically the evening at the end of Day 7)
        dates.mikvehDate = new Date(dates.nekiimDays[6]);

        return dates;
    }

    // Convert date to Hebrew date object
    getHebrewDetails(date) {
        try {
            const formatter = new Intl.DateTimeFormat('en-US-u-ca-hebrew', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            });
            const parts = formatter.formatToParts(date);
            const dayNum = parseInt(parts.find(p => p.type === 'day').value, 10);
            const monthNum = parseInt(parts.find(p => p.type === 'month').value, 10);
            const yearNum = parseInt(parts.find(p => p.type === 'year').value, 10);

            // Month name in Hebrew
            const monthNameFormatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
                month: 'long'
            });
            const monthName = monthNameFormatter.format(date);
            const gematriaDay = HEBREW_GEMATRIA_DAYS[dayNum] || dayNum.toString();

            return {
                day: dayNum,
                month: monthNum,
                year: yearNum,
                monthName: monthName,
                gematriaDay: gematriaDay,
                displayShort: gematriaDay,
                displayFull: `${gematriaDay} ב${monthName}`
            };
        } catch (e) {
            console.error("Error in getHebrewDetails:", e);
            return null;
        }
    }

    // Calculate Halachic separation days (עונות פרישה)
    calculateVests() {
        if (!this.data.vestDate) return null;

        const startDate = new Date(this.data.vestDate);
        const originalHeb = this.getHebrewDetails(startDate);
        if (!originalHeb) return null;

        // 1. Ona Beinonit (Day 30 of cycle - startDate + 29 days)
        const dateBeinonit = new Date(startDate);
        dateBeinonit.setDate(startDate.getDate() + 29);

        // 2. Ona Haflaga (startDate + Interval - 1 days)
        let dateHaflaga = null;
        if (this.data.vestInterval) {
            const interval = parseInt(this.data.vestInterval, 10);
            if (!isNaN(interval) && interval > 0) {
                dateHaflaga = new Date(startDate);
                dateHaflaga.setDate(startDate.getDate() + (interval - 1));
            }
        }

        // 3. Ona Hachodesh (Same Hebrew date in the next Hebrew month)
        let dateHachodesh = null;
        const originalHebDay = originalHeb.day;
        // Search window from 27 to 32 days after start date
        for (let offset = 27; offset <= 32; offset++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + offset);
            const details = this.getHebrewDetails(d);
            if (details && details.day === originalHebDay) {
                dateHachodesh = d;
                break;
            }
        }

        return {
            startDate,
            originalHeb,
            vestTime: this.data.vestTime, // "day" or "night"
            beinonit: dateBeinonit,
            haflaga: dateHaflaga,
            hachodesh: dateHachodesh
        };
    }

    // Format date as YYYY-MM-DD (local time)
    formatDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Check what state a given date has in the cycle
    getDateState(date) {
        const dateStr = this.formatDateKey(date);
        
        let state = {
            type: 'normal',
            isVest: false,
            vestTypes: [],
            label: '',
            instruction: '',
            dayNumber: null,
            nekiimDay: null
        };

        // 1. Check Shiva Neki'im & Purity
        const cycle = this.calculateCycle();
        if (cycle) {
            const hefsekStr = this.formatDateKey(cycle.hefsekRaw);
            const mikvehStr = this.formatDateKey(cycle.mikvehDate);

            if (dateStr === hefsekStr) {
                state.type = 'hefsek';
                state.label = 'הפסק טהרה';
                state.instruction = 'ביצוע בדיקה פנימית בבד לבן נקי לפני שקיעת החמה. אם הבד יצא נקי לחלוטין - זהו יום ההפסק.';
            } else if (dateStr === mikvehStr) {
                state.type = 'mikveh';
                state.label = 'טבילה במקווה!';
                state.instruction = 'הכנות לטבילה (גזירת ציפורניים, מקלחת יסודית, חפיפה ללא קשרים בשיער). טבילה במקווה לאחר צאת הכוכבים. לאחר הטבילה - מותרים לחלוטין!';
            } else {
                // Check if it's one of the 7 clean days
                let isNekiim = false;
                for (let i = 0; i < 7; i++) {
                    const nekiimStr = this.formatDateKey(cycle.nekiimDays[i]);
                    if (dateStr === nekiimStr) {
                        const dayNum = i + 1;
                        state.type = 'nekiim';
                        state.nekiimDay = dayNum;
                        state.label = `נקיים - יום ${dayNum}`;
                        state.instruction = `יום ${dayNum} לשבעה נקיים. יש לבצע בדיקה אחת בבוקר (לאחר הקימה) ובדיקה אחת לפני השקיעה.`;
                        isNekiim = true;
                        break;
                    }
                }

                // Check Niddah range before Hefsek (up to 5 days)
                if (!isNekiim) {
                    const dateMs = date.getTime();
                    const hefsekMs = cycle.hefsekRaw.getTime();
                    if (dateMs < hefsekMs) {
                        const fiveDaysAgo = new Date(cycle.hefsekRaw);
                        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
                        if (dateMs >= fiveDaysAgo.getTime()) {
                            state.type = 'niddah';
                            state.label = 'נידה (הרחקות)';
                            state.instruction = 'ימי הראייה וההרחקות. יש להמתין לפחות 4/5 ימים מתחילת הראייה ולאחר שהדימום פסק לגמרי ניתן לעשות הפסק טהרה.';
                        }
                    }
                }
            }
        }

        // 2. Check Separation Vests (עונות פרישה)
        const vests = this.calculateVests();
        if (vests) {
            const beinonitStr = this.formatDateKey(vests.beinonit);
            const haflagaStr = vests.haflaga ? this.formatDateKey(vests.haflaga) : null;
            const hachodeshStr = vests.hachodesh ? this.formatDateKey(vests.hachodesh) : null;

            if (dateStr === beinonitStr) {
                state.isVest = true;
                state.vestTypes.push('beinonit');
            }
            if (haflagaStr && dateStr === haflagaStr) {
                state.isVest = true;
                state.vestTypes.push('haflaga');
            }
            if (hachodeshStr && dateStr === hachodeshStr) {
                state.isVest = true;
                state.vestTypes.push('hachodesh');
            }

            if (state.isVest) {
                const vestLabels = [];
                const vestDescriptions = [];
                const onaText = vests.vestTime === 'night' ? 'עונת לילה (מהשקיעה עד הנץ)' : 'עונת יום (מהנץ עד השקיעה)';

                if (state.vestTypes.includes('beinonit')) {
                    vestLabels.push('עונה בינונית');
                    vestDescriptions.push(`<strong>עונה בינונית (יום ה-30):</strong> חובת פרישה ביום ה-30 מתחילת הווסת הקודמת. עונה זו קבועה לכל אישה.`);
                }
                if (state.vestTypes.includes('haflaga')) {
                    vestLabels.push(`עונת הפלגה (${this.data.vestInterval})`);
                    vestDescriptions.push(`<strong>עונת ההפלגה (הפרש של ${this.data.vestInterval} ימים):</strong> חובת פרישה ביום שבו חל אותו הפרש ימים כמו בין הווסתות הקודמות.`);
                }
                if (state.vestTypes.includes('hachodesh')) {
                    vestLabels.push(`עונת החודש (${vests.originalHeb.displayShort})`);
                    vestDescriptions.push(`<strong>עונת החודש:</strong> חובת פרישה באותו תאריך עברי שבו ראתה בחודש הקודם (${vests.originalHeb.displayFull}).`);
                }

                const joinedLabels = vestLabels.join(' + ');
                const joinedDescriptions = vestDescriptions.join('<br><br>');

                if (state.type !== 'normal') {
                    state.label = `${state.label} | פרישה: ${joinedLabels}`;
                    state.instruction = `${state.instruction}<br><hr style="margin: 10px 0; border: 0; border-top: 1px solid var(--border-color);"><strong style="color: var(--error);">שימו לב - יום פרישה!</strong> יש לפרוש מיחסי אישות במהלך <strong>${onaText}</strong> ולבצע בדיקה הלכתית.<br><br>${joinedDescriptions}`;
                } else {
                    state.type = 'vest';
                    state.label = `עונת פרישה: ${joinedLabels}`;
                    state.instruction = `<strong style="color: var(--error);">יום פרישה הלכתי!</strong> יש לפרוש מיחסי אישות במהלך <strong>${onaText}</strong> ולבצע בדיקה פנימית (בדיקת עונה) בבד לבן נקי לפני סוף העונה.<br><br>${joinedDescriptions}`;
                }
            }
        }

        return state;
    }

    setupNotifications() {
        const btn = document.getElementById("btn-request-notifications");
        if (!btn) return;

        if (!("Notification" in window)) {
            btn.innerHTML = `<i class="fas fa-bell-slash"></i> התראות לא נתמכות בדפדפן`;
            btn.disabled = true;
            return;
        }

        if (Notification.permission === "granted") {
            btn.innerHTML = `<i class="fas fa-check-circle"></i> התראות פעילות בדפדפן`;
            btn.className = "btn btn-secondary";
            btn.style.background = "var(--success)";
            btn.style.color = "white";
            this.data.notificationsEnabled = true;
            this.saveData();
        } else if (Notification.permission === "denied") {
            btn.innerHTML = `<i class="fas fa-times-circle"></i> התראות חסומות בדפדפן`;
            btn.disabled = true;
        } else {
            btn.innerHTML = `<i class="fas fa-bell"></i> הפעל התראות בדפדפן`;
            // Remove existing listener to prevent stacking
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener("click", () => {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        newBtn.innerHTML = `<i class="fas fa-check-circle"></i> התראות פעילות בדפדפן`;
                        newBtn.style.background = "var(--success)";
                        newBtn.style.color = "white";
                        this.data.notificationsEnabled = true;
                        this.saveData();
                        
                        new Notification("התראות יומן טהרה הופעלו", {
                            body: "תקבל תזכורות יומיות על בדיקות שבעה נקיים ועונות פרישה.",
                            icon: "favicon.ico"
                        });
                    } else {
                        newBtn.innerHTML = `<i class="fas fa-times-circle"></i> התראות חסומות בדפדפן`;
                        newBtn.disabled = true;
                    }
                });
            });
        }
    }

    checkReminders() {
        if (!this.data.notificationsEnabled || Notification.permission !== "granted") return;

        const now = new Date();
        const todayStr = this.formatDateKey(now);
        const currentHour = now.getHours();

        // Load or initialize last notification state to avoid duplicate triggers
        const lastNotified = SafeStorage.getItem('last_notified_state');
        let notifyState = lastNotified ? JSON.parse(lastNotified) : { date: "", types: [] };

        if (notifyState.date !== todayStr) {
            notifyState = { date: todayStr, types: [] };
        }

        const triggerNotification = (key, title, body) => {
            if (notifyState.types.includes(key)) return; // Already sent today
            
            new Notification(title, {
                body: body,
                icon: "favicon.ico"
            });
            
            notifyState.types.push(key);
            SafeStorage.setItem('last_notified_state', JSON.stringify(notifyState));
        };

        const state = this.getDateState(now);
        
        // 1. Hefsek reminder
        if (state.type === 'hefsek') {
            if (currentHour >= 12 && currentHour < 19) {
                triggerNotification('hefsek', 'תזכורת להפסק טהרה', 'היום הוא יום הפסק הטהרה של אשתך. יש לבצע בדיקה פנימית בבד נקי לפני שקיעת החמה.');
            }
        }

        // 2. Shiva Neki'im reminders
        if (state.type === 'nekiim') {
            const completed = this.data.checksCompleted[todayStr] || [];
            
            // Morning check reminder (6:00 to 11:00)
            if (currentHour >= 6 && currentHour < 11 && !completed.includes('morning')) {
                triggerNotification('nekiim-morning', `שבעה נקיים - יום ${state.nekiimDay}`, 'בוקר טוב! תזכורת לבצע בדיקת שבעה נקיים של הבוקר.');
            }
            
            // Afternoon check reminder (15:00 to 19:00)
            if (currentHour >= 15 && currentHour < 19 && !completed.includes('afternoon')) {
                triggerNotification('nekiim-afternoon', `שבעה נקיים - יום ${state.nekiimDay}`, 'תזכורת לבצע בדיקת שבעה נקיים של מנחה לפני שקיעת החמה.');
            }
        }

        // 3. Mikveh reminder
        if (state.type === 'mikveh') {
            if (currentHour >= 14 && currentHour < 22) {
                triggerNotification('mikveh', 'ליל טבילה במקווה', 'הערב חל ליל הטבילה במקווה. יש לבצע את ההכנות ולטבול לאחר צאת הכוכבים.');
            }
        }

        // 4. Vest / Separation reminders (today and tomorrow)
        const vests = this.calculateVests();
        if (vests) {
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            const tomorrowStr = this.formatDateKey(tomorrow);

            const beinonitStr = this.formatDateKey(vests.beinonit);
            const haflagaStr = vests.haflaga ? this.formatDateKey(vests.haflaga) : null;
            const hachodeshStr = vests.hachodesh ? this.formatDateKey(vests.hachodesh) : null;
            const onaText = vests.vestTime === 'night' ? 'עונת לילה' : 'עונת יום';

            // Today
            let todayVestTypes = [];
            if (todayStr === beinonitStr) todayVestTypes.push('עונה בינונית');
            if (haflagaStr && todayStr === haflagaStr) todayVestTypes.push('עונת הפלגה');
            if (hachodeshStr && todayStr === hachodeshStr) todayVestTypes.push('עונת החודש');

            if (todayVestTypes.length > 0) {
                triggerNotification('vest-today', 'תזכורת עונת פרישה (היום!)', `היום חלה ${todayVestTypes.join(' ו-')} (${onaText}). יש לפרוש מיחסי אישות ולבצע בדיקה.`);
            }

            // Tomorrow
            let tomorrowVestTypes = [];
            if (tomorrowStr === beinonitStr) tomorrowVestTypes.push('עונה בינונית');
            if (haflagaStr && tomorrowStr === haflagaStr) tomorrowVestTypes.push('עונת הפלגה');
            if (hachodeshStr && tomorrowStr === hachodeshStr) tomorrowVestTypes.push('עונת החודש');

            if (tomorrowVestTypes.length > 0 && currentHour >= 18) { // Notify evening before
                triggerNotification('vest-tomorrow', 'תזכורת פרישה (מחר)', `שים לב: מחר חלה ${tomorrowVestTypes.join(' ו-')} (${onaText}). יש להיערך לפרישה.`);
            }
        }
    }

    renderCalendar(containerId, instructionsId) {
        const container = document.getElementById(containerId);
        const instructionsBox = document.getElementById(instructionsId);
        if (!container) return;

        container.innerHTML = "";

        const monthNames = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
        
        // Calculate Hebrew range for header
        const firstDayDate = new Date(this.selectedYear, this.selectedMonth, 1);
        const lastDayDate = new Date(this.selectedYear, this.selectedMonth + 1, 0);
        const firstHeb = this.getHebrewDetails(firstDayDate);
        const lastHeb = this.getHebrewDetails(lastDayDate);
        let hebMonthRange = "";
        if (firstHeb && lastHeb) {
            if (firstHeb.monthName === lastHeb.monthName) {
                hebMonthRange = `${firstHeb.monthName} ${firstHeb.year}`;
            } else {
                hebMonthRange = `${firstHeb.monthName} - ${lastHeb.monthName} ${lastHeb.year}`;
            }
        }

        // Render Header Controls
        const headerDiv = document.createElement("div");
        headerDiv.className = "calendar-header-months";
        headerDiv.style.display = "flex";
        headerDiv.style.flexDirection = "column";
        headerDiv.style.alignItems = "center";
        headerDiv.style.gap = "8px";
        headerDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
                <button class="btn btn-secondary" id="cal-prev" style="padding: 4px 12px; font-size: 0.85rem;"><i class="fas fa-chevron-right"></i> חודש קודם</button>
                <span style="margin: 0 15px; font-weight: 800; font-size: 1.25rem;">${monthNames[this.selectedMonth]} ${this.selectedYear}</span>
                <button class="btn btn-secondary" id="cal-next" style="padding: 4px 12px; font-size: 0.85rem;">חודש הבא <i class="fas fa-chevron-left"></i></button>
            </div>
            ${hebMonthRange ? `<div style="font-size: 0.95rem; color: var(--primary); font-weight: 700;"><i class="fas fa-calendar-alt"></i> לוח עברי: ${hebMonthRange}</div>` : ''}
        `;
        container.appendChild(headerDiv);

        document.getElementById("cal-prev")?.addEventListener("click", () => {
            this.changeMonth(-1);
            this.renderCalendar(containerId, instructionsId);
        });
        document.getElementById("cal-next")?.addEventListener("click", () => {
            this.changeMonth(1);
            this.renderCalendar(containerId, instructionsId);
        });

        // Grid Container
        const gridDiv = document.createElement("div");
        gridDiv.className = "calendar-grid";
        
        // Day Headers (RTL: Sunday is first on the right in Hebrew calendars)
        const daysOfWeek = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
        daysOfWeek.forEach(day => {
            const dayHead = document.createElement("div");
            dayHead.className = "calendar-day-header";
            dayHead.innerText = day;
            gridDiv.appendChild(dayHead);
        });

        // Month offset
        const firstDayIndex = new Date(this.selectedYear, this.selectedMonth, 1).getDay();
        const totalDays = new Date(this.selectedYear, this.selectedMonth + 1, 0).getDate();

        // Render empty cells for offset
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "calendar-cell";
            emptyCell.style.opacity = "0.2";
            gridDiv.appendChild(emptyCell);
        }

        // Render day cells
        const today = new Date();
        const todayStr = this.formatDateKey(today);

        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(this.selectedYear, this.selectedMonth, day);
            const dateStr = this.formatDateKey(date);
            const state = this.getDateState(date);
            const hebDetails = this.getHebrewDetails(date);
            
            const cell = document.createElement("div");
            cell.className = `calendar-cell ${state.type}`;
            if (state.isVest) {
                cell.classList.add("vest");
            }
            if (dateStr === todayStr) {
                cell.classList.add("today");
            }

            let completedHtml = "";
            if (state.type === 'nekiim') {
                const completed = this.data.checksCompleted[dateStr] || [];
                const mornChecked = completed.includes('morning') ? 'checked' : '';
                const aftChecked = completed.includes('afternoon') ? 'checked' : '';
                
                completedHtml = `
                    <div style="display: flex; gap: 8px; justify-content: center; margin-top: 6px; background: rgba(255,255,255,0.15); padding: 2px 4px; border-radius: 4px;" onclick="event.stopPropagation()">
                        <label title="בדיקת בוקר" style="cursor: pointer; font-size: 0.65rem; display: flex; align-items: center; gap: 2px; color: var(--text-main); font-weight: 600;">
                            <input type="checkbox" ${mornChecked} data-date="${dateStr}" data-type="morning" class="check-toggle"> ב'
                        </label>
                        <label title="בדיקת ערב" style="cursor: pointer; font-size: 0.65rem; display: flex; align-items: center; gap: 2px; color: var(--text-main); font-weight: 600;">
                            <input type="checkbox" ${aftChecked} data-date="${dateStr}" data-type="afternoon" class="check-toggle"> ע'
                        </label>
                    </div>
                `;
            }

            const hebShort = hebDetails ? hebDetails.displayShort : "";

            let labelHtml = "";
            if (state.label) {
                if (state.isVest && state.type !== 'vest') {
                    // Both Nekiim/Hefsek and Vest
                    labelHtml = `
                        <span class="day-label" style="background-color: var(--primary-dark); color: #fff; margin-bottom: 2px;">${state.label.split(' | ')[0]}</span>
                        <span class="day-label vest-label">⚠️ עונת פרישה</span>
                    `;
                } else if (state.isVest) {
                    labelHtml = `<span class="day-label vest-label">⚠️ עונת פרישה</span>`;
                } else {
                    labelHtml = `<span class="day-label">${state.label}</span>`;
                }
            }

            cell.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <span class="day-number" style="font-weight: 800;">${day}</span>
                    <span class="heb-day-number" style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">${hebShort}</span>
                </div>
                <div style="display: flex; flex-direction: column; width: 100%; align-items: center; margin-top: 4px;">
                    ${labelHtml}
                </div>
                ${completedHtml}
            `;

            // Click cell to show instructions
            cell.addEventListener("click", () => {
                this.showInstructions(state, date, instructionsBox);
            });

            gridDiv.appendChild(cell);
        }

        container.appendChild(gridDiv);

        // Wire up checkbox togglers
        container.querySelectorAll(".check-toggle").forEach(cb => {
            cb.addEventListener("change", (e) => {
                const dateStr = e.target.getAttribute("data-date");
                const type = e.target.getAttribute("data-type");
                this.toggleCheck(dateStr, type);
                this.renderCalendar(containerId, instructionsId);
            });
        });

        // Set default instructions on load
        if (instructionsBox && !instructionsBox.innerHTML) {
            const todayState = this.getDateState(today);
            this.showInstructions(todayState, today, instructionsBox);
        }
    }

    changeMonth(direction) {
        this.selectedMonth += direction;
        if (this.selectedMonth < 0) {
            this.selectedMonth = 11;
            this.selectedYear -= 1;
        } else if (this.selectedMonth > 11) {
            this.selectedMonth = 0;
            this.selectedYear += 1;
        }
    }

    showInstructions(state, date, box) {
        if (!box) return;

        const formattedDate = date.toLocaleDateString("he-IL", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const hebDetails = this.getHebrewDetails(date);
        const hebString = hebDetails ? hebDetails.displayFull : "";
        
        let html = `<h4>הוראות לתאריך: ${formattedDate} ${hebString ? `(${hebString})` : ''}</h4>`;
        
        if (state.type === 'normal' && !state.isVest) {
            html += `<p>יום חול רגיל. לא הוגדר מחזור טהרה או יום פרישה לתאריך זה. במידה ואשתך התחילה לספור או ראתה ווסת, הזן את הנתונים למטה כדי לקבל הדרכה מותאמת.</p>`;
        } else {
            html += `
                <p style="font-weight: 700; color: var(--primary-dark); margin-top: 8px;">סטטוס: ${state.label}</p>
                <p style="background: var(--bg-card); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); margin-top: 8px; line-height: 1.6;">${state.instruction}</p>
            `;

            if (state.nekiimDay) {
                const dateStr = this.formatDateKey(date);
                const completed = this.data.checksCompleted[dateStr] || [];
                const morn = completed.includes('morning');
                const aft = completed.includes('afternoon');

                html += `
                    <div style="margin-top: 15px; background: var(--bg-card); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <p style="font-weight: 700; margin-bottom: 8px;">רישום בדיקות שבוצעו היום:</p>
                        <div style="display: flex; gap: 20px;">
                            <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" id="instr-morn" ${morn ? 'checked' : ''} style="width: 18px; height: 18px;"> בדיקת בוקר (לאחר הקימה)
                            </label>
                            <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" id="instr-aft" ${aft ? 'checked' : ''} style="width: 18px; height: 18px;"> בדיקת ערב (לפני השקיעה)
                            </label>
                        </div>
                    </div>
                `;
            }
        }

        box.innerHTML = html;

        // Wire up instructions panel checkboxes
        const instrMorn = document.getElementById("instr-morn");
        const instrAft = document.getElementById("instr-aft");
        const dateStr = this.formatDateKey(date);

        instrMorn?.addEventListener("change", () => {
            this.toggleCheck(dateStr, 'morning');
            this.renderCalendar('calendar-grid-container', 'calendar-instructions-box');
        });
        instrAft?.addEventListener("change", () => {
            this.toggleCheck(dateStr, 'afternoon');
            this.renderCalendar('calendar-grid-container', 'calendar-instructions-box');
        });
    }
}

// Export for use in app.js
window.HatanCalendar = HatanCalendar;
