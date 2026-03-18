-- Migration 012 - community posts, comments, and upvotes

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  tags text[] not null default '{}',
  startup text,
  image_url text,
  discussion_prompt text,
  created_at timestamptz not null default now()
);

create index if not exists idx_community_posts_created_at
  on public.community_posts(created_at desc);
create index if not exists idx_community_posts_user_id
  on public.community_posts(user_id);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_community_comments_post_id
  on public.community_comments(post_id, created_at desc);
create index if not exists idx_community_comments_user_id
  on public.community_comments(user_id);

create table if not exists public.community_post_upvotes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists idx_community_post_upvotes_user_id
  on public.community_post_upvotes(user_id);

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_post_upvotes enable row level security;

drop policy if exists "community posts are viewable by everyone" on public.community_posts;
create policy "community posts are viewable by everyone"
  on public.community_posts for select
  using (true);

drop policy if exists "authenticated users can create community posts" on public.community_posts;
create policy "authenticated users can create community posts"
  on public.community_posts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users can delete their own community posts" on public.community_posts;
create policy "users can delete their own community posts"
  on public.community_posts for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "community comments are viewable by everyone" on public.community_comments;
create policy "community comments are viewable by everyone"
  on public.community_comments for select
  using (true);

drop policy if exists "authenticated users can create comments" on public.community_comments;
create policy "authenticated users can create comments"
  on public.community_comments for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users can delete their own comments" on public.community_comments;
create policy "users can delete their own comments"
  on public.community_comments for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "community upvotes are viewable by everyone" on public.community_post_upvotes;
create policy "community upvotes are viewable by everyone"
  on public.community_post_upvotes for select
  using (true);

drop policy if exists "authenticated users can create upvotes" on public.community_post_upvotes;
create policy "authenticated users can create upvotes"
  on public.community_post_upvotes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users can delete their own upvotes" on public.community_post_upvotes;
create policy "users can delete their own upvotes"
  on public.community_post_upvotes for delete
  to authenticated
  using (auth.uid() = user_id);

alter publication supabase_realtime add table public.community_posts;
alter publication supabase_realtime add table public.community_comments;
alter publication supabase_realtime add table public.community_post_upvotes;
