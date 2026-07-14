-- 在 Supabase Dashboard → SQL Editor 執行一次

-- 1. 啟用 pgvector
create extension if not exists vector;

-- 2. 建立 / 補強 documents 表
create table if not exists documents (
  id bigserial primary key,
  content text not null,
  embedding vector(1024) not null,
  created_at timestamptz not null default now()
);

-- 若表已存在，補上 RAG 需要的欄位
alter table documents add column if not exists source text;
alter table documents add column if not exists source_hash text;
alter table documents add column if not exists chunk_index int;
alter table documents add column if not exists created_at timestamptz;

update documents set source = 'rag.md' where source is null;
update documents set source_hash = 'legacy' where source_hash is null;
update documents set chunk_index = 0 where chunk_index is null;
update documents set created_at = now() where created_at is null;

alter table documents alter column source set default 'rag.md';
alter table documents alter column chunk_index set default 0;
alter table documents alter column created_at set default now();

create index if not exists documents_source_hash_idx
  on documents (source, source_hash);

-- 3. 語意搜尋 RPC
create or replace function match_documents (
  query_embedding vector(1024),
  match_threshold float default 0.2,
  match_count int default 4
)
returns table (
  id bigint,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    (1 - (documents.embedding <=> query_embedding))::float as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
