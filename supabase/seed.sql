-- Categories
insert into public.categories (id, name, slug, description, sort_order) values
  ('11111111-1111-1111-1111-111111111001', 'World', 'world', 'Global reporting and politics', 1),
  ('11111111-1111-1111-1111-111111111002', 'Business', 'business', 'Markets and commerce', 2),
  ('11111111-1111-1111-1111-111111111003', 'Lifestyle', 'lifestyle', 'Culture and everyday life', 3),
  ('11111111-1111-1111-1111-111111111004', 'Acute Social Issues', 'acute-social-issues', 'Attention, devices, and social change', 4);

-- Authors
insert into public.authors (id, name, slug, avatar_url, bio) values
  ('22222222-2222-2222-2222-222222222001', 'Yagami Souichirou', 'yagami-souichirou', null, null),
  ('22222222-2222-2222-2222-222222222002', 'Lind Tailor', 'lind-tailor', null, null),
  ('22222222-2222-2222-2222-222222222003', 'Alexa Ruyk', 'alexa-ruyk', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80', null),
  ('22222222-2222-2222-2222-222222222004', 'Mira Chen', 'mira-chen', null, null),
  ('22222222-2222-2222-2222-222222222005', 'Jonah Ellis', 'jonah-ellis', null, null),
  ('22222222-2222-2222-2222-222222222006', 'Priya Nair', 'priya-nair', null, null),
  ('22222222-2222-2222-2222-222222222007', 'Owen Blake', 'owen-blake', null, null),
  ('22222222-2222-2222-2222-222222222008', 'Helena Voss', 'helena-voss', null, null),
  ('22222222-2222-2222-2222-222222222009', 'Sam Ortega', 'sam-ortega', null, null);
