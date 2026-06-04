// Supabase Cloud Integration Helper
// ==========================================
// פתח פרויקט חינמי ב-https://supabase.com והעתק את הפרטים הבאים משם:

const SUPABASE_URL = "https://qafevdjthuyjmewghwqb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_TZdXswS06lFs5fWd7U3jNw_x5x0lJmL";

// מזהה מעקב של Google Analytics (GA4) - למשל G-XXXXXXXXXX
const GOOGLE_ANALYTICS_ID = "YOUR_GOOGLE_ANALYTICS_ID";

// SQL להרצה ב-SQL Editor של Supabase להקמת הטבלאות ושרת הקבצים:
/*
-- 1. יצירת טבלת חוברות
CREATE TABLE booklets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    size TEXT NOT NULL,
    description TEXT NOT NULL,
    url TEXT NOT NULL,
    is_external BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. יצירת טבלת משובים
CREATE TABLE booklet_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booklet_id UUID REFERENCES booklets(id) ON DELETE CASCADE,
    groom_name TEXT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. הגדרות אבטחת טבלאות (שכולם יוכלו לקרוא ולשלוח משוב, אך רק מדריך מחובר יערוך/ימחק)
ALTER TABLE booklets ENABLE ROW LEVEL SECURITY;
ALTER TABLE booklet_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of booklets" ON booklets FOR SELECT USING (true);
CREATE POLICY "Allow auth write of booklets" ON booklets FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow public insert of feedback" ON booklet_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow auth all of feedback" ON booklet_feedback FOR ALL TO authenticated USING (true);

-- הערה: יש ליצור גם Bucket בשם "booklets" במדור Storage ב-Supabase ולהגדיר אותו כ-Public.
*/

let supabaseClient = null;

if (SUPABASE_URL !== "YOUR_SUPABASE_PROJECT_URL" && SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY") {
    const { createClient } = window.supabase;
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const HatanSupabase = {
    isConfigured() {
        return supabaseClient !== null;
    },

    // --- Authentication ---
    async signUp(email, password) {
        if (!this.isConfigured()) throw new Error("Supabase is not configured.");
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    async signIn(email, password) {
        if (!this.isConfigured()) throw new Error("Supabase is not configured.");
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    async signOut() {
        if (!this.isConfigured()) return;
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
    },

    async getCurrentUser() {
        if (!this.isConfigured()) return null;
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user;
    },

    // --- Booklets ---
    async fetchBooklets() {
        if (!this.isConfigured()) return [];
        const { data, error } = await supabaseClient
            .from('booklets')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data;
    },

    async uploadFile(file) {
        if (!this.isConfigured()) throw new Error("Supabase is not configured.");
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `guides/${fileName}`;

        const { error } = await supabaseClient.storage
            .from('booklets')
            .upload(filePath, file);

        if (error) throw error;

        // Get public URL
        const { data } = supabaseClient.storage
            .from('booklets')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    async saveBooklet(booklet) {
        if (!this.isConfigured()) throw new Error("Supabase is not configured.");
        const user = await this.getCurrentUser();
        const payload = {
            title: booklet.title,
            category: booklet.category,
            size: booklet.size,
            description: booklet.description,
            url: booklet.url,
            is_external: booklet.is_external,
            created_by: user ? user.id : null
        };

        if (booklet.id && !String(booklet.id).startsWith("custom_")) {
            // Update existing row
            const { data, error } = await supabaseClient
                .from('booklets')
                .update(payload)
                .eq('id', booklet.id)
                .select();
            if (error) throw error;
            return data[0];
        } else {
            // Insert new row
            const { data, error } = await supabaseClient
                .from('booklets')
                .insert([payload])
                .select();
            if (error) throw error;
            return data[0];
        }
    },

    async deleteBooklet(id) {
        if (!this.isConfigured()) throw new Error("Supabase is not configured.");
        const { error } = await supabaseClient
            .from('booklets')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    },

    // --- Feedback ---
    async submitFeedback(bookletId, groomName, comment) {
        if (!this.isConfigured()) return;
        const { data, error } = await supabaseClient
            .from('booklet_feedback')
            .insert([{
                booklet_id: bookletId,
                groom_name: groomName || "אנונימי",
                comment: comment
            }]);
        
        if (error) throw error;
        return data;
    },

    async fetchAllFeedback() {
        if (!this.isConfigured()) return [];
        const { data, error } = await supabaseClient
            .from('booklet_feedback')
            .select(`
                id,
                groom_name,
                comment,
                created_at,
                booklets (
                    title
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async deleteFeedback(id) {
        if (!this.isConfigured()) throw new Error("Supabase is not configured.");
        const { error } = await supabaseClient
            .from('booklet_feedback')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    }
};

window.HatanSupabase = HatanSupabase;
window.GOOGLE_ANALYTICS_ID = GOOGLE_ANALYTICS_ID;
