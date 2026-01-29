-- Grant admin role to the user
-- User ID: b17d386f-029f-4d5f-97e5-ef8c129aa873
-- Email: admin@ricostacosatelier.com

-- Insert admin role
INSERT INTO user_roles (user_id, role)
VALUES ('b17d386f-029f-4d5f-97e5-ef8c129aa873', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the role was added
SELECT * FROM user_roles WHERE user_id = 'b17d386f-029f-4d5f-97e5-ef8c129aa873';
