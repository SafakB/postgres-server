# Postgres + PosgREST + Socket.IO

Document is soon...

## First things first
- User, passwords
- IP (if you needed)
- Jwt secret key (if you needed) (must be 32 characters)
- Database user,roles and privileges


### 💾 Example Database

Database Name : `blog`

| Table | Fields | Description |
| ------ | ------ | ------ |
| categories | `id`,`title` | Realtime Activated |
| posts | `id`,`title`,`contet` | RLS Enabled (with JWT) |
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

### ⚙️ PostgreSQL Trigger

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


## ℹ️ RLS INFO

#### Example JWT Data
```json
{
  "sub": "72ba45e4-fa0a-4ba5-a955-1c643508eed1", // UUID
  "iat": 1516239022
}
```

### 🔰 RLS Rule

```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY; -- or use pgadmin change RLS enabled
```

```sql
CREATE POLICY only_user_posts
    ON public.posts
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((user_id = auth.jwt_user_id()));
```

### 🔨 JWT Function

```sql
CREATE SCHEMA auth; -- if you needed
```

```sql
CREATE OR REPLACE FUNCTION auth.jwt_user_id() RETURNS uuid LANGUAGE plpgsql STABLE AS $$
DECLARE
  user_id uuid;
BEGIN
  SELECT (current_setting('request.jwt.claims', true)::json->>'sub')::uuid INTO user_id;
  RETURN user_id;
EXCEPTION
  WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'Invalid UUID format in JWT "sub" claim';
END;
$$;
```

