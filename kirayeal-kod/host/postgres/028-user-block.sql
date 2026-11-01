-- Staff can block an account: it cannot sign in, its sessions end and its listings disappear from the
-- site until the block is lifted (listings keep their status, so unblocking brings them back).
alter table auth.users add column if not exists blocked_reason text;
alter table auth.users add column if not exists blocked_by uuid;
