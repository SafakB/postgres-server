# Postgres + PosgREST + Socket.IO

Document is soon...

### 💾 Example Database

Database Name : `blog`

| Table | Fields | Description |
| ------ | ------ | ------ |
| categories | `id`,`title` | Realtime Activated |
| posts | `id`,`title`,`contet` | RLS Enabled |
| post_categories | `id`,`post_id`,`catgory_id` |  |


### 🔨 PostgreSQL Trigger Function

```sql
CREATE OR REPLACE FUNCTION notify_category_changes()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('category_changes', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
```

### 🔨 PostgreSQL Trigger

for `insert`,`update` and `delete`

```sql
CREATE TRIGGER category_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON categories
FOR EACH ROW EXECUTE FUNCTION notify_category_changes();
```

### 👂 Listen Postgre Changes on Socket.IO

```js
pgClient.query('LISTEN category_changes');

pgClient.on('notification', (msg) => {
  const payload = JSON.parse(msg.payload);
  io.emit('categoryChanges', payload); // or any logic
});
```
