-- ============================================
-- ROVA LMS â€” Quiz, Attempts, Notes
-- Idempotent: an toÃ n cháº¡y nhiá»u láº§n
-- ============================================

-- ============================================
-- Táº O TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  lesson_id TEXT REFERENCES lessons(id),
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',   -- [{question, options: string[], correct: number}]
  pass_score INT DEFAULT 70
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB DEFAULT '[]',              -- number[] chosen option indexes
  score INT,
  passed BOOLEAN,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,   -- há»c viÃªn Ä‘Æ°á»£c ghi chÃº
  author_id UUID REFERENCES profiles(id),                   -- mentor/admin viáº¿t ghi chÃº
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cá»™t onboarding_survey trÃªn profiles (dÃ¹ng bá»Ÿi getOnboardingSurveyByUser)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_survey JSONB;

-- ============================================
-- ROW LEVEL SECURITY + POLICIES
-- ============================================

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_quizzes" ON quizzes;
CREATE POLICY "allow_all_quizzes" ON quizzes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_quiz_attempts" ON quiz_attempts;
CREATE POLICY "allow_all_quiz_attempts" ON quiz_attempts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_user_notes" ON user_notes;
CREATE POLICY "allow_all_user_notes" ON user_notes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================
-- SEED â€” quizzes (tá»« lib/mock-data.ts)
-- ============================================

INSERT INTO quizzes (id, lesson_id, title, questions, pass_score) VALUES
('q-pro-02', 'l-pro-02', 'Kiá»ƒm tra: Biá»ƒu Ä‘á»“ náº¿n Nháº­t', '[
  {"question": "Náº¿n Doji thá»ƒ hiá»‡n Ä‘iá»u gÃ¬?", "options": ["Xu hÆ°á»›ng tÄƒng máº¡nh", "Sá»± do dá»± giá»¯a mua vÃ  bÃ¡n", "Xu hÆ°á»›ng giáº£m máº¡nh", "KhÃ´ng cÃ³ Ã½ nghÄ©a gÃ¬"], "correct": 1},
  {"question": "Náº¿n Hammer xuáº¥t hiá»‡n á»Ÿ Ä‘Ã¢u cÃ³ Ã½ nghÄ©a nháº¥t?", "options": ["Äá»‰nh xu hÆ°á»›ng tÄƒng", "ÄÃ¡y xu hÆ°á»›ng giáº£m", "Giá»¯a trend", "Báº¥t ká»³ Ä‘Ã¢u"], "correct": 1},
  {"question": "BÃ³ng náº¿n dÃ i phÃ­a dÆ°á»›i cho tháº¥y Ä‘iá»u gÃ¬?", "options": ["Lá»±c bÃ¡n máº¡nh", "Lá»±c mua Ä‘áº©y giÃ¡ lÃªn tá»« Ä‘Ã¡y", "GiÃ¡ Ä‘ang sideway", "KhÃ´ng cÃ³ volume"], "correct": 1}
]'::jsonb, 70)
ON CONFLICT (id) DO NOTHING;

INSERT INTO quizzes (id, lesson_id, title, questions, pass_score) VALUES
('q-pro-03', 'l-pro-03', 'Kiá»ƒm tra: Trendline', '[
  {"question": "Trendline tÄƒng Ä‘Æ°á»£c váº½ báº±ng cÃ¡ch nÃ o?", "options": ["Ná»‘i 2 Ä‘á»‰nh cao nháº¥t", "Ná»‘i 2 Ä‘Ã¡y tháº¥p dáº§n", "Ná»‘i 2 Ä‘Ã¡y cao dáº§n", "Ná»‘i Ä‘á»‰nh vÃ  Ä‘Ã¡y"], "correct": 2},
  {"question": "Cáº§n tá»‘i thiá»ƒu bao nhiÃªu Ä‘iá»ƒm cháº¡m Ä‘á»ƒ trendline cÃ³ giÃ¡ trá»‹?", "options": ["1 Ä‘iá»ƒm", "2 Ä‘iá»ƒm", "3 Ä‘iá»ƒm", "5 Ä‘iá»ƒm"], "correct": 2},
  {"question": "Khi giÃ¡ break trendline tÄƒng, tÃ­n hiá»‡u gÃ¬ xuáº¥t hiá»‡n?", "options": ["Mua máº¡nh", "CÃ³ thá»ƒ Ä‘áº£o chiá»u giáº£m", "KhÃ´ng cÃ³ Ã½ nghÄ©a", "Sideway"], "correct": 1}
]'::jsonb, 70)
ON CONFLICT (id) DO NOTHING;

INSERT INTO quizzes (id, lesson_id, title, questions, pass_score) VALUES
('q-pro-04', 'l-pro-04', 'Kiá»ƒm tra: Support & Resistance', '[
  {"question": "VÃ¹ng há»— trá»£ (Support) lÃ  gÃ¬?", "options": ["VÃ¹ng giÃ¡ mÃ  lá»±c mua máº¡nh hÆ¡n lá»±c bÃ¡n", "VÃ¹ng giÃ¡ mÃ  lá»±c bÃ¡n máº¡nh hÆ¡n lá»±c mua", "ÄÆ°á»ng trung bÃ¬nh Ä‘á»™ng", "VÃ¹ng giÃ¡ khÃ´ng cÃ³ giao dá»‹ch"], "correct": 0},
  {"question": "Khi Support bá»‹ phÃ¡ vá»¡, nÃ³ thÆ°á»ng trá»Ÿ thÃ nh gÃ¬?", "options": ["Support máº¡nh hÆ¡n", "Resistance", "KhÃ´ng cÃ³ Ã½ nghÄ©a", "VÃ¹ng sideway"], "correct": 1}
]'::jsonb, 70)
ON CONFLICT (id) DO NOTHING;

INSERT INTO quizzes (id, lesson_id, title, questions, pass_score) VALUES
('q-pro-07', 'l-pro-07', 'Kiá»ƒm tra: CÃ´ng thá»©c Entry', '[
  {"question": "TrÆ°á»›c khi vÃ o lá»‡nh, cáº§n xÃ¡c nháº­n máº¥y yáº¿u tá»‘?", "options": ["1 yáº¿u tá»‘ lÃ  Ä‘á»§", "Ãt nháº¥t 2 yáº¿u tá»‘", "Ãt nháº¥t 3 yáº¿u tá»‘", "CÃ ng nhiá»u cÃ ng tá»‘t"], "correct": 2},
  {"question": "Signal entry nÃªn Ä‘Æ°á»£c xÃ¡c nháº­n táº¡i vÃ¹ng nÃ o?", "options": ["Báº¥t ká»³ Ä‘Ã¢u trÃªn chart", "Táº¡i vÃ¹ng S/R hoáº·c Supply/Demand", "Chá»‰ táº¡i trendline", "Chá»‰ khi cÃ³ indicator xÃ¡c nháº­n"], "correct": 1}
]'::jsonb, 70)
ON CONFLICT (id) DO NOTHING;

INSERT INTO quizzes (id, lesson_id, title, questions, pass_score) VALUES
('q-pro-09', 'l-pro-09', 'Kiá»ƒm tra: Quáº£n lÃ½ vá»‘n', '[
  {"question": "KhÃ´ng nÃªn risk quÃ¡ bao nhiÃªu % tÃ i khoáº£n cho 1 lá»‡nh?", "options": ["1-2%", "5-10%", "10-20%", "TÃ¹y cáº£m há»©ng"], "correct": 0},
  {"question": "Risk:Reward ratio tá»‘i thiá»ƒu nÃªn lÃ  bao nhiÃªu?", "options": ["1:0.5", "1:1", "1:2", "1:5"], "correct": 2},
  {"question": "Khi thua 3 lá»‡nh liÃªn tiáº¿p, nÃªn lÃ m gÃ¬?", "options": ["Gá»¡ gáº¥p Ä‘Ã´i lot size", "Dá»«ng láº¡i, review láº¡i há»‡ thá»‘ng", "Äá»•i sang cáº·p tiá»n khÃ¡c", "Trading tiáº¿p bÃ¬nh thÆ°á»ng"], "correct": 1}
]'::jsonb, 70)
ON CONFLICT (id) DO NOTHING;
