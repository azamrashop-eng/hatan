// Main Application Controller

class HatanApp {
    constructor() {
        this.currentLessonId = 1;
        this.completedLessons = this.loadProgress();
        this.calendar = new HatanCalendar();
        this.simulator = new HatanSimulator();
        this.ai = new HatanAi(this);
        
        // Checklist initial items
        this.checklists = this.loadChecklists();

        // Load Booklets Database
        this.booklets = [];
        this.customBooklets = this.loadCustomBooklets();
        this.bookletOverrides = this.loadBookletOverrides();
        
        // Supabase Hybrid Mode
        this.isCloudMode = window.HatanSupabase && window.HatanSupabase.isConfigured();
        this.currentUser = null;
        this.uploadType = "file"; // "file" or "link"

        this.refreshBookletsList();
    }

    async init() {
        // Initialize Google Analytics
        this.initAnalytics();

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
        this.initAi();

        // Initialize Checklists
        this.initChecklists();

        // Initialize Journal
        this.initJournal();

        // Initialize Cloud Data if applicable
        if (this.isCloudMode) {
            await this.initCloud();
        }

        // Initialize Feedback Modal bindings
        this.initFeedbackModal();

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

                // Send GA4 page view event
                if (window.gtag) {
                    window.gtag('event', 'page_view', {
                        page_title: targetSectionId,
                        page_path: '/' + targetSectionId
                    });
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
                } else if (targetSectionId === 'section-ai') {
                    this.scrollToBottom('ai-chat-box');
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
        const formVestDate = document.getElementById("vest-date-input");
        const formVestTime = document.getElementById("vest-time-select");
        const formVestInterval = document.getElementById("vest-interval-input");
        const btnSave = document.getElementById("btn-save-hefsek");
        const btnClear = document.getElementById("btn-clear-hefsek");

        // Load existing values into form if present
        if (this.calendar.data.hefsekDate) {
            if (formHefsekDate) formHefsekDate.value = this.calendar.data.hefsekDate;
            if (formHefsekTime) formHefsekTime.value = this.calendar.data.hefsekTime;
        }
        if (this.calendar.data.vestDate) {
            if (formVestDate) formVestDate.value = this.calendar.data.vestDate;
            if (formVestTime) formVestTime.value = this.calendar.data.vestTime;
            if (formVestInterval) formVestInterval.value = this.calendar.data.vestInterval;
        }

        // Initialize Notification Permission UI
        this.calendar.setupNotifications();

        // Start reminders check on load and every 5 minutes
        this.calendar.checkReminders();
        setInterval(() => {
            this.calendar.checkReminders();
        }, 5 * 60 * 1000);

        btnSave?.addEventListener("click", () => {
            const dateVal = formHefsekDate.value;
            const timeVal = formHefsekTime.value;
            const vestDateVal = formVestDate.value;
            const vestTimeVal = formVestTime.value;
            const vestIntervalVal = formVestInterval.value;

            if (!dateVal && !vestDateVal) {
                alert("אנא הזן תאריך הפסק טהרה או תאריך תחילת ווסת לחישוב");
                return;
            }

            this.calendar.setHefsek(dateVal, timeVal, vestDateVal, vestTimeVal, vestIntervalVal);
            this.calendar.renderCalendar('calendar-grid-container', 'calendar-instructions-box');
        });

        btnClear?.addEventListener("click", () => {
            if (confirm("האם אתה בטוח שברצונך לאפס את הלוח הנוכחי?")) {
                this.calendar.clearHefsek();
                if (formHefsekDate) formHefsekDate.value = "";
                if (formVestDate) formVestDate.value = "";
                if (formVestInterval) formVestInterval.value = "";
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

    // --- AI Assistant Panel ---
    initAi() {
        const inputEl = document.getElementById("ai-chat-input");
        const btnSend = document.getElementById("btn-send-ai-message");
        const chatBox = document.getElementById("ai-chat-box");
        const btnSettings = document.getElementById("btn-ai-settings");
        const settingsBox = document.getElementById("ai-settings-box");
        const apiKeyInput = document.getElementById("ai-api-key-input");
        const btnSaveSettings = document.getElementById("btn-save-ai-settings");
        const btnCancelSettings = document.getElementById("btn-cancel-ai-settings");

        // Load existing API Key into input
        if (apiKeyInput) {
            apiKeyInput.value = this.ai.getApiKey();
        }

        // Toggle Settings
        btnSettings?.addEventListener("click", () => {
            if (settingsBox) {
                const isHidden = settingsBox.style.display === "none";
                settingsBox.style.display = isHidden ? "block" : "none";
            }
        });

        btnCancelSettings?.addEventListener("click", () => {
            if (settingsBox) settingsBox.style.display = "none";
        });

        // Save Settings
        btnSaveSettings?.addEventListener("click", () => {
            const keyVal = apiKeyInput.value.trim();
            this.ai.setApiKey(keyVal);
            alert("הגדרות מפתח ה-API עודכנו בהצלחה!");
            if (settingsBox) settingsBox.style.display = "none";
        });

        // Send message function
        const sendMessage = async () => {
            const text = inputEl.value.trim();
            if (!text) return;

            // Clear input
            inputEl.value = "";

            // Render user message
            this.appendChatMessage(chatBox, 'user', text);
            this.scrollToBottom('ai-chat-box');

            // Render thinking state
            const thinkingEl = this.appendChatMessage(chatBox, 'bot thinking-message', `
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `);
            this.scrollToBottom('ai-chat-box');

            try {
                // Call AI Engine
                const response = await this.ai.ask(text);
                
                // Remove thinking indicator
                thinkingEl?.remove();

                // Render bot response
                this.appendChatMessage(chatBox, 'bot', response);
                this.scrollToBottom('ai-chat-box');
            } catch (e) {
                console.error(e);
                thinkingEl?.remove();
                this.appendChatMessage(chatBox, 'bot error-message', 'התרחשה שגיאה בעת ניסיון לפנות לעוזר ה-AI. אנא נסה שוב מאוחר יותר.');
                this.scrollToBottom('ai-chat-box');
            }
        };

        btnSend?.addEventListener("click", sendMessage);
        inputEl?.addEventListener("keypress", (e) => {
            if (e.key === "Enter") sendMessage();
        });

        // Prompt Chips bindings
        document.querySelectorAll(".ai-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                const prompt = chip.getAttribute("data-prompt");
                if (inputEl) {
                    inputEl.value = prompt;
                    sendMessage();
                }
            });
        });
    }

    appendChatMessage(container, role, text) {
        if (!container) return null;
        const msgDiv = document.createElement("div");
        msgDiv.className = `chat-message ${role}`;
        msgDiv.innerHTML = text;
        container.appendChild(msgDiv);
        return msgDiv;
    }

    scrollToBottom(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }

    // --- Cloud Mode Initialization ---
    async initCloud() {
        try {
            // Check session
            this.currentUser = await HatanSupabase.getCurrentUser();
            
            // Show warning if not configured
            document.getElementById("admin-supabase-warning").style.display = "none";

            // Fetch booklets from Supabase
            const cloudBooklets = await HatanSupabase.fetchBooklets();
            
            if (cloudBooklets.length === 0) {
                if (this.currentUser) {
                    // First run, migrate default booklets to Supabase
                    console.log("Supabase database is empty. Uploading default booklets...");
                    for (const bk of DEFAULT_BOOKLETS) {
                        try {
                            await HatanSupabase.saveBooklet({
                                title: bk.title,
                                category: bk.category,
                                size: bk.size,
                                description: bk.description,
                                url: `pdf/${bk.filename}`,
                                is_external: false
                            });
                        } catch (err) {
                            console.error("Failed to migrate booklet:", bk.title, err);
                        }
                    }
                    // Fetch again
                    this.booklets = await HatanSupabase.fetchBooklets();
                } else {
                    // Show default booklets locally for guests if cloud database is empty
                    const list = JSON.parse(JSON.stringify(DEFAULT_BOOKLETS));
                    list.forEach(bk => {
                        if (this.bookletOverrides[bk.id]) {
                            bk.description = this.bookletOverrides[bk.id];
                        }
                    });
                    this.booklets = list;
                }
            } else {
                this.booklets = cloudBooklets;
            }
        } catch (e) {
            console.error("Error initializing Supabase cloud data:", e);
            // Fall back to local mode
            this.isCloudMode = false;
            this.refreshBookletsList();
        }
    }

    initFeedbackModal() {
        const modal = document.getElementById("feedback-modal");
        const btnClose = document.getElementById("btn-close-feedback-modal");
        const btnSubmit = document.getElementById("btn-submit-feedback");

        if (!modal) return;

        if (btnClose) {
            btnClose.onclick = () => {
                modal.style.display = "none";
            };
        }

        window.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });

        if (btnSubmit) {
            btnSubmit.onclick = async () => {
                const bookletId = document.getElementById("feedback-modal-booklet-id").value;
                const groomName = document.getElementById("feedback-groom-name").value.trim();
                const comment = document.getElementById("feedback-groom-comment").value.trim();

                if (!comment) {
                    alert("אנא כתוב הערה או משוב.");
                    return;
                }

                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> שולח משוב...';

                try {
                    await HatanSupabase.submitFeedback(bookletId, groomName, comment);
                    alert("המשוב נשלח בהצלחה למדריך החתנים! תודה רבה.");
                    modal.style.display = "none";
                    document.getElementById("feedback-groom-comment").value = "";
                    document.getElementById("feedback-groom-name").value = "";
                } catch (e) {
                    console.error(e);
                    alert("שגיאה בשליחת המשוב: " + e.message);
                } finally {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> שלח משוב לענן';
                }
            };
        }
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
        if (this.isCloudMode) return; // Loaded via initCloud asynchronously

        const list = JSON.parse(JSON.stringify(DEFAULT_BOOKLETS));
        
        list.forEach(bk => {
            if (this.bookletOverrides[bk.id]) {
                bk.description = this.bookletOverrides[bk.id];
            }
        });

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

        const getBaseUrl = () => {
            const path = window.location.pathname;
            if (path.endsWith('.html') || path.endsWith('.htm')) {
                return path.substring(0, path.lastIndexOf('/') + 1);
            }
            return path.endsWith('/') ? path : path + '/';
        };
        const baseUrl = getBaseUrl();

        this.booklets.forEach(bk => {
            const card = document.createElement("div");
            card.className = "card";
            card.style.marginBottom = "0";

            const fileUrl = bk.url 
                ? (bk.url.startsWith('http') ? bk.url : baseUrl + bk.url) 
                : (bk.filename ? `${baseUrl}pdf/${bk.filename}` : "");
            const feedbackBtnHtml = this.isCloudMode ? `
                <button class="btn btn-secondary btn-feedback-booklet" data-id="${bk.id}" data-title="${bk.title}" style="font-size: 0.85rem; padding: 6px 12px; margin-right: 10px;">
                    <i class="fas fa-comment-dots"></i> שלח משוב
                </button>
            ` : "";

            card.innerHTML = `
                <div style="display: flex; gap: 1.5rem; align-items: flex-start;">
                    <div style="font-size: 2.5rem; color: #c62828;"><i class="fas fa-file-pdf"></i></div>
                    <div style="flex-grow: 1;">
                        <h3 style="margin-bottom: 4px;">${bk.title}</h3>
                        <span style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 10px;">גודל קובץ: ~${bk.size} | מדריך ${bk.category === 'jewish_purity' ? 'הבית היהודי והלכה' : 'סיבולת וכושר'}</span>
                        
                        <p style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 10px;">
                            ${bk.description}
                        </p>
                        
                        <a href="${fileUrl}" target="_blank" class="btn btn-secondary" style="font-size: 0.85rem; padding: 6px 12px;">
                            <i class="fas fa-external-link-alt"></i> פתח מדריך (PDF)
                        </a>
                        ${feedbackBtnHtml}
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

        // Bind feedback buttons
        document.querySelectorAll(".btn-feedback-booklet").forEach(btn => {
            btn.onclick = () => {
                const bookletId = btn.getAttribute("data-id");
                const bookletTitle = btn.getAttribute("data-title");
                
                document.getElementById("feedback-modal-booklet-id").value = bookletId;
                document.getElementById("feedback-modal-booklet-title").innerText = bookletTitle;
                document.getElementById("feedback-modal").style.display = "block";
            };
        });
    }

    // --- Admin Panel Logic ---
    initAdmin() {
        const lockedView = document.getElementById("admin-locked-view");
        const sbLockedView = document.getElementById("admin-supabase-locked-view");
        const unlockedView = document.getElementById("admin-unlocked-view");
        const warningBanner = document.getElementById("admin-supabase-warning");

        // Hide warning by default in cloud mode
        if (warningBanner) warningBanner.style.display = this.isCloudMode ? "none" : "block";

        if (!this.isCloudMode) {
            // Local Mode fallback
            if (sbLockedView) sbLockedView.style.display = "none";
            
            // Check if already unlocked locally
            const isLocalUnlocked = sessionStorage.getItem("hatan_local_unlocked") === "true";
            if (isLocalUnlocked) {
                if (lockedView) lockedView.style.display = "none";
                if (unlockedView) unlockedView.style.display = "block";
                this.renderAdminBooklets();
                this.bindAdminAddForm();
            } else {
                if (lockedView) lockedView.style.display = "block";
                if (unlockedView) unlockedView.style.display = "none";
            }

            const btnUnlock = document.getElementById("btn-admin-unlock");
            const passcodeIn = document.getElementById("admin-passcode-input");
            const errorMsg = document.getElementById("admin-lock-error");

            const tryUnlockLocal = () => {
                if (passcodeIn.value === "1234") {
                    sessionStorage.setItem("hatan_local_unlocked", "true");
                    if (lockedView) lockedView.style.display = "none";
                    if (unlockedView) unlockedView.style.display = "block";
                    this.renderAdminBooklets();
                    this.bindAdminAddForm();
                } else {
                    if (errorMsg) errorMsg.style.display = "block";
                    passcodeIn.value = "";
                }
            };

            if (btnUnlock) btnUnlock.onclick = tryUnlockLocal;
            if (passcodeIn) {
                passcodeIn.onkeypress = (e) => {
                    if (e.key === "Enter") tryUnlockLocal();
                };
            }

            const btnLockBack = document.getElementById("btn-admin-lock-back");
            if (btnLockBack) {
                btnLockBack.onclick = () => {
                    sessionStorage.removeItem("hatan_local_unlocked");
                    if (lockedView) lockedView.style.display = "block";
                    if (unlockedView) unlockedView.style.display = "none";
                    if (passcodeIn) passcodeIn.value = "";
                };
            }
        } else {
            // Cloud Mode (Supabase Auth)
            if (lockedView) lockedView.style.display = "none";

            const updateCloudViews = () => {
                if (this.currentUser) {
                    if (sbLockedView) sbLockedView.style.display = "none";
                    if (unlockedView) unlockedView.style.display = "block";
                    
                    // Show feedback panel in admin panel
                    const feedbackCard = document.getElementById("admin-feedback-card");
                    if (feedbackCard) feedbackCard.style.display = "block";

                    this.renderAdminBooklets();
                    this.bindAdminAddForm();
                    this.renderAdminFeedbackList();
                } else {
                    if (sbLockedView) sbLockedView.style.display = "block";
                    if (unlockedView) unlockedView.style.display = "none";
                    
                    const feedbackCard = document.getElementById("admin-feedback-card");
                    if (feedbackCard) feedbackCard.style.display = "none";
                }
            };

            updateCloudViews();

            const btnLogin = document.getElementById("btn-admin-login");
            const btnRegister = document.getElementById("btn-admin-register");
            const emailIn = document.getElementById("admin-email-input");
            const passwordIn = document.getElementById("admin-password-input");
            const errorMsg = document.getElementById("admin-supabase-error");

            if (btnLogin) {
                btnLogin.onclick = async () => {
                    const email = emailIn.value.trim();
                    const password = passwordIn.value.trim();
                    if (!email || !password) {
                        alert("אנא מלא את כל השדות.");
                        return;
                    }
                    btnLogin.disabled = true;
                    btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> מתחבר...';
                    if (errorMsg) errorMsg.style.display = "none";

                    try {
                        const session = await HatanSupabase.signIn(email, password);
                        this.currentUser = session.user;
                        updateCloudViews();
                    } catch (e) {
                        console.error(e);
                        if (errorMsg) {
                            errorMsg.innerText = "שגיאה בהתחברות: " + e.message;
                            errorMsg.style.display = "block";
                        }
                    } finally {
                        btnLogin.disabled = false;
                        btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> התחברות';
                    }
                };
            }

            if (btnRegister) {
                btnRegister.onclick = async () => {
                    const email = emailIn.value.trim();
                    const password = passwordIn.value.trim();
                    if (!email || !password) {
                        alert("אנא מלא את כל השדות.");
                        return;
                    }
                    if (password.length < 6) {
                        alert("הסיסמה חייבת להכיל לפחות 6 תווים.");
                        return;
                    }
                    btnRegister.disabled = true;
                    btnRegister.innerHTML = '<i class="fas fa-spinner fa-spin"></i> נרשם...';
                    if (errorMsg) errorMsg.style.display = "none";

                    try {
                        await HatanSupabase.signUp(email, password);
                        alert("הרשמה בוצעה בהצלחה! אנא בדוק את תיבת המייל שלך לאישור החשבון (במידה ומוגדר אישור מייל), או נסה להתחבר.");
                    } catch (e) {
                        console.error(e);
                        if (errorMsg) {
                            errorMsg.innerText = "שגיאה בהרשמה: " + e.message;
                            errorMsg.style.display = "block";
                        }
                    } finally {
                        btnRegister.disabled = false;
                        btnRegister.innerHTML = '<i class="fas fa-user-plus"></i> הרשמה כמדריך';
                    }
                };
            }

            const btnSignOut = document.getElementById("btn-admin-lock-back");
            if (btnSignOut) {
                btnSignOut.onclick = async () => {
                    if (confirm("האם ברצונך להתנתק מפאנל המדריך?")) {
                        await HatanSupabase.signOut();
                        this.currentUser = null;
                        updateCloudViews();
                    }
                };
            }
        }
    }

    bindAdminAddForm() {
        const btnToggleFile = document.getElementById("btn-toggle-upload-file");
        const btnToggleLink = document.getElementById("btn-toggle-upload-link");
        const fileGroup = document.getElementById("group-file-upload");
        const linkGroup = document.getElementById("group-link-input");

        if (btnToggleFile && btnToggleLink) {
            btnToggleFile.onclick = () => {
                this.uploadType = "file";
                btnToggleFile.classList.add("active");
                btnToggleLink.classList.remove("active");
                if (fileGroup) fileGroup.style.display = "block";
                if (linkGroup) linkGroup.style.display = "none";
            };

            btnToggleLink.onclick = () => {
                this.uploadType = "link";
                btnToggleLink.classList.add("active");
                btnToggleFile.classList.remove("active");
                if (fileGroup) fileGroup.style.display = "none";
                if (linkGroup) linkGroup.style.display = "block";
            };
        }

        const localFilenameInput = document.getElementById("admin-booklet-filename");
        const fileInput = document.getElementById("admin-booklet-file");

        if (!this.isCloudMode) {
            // Local mode: hide file browser, show filename input, hide toggles
            if (btnToggleFile && btnToggleFile.parentElement) {
                btnToggleFile.parentElement.parentElement.style.display = "none";
            }
            if (fileInput) fileInput.style.display = "none";
            if (localFilenameInput) {
                localFilenameInput.style.display = "block";
                localFilenameInput.previousElementSibling.innerText = "שם קובץ מקומי בתיקיית pdf (כולל .pdf):";
            }
        } else {
            // Cloud mode: show file browser, hide local filename input
            if (btnToggleFile && btnToggleFile.parentElement) {
                btnToggleFile.parentElement.parentElement.style.display = "grid";
            }
            if (fileInput) fileInput.style.display = "block";
            if (localFilenameInput) localFilenameInput.style.display = "none";
        }

        const btnAdd = document.getElementById("btn-admin-add-booklet");
        if (!btnAdd) return;

        btnAdd.onclick = async () => {
            const title = document.getElementById("admin-booklet-title").value.trim();
            const category = document.getElementById("admin-booklet-category").value;
            const size = document.getElementById("admin-booklet-size").value.trim();
            const description = document.getElementById("admin-booklet-description").value.trim();
            const spinner = document.getElementById("admin-upload-spinner");

            if (!title || !description) {
                alert("אנא מלא את כל שדות החובה: כותרת ותיאור.");
                return;
            }

            let fileUrl = "";
            let isExternal = false;

            if (this.isCloudMode) {
                if (this.uploadType === "file") {
                    const fileEl = document.getElementById("admin-booklet-file");
                    const file = fileEl.files[0];
                    if (!file) {
                        alert("אנא בחר קובץ PDF להעלאה.");
                        return;
                    }
                    
                    if (spinner) spinner.style.display = "inline";
                    btnAdd.disabled = true;

                    try {
                        fileUrl = await HatanSupabase.uploadFile(file);
                    } catch (e) {
                        console.error(e);
                        alert("שגיאה בהעלאת הקובץ לענן: " + e.message);
                        if (spinner) spinner.style.display = "none";
                        btnAdd.disabled = false;
                        return;
                    }
                } else {
                    fileUrl = document.getElementById("admin-booklet-url").value.trim();
                    if (!fileUrl) {
                        alert("אנא הזן כתובת קישור חיצונית.");
                        return;
                    }
                    isExternal = true;
                }

                try {
                    const newBk = {
                        title,
                        category,
                        size: size || "1.0 MB",
                        description,
                        url: fileUrl,
                        is_external: isExternal
                    };
                    await HatanSupabase.saveBooklet(newBk);
                    alert("החוברת הועלתה ונשמרה בענן בהצלחה!");
                } catch (e) {
                    console.error(e);
                    alert("שגיאה בשמירת פרטי החוברת בענן: " + e.message);
                } finally {
                    if (spinner) spinner.style.display = "none";
                    btnAdd.disabled = false;
                }
            } else {
                // Local Mode fallback
                const filename = document.getElementById("admin-booklet-filename").value.trim();
                if (!filename) {
                    alert("אנא הזן שם קובץ מקומי.");
                    return;
                }

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
                alert("החוברת נוספה לספרייה המקומית בהצלחה!");
            }

            // Reset inputs
            document.getElementById("admin-booklet-title").value = "";
            document.getElementById("admin-booklet-size").value = "";
            document.getElementById("admin-booklet-description").value = "";
            if (document.getElementById("admin-booklet-file")) document.getElementById("admin-booklet-file").value = "";
            if (document.getElementById("admin-booklet-url")) document.getElementById("admin-booklet-url").value = "";
            if (document.getElementById("admin-booklet-filename")) document.getElementById("admin-booklet-filename").value = "";

            if (this.isCloudMode) {
                this.booklets = await HatanSupabase.fetchBooklets();
            }
            this.renderAdminBooklets();
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

            const isCustom = this.isCloudMode ? (bk.id && !String(bk.id).startsWith("foundations_") && !String(bk.id).startsWith("sacred_") && !String(bk.id).startsWith("intimacy_") && !String(bk.id).startsWith("total_") && !String(bk.id).startsWith("sex_") && !String(bk.id).startsWith("stamina_") && !String(bk.id).startsWith("cum_") && !String(bk.id).startsWith("screaming_") && !String(bk.id).startsWith("ultimate_")) : bk.id.startsWith("custom_");

            row.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px;">
                    <div>
                        <strong style="color: var(--secondary); font-size: 1.05rem;">${bk.title}</strong>
                        <span style="font-size: 0.8rem; color: var(--text-muted); margin-right: 10px;">קטגוריה: ${bk.category === 'jewish_purity' ? 'הלכה ורגש' : 'סיבולת/טכניקה'}</span>
                    </div>
                    ${isCustom ? `<button class="btn btn-secondary btn-delete-custom" data-id="${bk.id}" style="padding: 4px 10px; font-size: 0.8rem; background-color: rgba(198, 40, 40, 0.1); color: var(--error); border-color: rgba(198, 40, 40, 0.2);"><i class="fas fa-trash-alt"></i> מחק חוברת</button>` : `<span style="font-size: 0.8rem; color: var(--primary-dark); font-weight: 700;">חוברת מערכת</span>`}
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 0.85rem; font-weight: 600;">תיאור הסבר המוצג לחתן (ניתן לערוך):</label>
                    <textarea class="form-input txt-edit-desc" data-id="${bk.id}" style="height: 80px; font-size: 0.9rem; margin-top: 4px;">${bk.description}</textarea>
                </div>
                <div style="text-align: left; margin-top: 4px;">
                    <button class="btn btn-save-desc" data-id="${bk.id}" style="padding: 4px 14px; font-size: 0.85rem;"><i class="fas fa-save"></i> שמור שינויים בטקסט</button>
                </div>
            `;

            row.querySelector(".btn-save-desc").onclick = async () => {
                const newDesc = row.querySelector(".txt-edit-desc").value.trim();
                if (!newDesc) {
                    alert("הסבר החוברת אינו יכול להיות ריק.");
                    return;
                }

                if (this.isCloudMode) {
                    try {
                        const updatedBk = { ...bk, description: newDesc };
                        await HatanSupabase.saveBooklet(updatedBk);
                        alert("תיאור החוברת עודכן בענן בהצלחה!");
                        this.booklets = await HatanSupabase.fetchBooklets();
                    } catch (e) {
                        console.error(e);
                        alert("שגיאה בעדכון התיאור בענן: " + e.message);
                    }
                } else {
                    if (isCustom) {
                        const idx = this.customBooklets.findIndex(c => c.id === bk.id);
                        if (idx > -1) {
                            this.customBooklets[idx].description = newDesc;
                            this.saveCustomBooklets();
                        }
                    } else {
                        this.bookletOverrides[bk.id] = newDesc;
                        this.saveBookletOverrides();
                    }
                    alert("תיאור החוברת עודכן ונשמר בהצלחה!");
                }
            };

            if (isCustom) {
                row.querySelector(".btn-delete-custom").onclick = async () => {
                    if (confirm(`האם אתה בטוח שברצונך למחוק את החוברת "${bk.title}" לצמיתות?`)) {
                        if (this.isCloudMode) {
                            try {
                                await HatanSupabase.deleteBooklet(bk.id);
                                alert("החוברת נמחקה מהענן בהצלחה!");
                                this.booklets = await HatanSupabase.fetchBooklets();
                                this.renderAdminBooklets();
                            } catch (e) {
                                console.error(e);
                                alert("שגיאה במחיקת החוברת: " + e.message);
                            }
                        } else {
                            this.customBooklets = this.customBooklets.filter(c => c.id !== bk.id);
                            this.saveCustomBooklets();
                            this.renderAdminBooklets();
                        }
                    }
                };
            }

            container.appendChild(row);
        });
    }

    async renderAdminFeedbackList() {
        const container = document.getElementById("admin-feedback-list");
        if (!container) return;

        container.innerHTML = '<p style="text-align: center; color: var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> טוען משובים...</p>';

        try {
            const feedback = await HatanSupabase.fetchAllFeedback();
            
            if (feedback.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">אין משובים זמינים כרגע.</p>';
                return;
            }

            container.innerHTML = "";

            feedback.forEach(item => {
                const card = document.createElement("div");
                card.style.border = "1px solid var(--border-color)";
                card.style.background = "var(--bg-main)";
                card.style.padding = "1rem";
                card.style.borderRadius = "8px";
                card.style.position = "relative";
                card.style.display = "flex";
                card.style.flexDirection = "column";
                card.style.gap = "6px";

                const date = new Date(item.created_at).toLocaleDateString("he-IL", {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'numeric',
                    year: 'numeric'
                });

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-color); padding-bottom: 6px;">
                        <div>
                            <strong>מאת: ${item.groom_name}</strong>
                            <span style="font-size: 0.8rem; color: var(--text-muted); margin-right: 15px;">חוברת: ${item.booklets ? item.booklets.title : "לא ידוע"}</span>
                        </div>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${date}</span>
                    </div>
                    <p style="font-size: 0.95rem; margin: 5px 0 0 0; line-height: 1.5;">${item.comment}</p>
                    <div style="text-align: left; margin-top: 5px;">
                        <button class="btn btn-secondary btn-delete-feedback" data-id="${item.id}" style="padding: 2px 8px; font-size: 0.75rem; background-color: rgba(198, 40, 40, 0.05); color: var(--error); border-color: rgba(198, 40, 40, 0.1);"><i class="fas fa-trash-alt"></i> מחק הערה</button>
                    </div>
                `;

                card.querySelector(".btn-delete-feedback").onclick = async () => {
                    if (confirm("האם אתה בטוח שברצונך למחוק משוב זה?")) {
                        try {
                            await HatanSupabase.deleteFeedback(item.id);
                            this.renderAdminFeedbackList();
                        } catch (e) {
                            console.error(e);
                            alert("שגיאה במחיקת המשוב: " + e.message);
                        }
                    }
                };

                container.appendChild(card);
            });
        } catch (e) {
            console.error("Error loading feedback list:", e);
            container.innerHTML = `<p style="text-align: center; color: var(--error); padding: 1rem;">שגיאה בטעינת משובים: ${e.message}</p>`;
        }
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

    initAnalytics() {
        const gaId = window.GOOGLE_ANALYTICS_ID;
        if (!gaId || gaId === "YOUR_GOOGLE_ANALYTICS_ID") return;

        // Load GA4 script dynamically
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function() { dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', gaId, { send_page_view: false });

        // Send initial page view
        window.gtag('event', 'page_view', {
            page_title: 'section-dashboard',
            page_path: '/section-dashboard'
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
