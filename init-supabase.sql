-- =========================================================================
-- Supabase 数据库表初始化脚本 (init-supabase.sql)
-- 请在 Supabase 控制台的 SQL Editor 中粘贴并执行以下全部内容
-- =========================================================================

-- 1. 开启 UUID 扩展支持
create extension if not exists "uuid-ossp";

-- 2. 创建分类表 (categories)
create table if not exists public.categories (
  id text primary key, -- 沿用原本的 'cat-xxx' 或用户自定义的 ID 字符串
  user_id uuid references auth.users(id) on delete cascade default auth.uid(), -- 归属用户 ID
  name text not null,
  icon text not null,
  color text not null,
  "order" integer not null default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 创建链接表 (links)
create table if not exists public.links (
  id text primary key, -- 沿用原本的 'link-xxx' 或自定义 ID
  user_id uuid references auth.users(id) on delete cascade default auth.uid(), -- 归属用户 ID
  category_id text references public.categories(id) on delete cascade not null, -- 外键级联删除
  title text not null,
  url text not null,
  description text,
  icon text not null,
  clicks integer not null default 0,
  "order" integer not null default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. 创建外观配置表 (appearance)
create table if not exists public.appearance (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(), -- 每个用户有且仅有一条配置
  bg_style text not null default 'morandi-glow',
  custom_bg_url text default '',
  card_opacity numeric not null default 0.65,
  card_blur integer not null default 20,
  primary_color text not null default 'blue',
  font_style text not null default 'system-sans',
  font_custom_link text default '',
  font_family_name text default '',
  scrollbar_enabled boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. 开启行级安全策略 (Row Level Security - RLS)
alter table public.categories enable row level security;
alter table public.links enable row level security;
alter table public.appearance enable row level security;

-- =========================================================================
-- 配置 RLS 策略 (Policies)
-- =========================================================================

-- 5.1 分类表 (categories) 策略
-- 仅所有者可以读取、新增、更新、删除分类
create policy "Allow owners to read categories" 
  on public.categories for select using (auth.uid() = user_id);

create policy "Allow owners to insert categories" 
  on public.categories for insert with check (auth.uid() = user_id);

create policy "Allow owners to update categories" 
  on public.categories for update using (auth.uid() = user_id);

create policy "Allow owners to delete categories" 
  on public.categories for delete using (auth.uid() = user_id);


-- 5.2 链接表 (links) 策略
-- 仅所有者可以读取、操作链接
create policy "Allow owners to read links" 
  on public.links for select using (auth.uid() = user_id);

create policy "Allow owners to insert links" 
  on public.links for insert with check (auth.uid() = user_id);

create policy "Allow owners to update links" 
  on public.links for update using (auth.uid() = user_id);

create policy "Allow owners to delete links" 
  on public.links for delete using (auth.uid() = user_id);


-- 5.3 外观配置表 (appearance) 策略
-- 仅所有者可以读取、操作外观配置
create policy "Allow owners to read appearance" 
  on public.appearance for select using (auth.uid() = user_id);

create policy "Allow owners to insert appearance" 
  on public.appearance for insert with check (auth.uid() = user_id);

create policy "Allow owners to update appearance" 
  on public.appearance for update using (auth.uid() = user_id);

create policy "Allow owners to delete appearance" 
  on public.appearance for delete using (auth.uid() = user_id);

-- =========================================================================
-- 对象存储桶 (Storage Bucket) 安全策略
-- =========================================================================

-- 存储桶对象表开启行级安全策略
alter table storage.objects enable row level security;

-- 1. 允许所有人下载（Select）桶 "mora-assets" 中的资源
create policy "Allow public download" on storage.objects
  for select using (bucket_id = 'mora-assets');

-- 2. 仅允许已登录的拥有者上传（Insert）到以自己 UUID 命名的子目录下
create policy "Allow authenticated upload" on storage.objects
  for insert with check (
    bucket_id = 'mora-assets' 
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. 仅允许拥有者更新（Update）自己的资产
create policy "Allow owners to update assets" on storage.objects
  for update using (
    bucket_id = 'mora-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. 仅允许拥有者删除（Delete）自己的资产
create policy "Allow owners to delete assets" on storage.objects
  for delete using (
    bucket_id = 'mora-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =========================================================================
-- 会员档案表归档记录 (profiles)
-- =========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user',
  allow_upload boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 开启 RLS
alter table public.profiles enable row level security;

-- 1. 用户只能查看自己的资料
create policy "Allow users to read own profile"
  on public.profiles for select using (auth.uid() = id);

-- 2. 管理员可以查看所有资料
create policy "Allow admins to read all profiles"
  on public.profiles for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 3. 用户只能更新自己的资料（排除 role 字段的控制通常在应用层或通过更复杂的 policy 处理，这里先做基础权限隔离）
create policy "Allow users to update own profile"
  on public.profiles for update using (auth.uid() = id);

-- =========================================================================
-- 索引配置 (Indexes) - 提升数据库在大并发和多用户查询下的吞吐和检索性能
-- =========================================================================
create index if not exists idx_categories_user_id on public.categories(user_id);
create index if not exists idx_links_user_id on public.links(user_id);
create index if not exists idx_links_category_id on public.links(category_id);


-- =========================================================================
-- 全站全局配置表 (site_config)
-- =========================================================================
create table if not exists public.site_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 开启行级安全策略
alter table public.site_config enable row level security;

-- 1. 所有人都可以读取配置
create policy "Allow public read access to site_config" 
  on public.site_config for select using (true);

-- 2. 仅管理员可以插入/更新/删除配置
create policy "Allow admins to modify site_config" 
  on public.site_config for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- =========================================================================
-- 注册安全校验触发器
-- =========================================================================

-- 创建校验函数
create or replace function public.check_registration_enabled()
returns trigger as $$
begin
  if not exists (
    select 1 from public.site_config 
    where key = 'allow_registration' 
    and (value::jsonb)::boolean = true
  ) then
    raise exception '注册功能已关闭，请联系管理员。';
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- 绑定触发器到 auth.users 表
-- 即使攻击者绕过前端直接调用 API，数据库也会拦截插入操作
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  before insert on auth.users
  for each row execute function public.check_registration_enabled();

