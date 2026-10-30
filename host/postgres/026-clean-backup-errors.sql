-- Failed backup attempts from before the PostgreSQL fix (syntax error) and copies stopped half-way
-- that were finished later are no longer useful in the panel's history.
delete from public.backup_runs where not ok and (error like 'syntax error%' or error like 'Yarımçıq%');
