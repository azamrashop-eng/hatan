// Shiva Neki'im Calendar & Tracker Logic

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
                return JSON.parse(saved);
            } catch (e) {
                console.error("Error parsing calendar data", e);
            }
        }
        return {
            hefsekDate: "",       // Format: YYYY-MM-DD
            hefsekTime: "before",  // "before" or "after" sunset
            checksCompleted: {}    // Map of date string (YYYY-MM-DD) to array of completed checks: ["morning", "afternoon"]
        };
    }

    saveData() {
        SafeStorage.setItem('hatan_calendar_data', JSON.stringify(this.data));
    }

    setHefsek(dateStr, time) {
        this.data.hefsekDate = dateStr;
        this.data.hefsekTime = time;
        this.saveData();
    }

    clearHefsek() {
        this.data.hefsekDate = "";
        this.data.hefsekTime = "before";
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
        // For the calendar grid, we display it on the 7th day (as the evening of that day)
        // or on the date of the 7th day.
        dates.mikvehDate = new Date(dates.nekiimDays[6]);

        return dates;
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
        const cycle = this.calculateCycle();
        const dateStr = this.formatDateKey(date);
        
        if (!cycle) return { type: 'normal' };

        const hefsekStr = this.formatDateKey(cycle.hefsekRaw);
        if (dateStr === hefsekStr) {
            return {
                type: 'hefsek',
                label: 'הפסק טהרה',
                instruction: 'ביצוע בדיקה פנימית בבד לבן נקי לפני שקיעת החמה. אם הבד יצא נקי לחלוטין - זהו יום ההפסק.'
            };
        }

        // Check if it's during Niddah (before hefsek)
        const dateMs = date.getTime();
        const hefsekMs = cycle.hefsekRaw.getTime();
        if (dateMs < hefsekMs) {
            // Let's assume Niddah starts up to 5 days before Hefsek for visualization
            const fiveDaysAgo = new Date(cycle.hefsekRaw);
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
            if (dateMs >= fiveDaysAgo.getTime()) {
                return {
                    type: 'niddah',
                    label: 'נידה (הרחקות)',
                    instruction: 'ימי הראייה וההרחקות. יש להמתין לפחות 4/5 ימים מתחילת הראייה ולאחר שהדימום פסק לגמרי ניתן לעשות הפסק טהרה.'
                };
            }
        }

        // Check if it's one of the 7 clean days (Shiva Neki'im)
        for (let i = 0; i < 7; i++) {
            const nekiimStr = this.formatDateKey(cycle.nekiimDays[i]);
            if (dateStr === nekiimStr) {
                const dayNum = i + 1;
                return {
                    type: 'nekiim',
                    dayNumber: dayNum,
                    label: `נקיים - יום ${dayNum}`,
                    instruction: `יום ${dayNum} לשבעה נקיים. יש לבצע בדיקה אחת בבוקר (לאחר הקימה) ובדיקה אחת לפני השקיעה.`
                };
            }
        }

        // Mikveh night is the night following Day 7
        const mikvehStr = this.formatDateKey(cycle.mikvehDate);
        if (dateStr === mikvehStr) {
            return {
                type: 'mikveh',
                label: 'טבילה במקווה!',
                instruction: 'הכנות לטבילה (גזירת ציפורניים, מקלחת יסודית, חפיפה ללא קשרים בשיער). טבילה במקווה לאחר צאת הכוכבים. לאחר הטבילה - מותרים לחלוטין!'
            };
        }

        return { type: 'normal' };
    }

    renderCalendar(containerId, instructionsId) {
        const container = document.getElementById(containerId);
        const instructionsBox = document.getElementById(instructionsId);
        if (!container) return;

        container.innerHTML = "";

        const monthNames = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
        
        // Render Header Controls
        const headerDiv = document.createElement("div");
        headerDiv.className = "calendar-header-months";
        headerDiv.innerHTML = `
            <button class="btn btn-secondary" id="cal-prev" style="padding: 4px 12px; font-size: 0.85rem;"><i class="fas fa-chevron-right"></i> חודש קודם</button>
            <span style="margin: 0 15px;">${monthNames[this.selectedMonth]} ${this.selectedYear}</span>
            <button class="btn btn-secondary" id="cal-next" style="padding: 4px 12px; font-size: 0.85rem;">חודש הבא <i class="fas fa-chevron-left"></i></button>
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
        
        // Day Headers (RTL: Sunday is first on the right or left? In Hebrew calendars, Sunday is on the right, Saturday on the left)
        const daysOfWeek = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
        daysOfWeek.forEach(day => {
            const dayHead = document.createElement("div");
            dayHead.className = "calendar-day-header";
            dayHead.innerText = day;
            gridDiv.appendChild(dayHead);
        });

        // Month statistics
        const firstDayIndex = new Date(this.selectedYear, this.selectedMonth, 1).getDay(); // Day of week of 1st day (0-6)
        const totalDays = new Date(this.selectedYear, this.selectedMonth + 1, 0).getDate(); // Number of days in month

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
            
            const cell = document.createElement("div");
            cell.className = `calendar-cell ${state.type}`;
            if (dateStr === todayStr) {
                cell.classList.add("today");
            }

            let completedHtml = "";
            if (state.type === 'nekiim') {
                const completed = this.data.checksCompleted[dateStr] || [];
                const mornChecked = completed.includes('morning') ? 'checked' : '';
                const aftChecked = completed.includes('afternoon') ? 'checked' : '';
                
                completedHtml = `
                    <div style="display: flex; gap: 4px; justify-content: center; margin-top: 4px;" onclick="event.stopPropagation()">
                        <label title="בדיקת בוקר" style="cursor: pointer; font-size: 0.65rem;">
                            <input type="checkbox" ${mornChecked} data-date="${dateStr}" data-type="morning" class="check-toggle"> ב
                        </label>
                        <label title="בדיקת ערב" style="cursor: pointer; font-size: 0.65rem;">
                            <input type="checkbox" ${aftChecked} data-date="${dateStr}" data-type="afternoon" class="check-toggle"> ע
                        </label>
                    </div>
                `;
            }

            cell.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="day-number">${day}</span>
                </div>
                ${state.label ? `<span class="day-label">${state.label}</span>` : ''}
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
        
        let html = `<h4>הוראות לתאריך: ${formattedDate}</h4>`;
        
        if (state.type === 'normal') {
            html += `<p>יום חול רגיל. לא הוגדר מחזור טהרה לתאריך זה. במידה ואשתך התחילה לספור, הזן את יום הפסק הטהרה למטה כדי לקבל הדרכה מותאמת.</p>`;
        } else {
            html += `
                <p style="font-weight: 700; color: var(--primary-dark); margin-top: 8px;">סטטוס: ${state.label}</p>
                <p style="background: var(--bg-card); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); margin-top: 8px;">${state.instruction}</p>
            `;

            if (state.type === 'nekiim') {
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
