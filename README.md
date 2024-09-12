# Postgres + PosgREST + Socket.IO

Document is soon...



### PostgreSQL Trigger Function

```sql
CREATE OR REPLACE FUNCTION notify_category_changes()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('category_changes', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
```

### PostgreSQL Trigger

for `insert`,`update` and `delete`

```sql
CREATE TRIGGER category_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON categories
FOR EACH ROW EXECUTE FUNCTION notify_category_changes();
```