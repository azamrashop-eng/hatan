// Main Application Controller

class HatanApp {
    constructor() {
        this.currentLessonId = 1;
        this.completedLessons = this.loadProgress();
        this.calendar = new HatanCalendar();
        this.simulator = new HatanSimulator();
        
        // Checklist initial items
        this.checklists = this.loadChecklists();

        // Load Booklets Database
        this.booklets = [];
        this.customBooklets = this.loadCustomBooklets();
        this.bookletOverrides = this.loadBookletOverrides();
        this.refreshBookletsList();
    }

    init() {
        // Initialize Navigation
        this.initNavigation();
        
        // Initialize Theme Toggle
        this.initTheme();
        
        // Initialize Dashboard
        this.updateDashboard();

        // Initialize Lesson View
        this.initLessons();

        // Initialize Calendar
        this.initCalendar();

        // Initialize Simulator & QA
        this.simulator.init('sim-chat-box', 'sim-options-panel', 'faq-list-container');
        this.initQA();

        // Initialize Checklists
        this.initChecklists();

        // Initialize Journal
        this.initJournal();

        // Mobile Sidebar Hamburger toggle
        const burger = document.getElementById("hamburger-toggle");
        const sidebar = document.querySelector(".sidebar");
        burger?.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });

        // Close sidebar on item click (mobile)
        document.querySelectorAll(".nav-item-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove("open");
                }
            });
        });
    }

    // --- Navigation & Routing ---
    initNavigation() {
        const navButtons = document.querySelectorAll(".nav-item-btn");
        const sections = document.querySelectorAll(".content-section");

        navButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                const targetSectionId = btn.getAttribute("data-section");
                
                // Toggle active button
                navButtons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");

                // Toggle active section
                sections.forEach(sec => sec.classList.remove("active"));
                const targetSec = document.getElementById(targetSectionId);
                if (targetSec) {
                    targetSec.classList.add("active");
                }

                // Custom trigger updates
                if (targetSectionId === 'section-dashboard') {
                    this.updateDashboard();
                } else if (targetSectionId === 'section-calendar') {
                    this.calendar.renderCalendar('calendar-grid-container', 'calendar-instructions-box');
                } else if (targetSectionId === 'section-simulator') {
                    this.simulator.resetRoleplay();
                } else if (targetSectionId === 'section-library') {
                    this.renderLibrary();
                } else if (targetSectionId === 'section-admin') {
                    this.initAdmin();
                }
            });
        });
    }

    // --- Theme Controller ---
    initTheme() {
        const savedTheme = SafeStorage.getItem("hatan_theme") || "warm"; // Default to warm candlelight theme
        document.documentElement.setAttribute("data-theme", savedTheme);
        
        const btns = document.querySelectorAll(".theme-btn");
        btns.forEach(btn => {
            const theme = btn.getAttribute("data-theme");
            if (theme === savedTheme) {
                btn.classList.add("active");
            }
            btn.addEventListener("click", () => {
                btns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                document.documentElement.setAttribute("data-theme", theme);
                SafeStorage.setItem("hatan_theme", theme);
            });
        });
    }

    // --- Progress & Dashboard ---
    loadProgress() {
        const saved = SafeStorage.getItem("hatan_lessons_completed");
        return saved ? JSON.parse(saved) : [];
    }

    saveProgress() {
        SafeStorage.setItem("hatan_lessons_completed", JSON.stringify(this.completedLessons));
    }

    updateDashboard() {
        // Calculate progress percentage
        const total = LESSONS_DATA.length;
        const completedCount = this.completedLessons.length;
        const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
        
        // Update elements
        const bar = document.getElementById("dash-progress-bar");
        const txt = document.getElementById("dash-progress-text");
        if (bar) bar.style.width = `${pct}%`;
        if (txt) txt.innerText = `${pct}% מהקורס הושלם`;

        // Update Dashboard Roadmap visual
        const steps = document.querySelectorAll(".roadmap-step");
        steps.forEach((step, idx) => {
            const lessonId = idx + 1;
            step.classList.remove("completed", "active");
            if (this.completedLessons.includes(lessonId)) {
                step.classList.add("completed");
            } else if (lessonId === this.currentLessonId) {
                step.classList.add("active");
            }
        });
    }

    // --- Lessons System ---
    initLessons() {
        this.renderLessonsIndex();
        this.renderLesson(this.currentLessonId);

        // Prev/Next buttons
        document.getElementById("btn-prev-lesson")?.addEventListener("click", () => {
            if (this.currentLessonId > 1) {
                this.currentLessonId--;
                this.renderLesson(this.currentLessonId);
            }
        });

        document.getElementById("btn-next-lesson")?.addEventListener("click", () => {
            if (this.currentLessonId < LESSONS_DATA.length) {
                this.currentLessonId++;
                this.renderLesson(this.currentLessonId);
            }
        });
    }

    renderLessonsIndex() {
        const container = document.getElementById("lesson-index-list");
        if (!container) return;

        container.innerHTML = "";
        LESSONS_DATA.forEach(les => {
            const btn = document.createElement("button");
            btn.className = `chapter-item-btn ${les.id === this.currentLessonId ? 'active' : ''}`;
            btn.innerHTML = `
                <i class="fas ${les.icon}"></i>
                <span>${les.title}</span>
            `;
            btn.addEventListener("click", () => {
                this.currentLessonId = les.id;
                this.renderLesson(les.id);
            });
            container.appendChild(btn);
        });
    }

    renderLesson(id) {
        const lesson = LESSONS_DATA.find(l => l.id === id);
        if (!lesson) return;

        // Update index list active states
        document.querySelectorAll(".chapter-item-btn").forEach((btn, idx) => {
            btn.classList.toggle("active", idx + 1 === id);
        });

        // Set content
        const titleEl = document.getElementById("lesson-title");
        const bodyEl = document.getElementById("lesson-body-content");
        if (titleEl) titleEl.innerText = lesson.title;
        if (bodyEl) bodyEl.innerHTML = lesson.content;

        // Render Quiz
        this.renderQuiz(lesson);

        // Disable/enable navigation
        const btnPrev = document.getElementById("btn-prev-lesson");
        const btnNext = document.getElementById("btn-next-lesson");
        if (btnPrev) btnPrev.disabled = (id === 1);
        if (btnNext) btnNext.disabled = (id === LESSONS_DATA.length);

        // Scroll to top of lesson content
        document.querySelector(".main-content").scrollTop = 0;
    }

    renderQuiz(lesson) {
        const quizContainer = document.getElementById("lesson-quiz-box");
        if (!quizContainer) return;

        if (!lesson.quiz) {
            quizContainer.style.display = "none";
            return;
        }

        quizContainer.style.display = "block";
        
        // Check if already completed
        const isSolved = this.completedLessons.includes(lesson.id);

        quizContainer.innerHTML = `
            <div class="quiz-question"><i class="fas fa-question-circle"></i> שאלת בדיקה: ${lesson.quiz.question}</div>
            <div class="quiz-options" id="quiz-options-list"></div>
            <div class="quiz-feedback" id="quiz-feedback-box" style="display: none;"></div>
        `;

        const optionsList = document.getElementById("quiz-options-list");
        const feedbackBox = document.getElementById("quiz-feedback-box");

        lesson.quiz.options.forEach((opt, idx) => {
            const btn = document.createElement("button");
            btn.className = "quiz-option-btn";
            btn.innerText = opt;
            
            if (isSolved) {
                btn.disabled = true;
                if (idx === lesson.quiz.correctIndex) {
                    btn.classList.add("correct");
                }
            } else {
                btn.addEventListener("click", () => {
                    this.handleQuizAnswer(idx, lesson, feedbackBox);
                });
            }
            optionsList.appendChild(btn);
        });

        if (isSolved && feedbackBox) {
            feedbackBox.style.display = "flex";
            feedbackBox.className = "quiz-feedback success";
            feedbackBox.innerHTML = `<i class="fas fa-check-circle"></i> ${lesson.quiz.feedback}`;
        }
    }

    handleQuizAnswer(selectedIndex, lesson, feedbackBox) {
        const optionsButtons = document.querySelectorAll(".quiz-option-btn");
        optionsButtons.forEach(b => b.disabled = true); // Disable further clicks

        if (selectedIndex === lesson.quiz.correctIndex) {
            // Correct
            optionsButtons[selectedIndex].classList.add("correct");
            feedbackBox.style.display = "flex";
            feedbackBox.className = "quiz-feedback success";
            feedbackBox.innerHTML = `<i class="fas fa-check-circle"></i> <strong>תשובה נכונה!</strong> ${lesson.quiz.feedback}`;
            
            // Register completion
            if (!this.completedLessons.includes(lesson.id)) {
                this.completedLessons.push(lesson.id);
                this.saveProgress();
                this.updateDashboard();
            }
        } else {
            // Incorrect
            optionsButtons[selectedIndex].classList.add("incorrect");
            optionsButtons[lesson.quiz.correctIndex].classList.add("correct");
            feedbackBox.style.display = "flex";
            feedbackBox.className = "quiz-feedback error";
            feedbackBox.innerHTML = `<i class="fas fa-times-circle"></i> <strong>תשובה לא נכונה.</strong> בוא נבין את הסיבה...`;
            
            // Allow retry after short delay
            setTimeout(() => {
                optionsButtons.forEach(btn => {
                    btn.disabled = false;
                    btn.className = "quiz-option-btn"; // Reset class
                });
                feedbackBox.style.display = "none";
            }, 3000);
        }
    }

    // --- Calendar System ---
    initCalendar() {
        const formHefsekDate = document.getElementById("hefsek-date-input");
        const formHefsekTime = document.getElementById("hefsek-time-select");
        const btnSave = document.getElementById("btn-save-hefsek");
        const btnClear = document.getElementById("btn-clear-hefsek");

        // Load existing values into form if present
        if (this.calendar.data.hefsekDate) {
            if (formHefsekDate) formHefsekDate.value = this.calendar.data.hefsekDate;
            if (formHefsekTime) formHefsekTime.value = this.calendar.data.hefsekTime;
        }

        btnSave?.addEventListener("click", () => {
            const dateVal = formHefsekDate.value;
            const timeVal = formHefsekTime.value;

            if (!dateVal) {
                alert("אנא בחר תאריך תקף להפסק טהרה");
                return;
            }

            this.calendar.setHefsek(dateVal, timeVal);
            this.calendar.renderCalendar('calendar-grid-container', 'calendar-instructions-box');
        });

        btnClear?.addEventListener("click", () => {
            if (confirm("האם אתה בטוח שברצונך לאפס את הלוח הנוכחי?")) {
                this.calendar.clearHefsek();
                if (formHefsekDate) formHefsekDate.value = "";
                this.calendar.renderCalendar('calendar-grid-container', 'calendar-instructions-box');
            }
        });
    }

    // --- Ask the Rabbi QA Panel ---
    initQA() {
        const searchInput = document.getElementById("faq-search");
        searchInput?.addEventListener("input", (e) => {
            this.simulator.searchFAQs(e.target.value);
        });

        // Custom Question Input Submit
        const customInput = document.getElementById("custom-qa-input");
        const btnSend = document.getElementById("btn-send-custom-qa");

        const submitQuestion = () => {
            const txt = customInput.value;
            if (!txt.trim()) return;
            
            this.simulator.handleCustomQuestion(txt, 'custom-qa-output');
            customInput.value = "";
        };

        btnSend?.addEventListener("click", submitQuestion);
        customInput?.addEventListener("keypress", (e) => {
            if (e.key === "Enter") submitQuestion();
        });
    }

    // --- Dynamic Booklets Library Ingestion & Load ---
    loadCustomBooklets() {
        const saved = SafeStorage.getItem("hatan_custom_booklets");
        return saved ? JSON.parse(saved) : [];
    }

    saveCustomBooklets() {
        SafeStorage.setItem("hatan_custom_booklets", JSON.stringify(this.customBooklets));
        this.refreshBookletsList();
    }

    loadBookletOverrides() {
        const saved = SafeStorage.getItem("hatan_booklet_overrides");
        return saved ? JSON.parse(saved) : {};
    }

    saveBookletOverrides() {
        SafeStorage.setItem("hatan_booklet_overrides", JSON.stringify(this.bookletOverrides));
        this.refreshBookletsList();
    }

    refreshBookletsList() {
        // Clone default booklets array
        const list = JSON.parse(JSON.stringify(DEFAULT_BOOKLETS));
        
        // Merge with overrides
        list.forEach(bk => {
            if (this.bookletOverrides[bk.id]) {
                bk.description = this.bookletOverrides[bk.id];
            }
        });

        // Concatenate custom booklets
        this.booklets = list.concat(this.customBooklets);
    }

    renderLibrary() {
        const hebContainer = document.getElementById("library-hebrew-container");
        const techContainer = document.getElementById("library-technical-container");

        if (!hebContainer || !techContainer) return;

        hebContainer.innerHTML = "";
        techContainer.innerHTML = "";

        let hebCount = 0;
        let techCount = 0;

        this.booklets.forEach(bk => {
            const card = document.createElement("div");
            card.className = "card";
            card.style.marginBtm = "0";
            card.innerHTML = `
                <div style="display: flex; gap: 1.5rem; align-items: flex-start;">
                    <div style="font-size: 2.5rem; color: #c62828;"><i class="fas fa-file-pdf"></i></div>
                    <div style="flex-grow: 1;">
                        <h3 style="margin-bottom: 4px;">${bk.title}</h3>
                        <span style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 10px;">גודל קובץ: ~${bk.size} | מדריך ${bk.category === 'jewish_purity' ? 'הבית היהודי והלכה' : 'סיבולת וכושר'}</span>
                        
                        <p style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 10px;">
                            ${bk.description}
                        </p>
                        
                        <a href="pdf/${bk.filename}" target="_blank" class="btn btn-secondary" style="font-size: 0.85rem; padding: 6px 12px;">
                            <i class="fas fa-external-link-alt"></i> פתח מדריך (PDF)
                        </a>
                    </div>
                </div>
            `;

            if (bk.category === 'jewish_purity') {
                hebContainer.appendChild(card);
                hebCount++;
            } else {
                techContainer.appendChild(card);
                techCount++;
            }
        });

        if (hebCount === 0) {
            hebContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted);">אין חוברות בקטגוריה זו.</p>`;
        }
        if (techCount === 0) {
            techContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted);">אין חוברות בקטגוריה זו.</p>`;
        }
    }

    // --- Admin Panel Logic ---
    initAdmin() {
        const lockedView = document.getElementById("admin-locked-view");
        const unlockedView = document.getElementById("admin-unlocked-view");
        const errorMsg = document.getElementById("admin-lock-error");
        const passcodeIn = document.getElementById("admin-passcode-input");
        const btnUnlock = document.getElementById("btn-admin-unlock");
        const btnLockBack = document.getElementById("btn-admin-lock-back");

        if (!lockedView || !unlockedView) return;

        // Reset view
        lockedView.style.display = "block";
        unlockedView.style.display = "none";
        if (errorMsg) errorMsg.style.display = "none";
        if (passcodeIn) passcodeIn.value = "";

        // Unlock action
        const tryUnlock = () => {
            const code = passcodeIn.value;
            if (code === "1234") {
                lockedView.style.display = "none";
                unlockedView.style.display = "block";
                this.renderAdminBooklets();
                this.bindAdminAddForm();
            } else {
                if (errorMsg) errorMsg.style.display = "block";
                passcodeIn.value = "";
            }
        };

        btnUnlock?.onclick = tryUnlock;
        passcodeIn?.onkeypress = (e) => {
            if (e.key === "Enter") tryUnlock();
        };

        // Lock back action
        if (btnLockBack) {
            btnLockBack.onclick = () => {
                lockedView.style.display = "block";
                unlockedView.style.display = "none";
                passcodeIn.value = "";
            };
        }
    }

    bindAdminAddForm() {
        const btnAdd = document.getElementById("btn-admin-add-booklet");
        if (!btnAdd) return;

        btnAdd.onclick = () => {
            const title = document.getElementById("admin-booklet-title").value.trim();
            const filename = document.getElementById("admin-booklet-filename").value.trim();
            const category = document.getElementById("admin-booklet-category").value;
            const size = document.getElementById("admin-booklet-size").value.trim();
            const description = document.getElementById("admin-booklet-description").value.trim();

            if (!title || !filename || !description) {
                alert("אנא מלא את כל שדות החובה: כותרת, שם קובץ ותיאור הסבר.");
                return;
            }

            // Create new booklet object
            const newBk = {
                id: "custom_" + Date.now(),
                title: title,
                filename: filename,
                category: category,
                size: size || "1.0 MB",
                description: description
            };

            this.customBooklets.push(newBk);
            this.saveCustomBooklets();
            this.renderAdminBooklets();
            
            // Reset Form inputs
            document.getElementById("admin-booklet-title").value = "";
            document.getElementById("admin-booklet-filename").value = "";
            document.getElementById("admin-booklet-size").value = "";
            document.getElementById("admin-booklet-description").value = "";

            alert("החוברת נוספה לספרייה בהצלחה! וודא שהעתקת אותה לתיקיית pdf בפרויקט.");
        };
    }

    renderAdminBooklets() {
        const container = document.getElementById("admin-booklets-list");
        if (!container) return;

        container.innerHTML = "";

        this.booklets.forEach(bk => {
            const row = document.createElement("div");
            row.style.border = "1px solid var(--border-color)";
            row.style.background = "var(--bg-main)";
            row.style.padding = "1rem";
            row.style.borderRadius = "8px";
            row.style.display = "flex";
            row.style.flexDirection = "column";
            row.style.gap = "8px";

            const isCustom = bk.id.startsWith("custom_");

            row.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px;">
                    <div>
                        <strong style="color: var(--secondary); font-size: 1.05rem;">${bk.title}</strong>
                        <span style="font-size: 0.8rem; color: var(--text-muted); margin-right: 10px;">קטגוריה: ${bk.category === 'jewish_purity' ? 'הלכה ורגש' : 'סיבולת/טכניקה'}</span>
                    </div>
                    ${isCustom ? `<button class="btn btn-secondary btn-delete-custom" data-id="${bk.id}" style="padding: 4px 10px; font-size: 0.8rem; background-color: rgba(198, 40, 40, 0.1); color: var(--error); border-color: rgba(198, 40, 40, 0.2);"><i class="fas fa-trash-alt"></i> מחק חוברת</button>` : `<span style="font-size: 0.8rem; color: var(--primary-dark); font-weight: 700;">חוברת מערכת (דיפולט)</span>`}
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 0.85rem; font-weight: 600;">תיאור הסבר המוצג לחתן (ניתן לערוך):</label>
                    <textarea class="form-input txt-edit-desc" data-id="${bk.id}" style="height: 80px; font-size: 0.9rem; margin-top: 4px;">${bk.description}</textarea>
                </div>
                <div style="text-align: left; margin-top: 4px;">
                    <button class="btn btn-save-desc" data-id="${bk.id}" style="padding: 4px 14px; font-size: 0.85rem;"><i class="fas fa-save"></i> שמור שינויים בטקסט</button>
                </div>
            `;

            // Bind save description button
            row.querySelector(".btn-save-desc").onclick = () => {
                const newDesc = row.querySelector(".txt-edit-desc").value.trim();
                if (!newDesc) {
                    alert("הסבר החוברת אינו יכול להיות ריק.");
                    return;
                }

                if (isCustom) {
                    // Custom booklet - update in custom array
                    const idx = this.customBooklets.findIndex(c => c.id === bk.id);
                    if (idx > -1) {
                        this.customBooklets[idx].description = newDesc;
                        this.saveCustomBooklets();
                    }
                } else {
                    // Default booklet - save in overrides
                    this.bookletOverrides[bk.id] = newDesc;
                    this.saveBookletOverrides();
                }

                alert("תיאור החוברת עודכן ונשמר בהצלחה!");
            };

            // Bind delete custom booklet button
            if (isCustom) {
                row.querySelector(".btn-delete-custom").onclick = () => {
                    if (confirm(`האם אתה בטוח שברצונך למחוק את החוברת "${bk.title}" לצמיתות?`)) {
                        this.customBooklets = this.customBooklets.filter(c => c.id !== bk.id);
                        this.saveCustomBooklets();
                        this.renderAdminBooklets();
                    }
                };
            }

            container.appendChild(row);
        });
    }

    // --- Checklist system ---
    loadChecklists() {
        const saved = SafeStorage.getItem("hatan_checklists");
        if (saved) return JSON.parse(saved);

        // Defaults
        return {
            wedding: [
                { text: "חומר סיכוך על בסיס מים (חובה להביא בתיק)", checked: false },
                { text: "מצעים לבנים נקיים", checked: false },
                { text: "בגדים נוחים להחלפה במלון/בית", checked: false },
                { text: "בקבוק מים קטן וחטיף לחדר ייחוד ולמלון", checked: false },
                { text: "מתנה קטנה ומכתב אישי לכלה ללילה הראשון", checked: false }
            ],
            halacha: [
                { text: "בדים לבנים מיוחדים לבדיקה (עדי בדיקה)", checked: false },
                { text: "פנס או תאורה טובה לבדיקת מראות בבית", checked: false },
                { text: "מספר טלפון של רב מומחה למראות וכתמים", checked: false }
            ]
        };
    }

    saveChecklists() {
        SafeStorage.setItem("hatan_checklists", JSON.stringify(this.checklists));
    }

    initChecklists() {
        this.renderChecklist("wedding-checklist-container", "wedding");
        this.renderChecklist("halacha-checklist-container", "halacha");
    }

    renderChecklist(containerId, listKey) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = "";
        const list = this.checklists[listKey] || [];

        list.forEach((item, idx) => {
            const label = document.createElement("label");
            label.className = `checklist-item ${item.checked ? 'completed' : ''}`;
            
            label.innerHTML = `
                <input type="checkbox" ${item.checked ? 'checked' : ''}>
                <span>${item.text}</span>
            `;

            label.querySelector("input").addEventListener("change", (e) => {
                this.checklists[listKey][idx].checked = e.target.checked;
                this.saveChecklists();
                label.classList.toggle("completed", e.target.checked);
            });

            container.appendChild(label);
        });
    }

    // --- Private Journal / Notes ---
    initJournal() {
        const txtarea = document.getElementById("journal-textarea");
        const btnSave = document.getElementById("btn-save-journal");
        const status = document.getElementById("journal-save-status");

        if (txtarea) {
            txtarea.value = SafeStorage.getItem("hatan_journal_notes") || "";
        }

        btnSave?.addEventListener("click", () => {
            const val = txtarea.value;
            SafeStorage.setItem("hatan_journal_notes", val);
            if (status) {
                status.style.display = "inline";
                setTimeout(() => status.style.display = "none", 2000);
            }
        });
    }
}

// Initialize Application on DOM Content Loaded
let app;
document.addEventListener("DOMContentLoaded", () => {
    app = new HatanApp();
    app.init();
    window.app = app; // Expose globally for event handlers
});
