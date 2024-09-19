# Postgres + PosgREST + Socket.IO + Nginx + Certbot

- ✨ We are nearing the end...
- 🔥 SSL certificate is now obtained automatically
- 👣 A few more steps for the production version

🏗️I will work a little more on the documentation...

## URLs with Nginx
| App | URL | Description |
| ------ | ------ | ------ |
| PostgreSQL | `domain.com:5432` |  |
| PostgREST | `https://domain.com/` | `/<table_name>`,`/categories`,`/categories?id=gt.3` |
| Open Api | `https://domain.com/` | Auto generated |
| Swagger | `http://domain.com:8080/` | Auto generated (Non-SSL) |
| Socket.IO | `https://domain.com` | Auto working `/socket/index.js` |

## URLs without Ngnix
| App | URL | Description |
| ------ | ------ | ------ |
| PostgreSQL | `127.0.0.1:5432` |  |
| PostgREST | `http://127.0.0.1:3000/` | `/<table_name>`,`/categories`,`/categories?id=gt.3` |
| Open Api | `http://127.0.0.1:3000/` | Auto generated |
| Swagger | `http://127.0.0.1:8080/` | Auto generated |
| Socket.IO | `http://127.0.0.1:4000/` | Auto working `/socket/index.js` |

## ⚠️ First things first (docker.compose.yml)
- Domain name (To use with nginx)
- User, passwords 
- IP (if you needed)
- Jwt secret key (if you needed) (must be 32 characters)
- Database user,roles and privileges

## ⚠️ First things first (nginx.conf)
- Put the SSL block on the comment line for the first run
- Remove the comment lines afterwards because SSL will be received on the first run

```conf
    # First run disable this block
    server {
        listen 443 ssl;
        server_name domain.com;
        ..
    }
```

### 🔐 SSL Renewal
Run this command

`docker compose run certbot certonly --webroot --webroot-path=/var/www/certbot/ -d domain.com`

### 💾 Example Database

Database Name : `blog`

| Table | Fields | Description |
| ------ | ------ | ------ |
| categories | `id`,`title` | Realtime Activated |
| posts | `id`,`title`,`contet` | RLS Enabled (with JWT) |
| post_categories | `id`,`post_id`,`catgory_id` | `post_id_fkey`,`catgory_id_fkey`  |


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


## 🔒 RLS INFO

#### Example JWT Data
```json
{
  "sub": "72ba45e4-fa0a-4ba5-a955-1c643508eed1", /* UUID for RLS*/
  "role": "web_user", /* To override the Claim role */ 
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

### 📄 Example PostgREST queries

- `https://domain.com/posts?id=eq.2`
- `https://domain.com/categories?id=gt.8`
- `https://domain.com/categories?id=in.(1,2,3)`
- `https://domain.com/categories?order=id.desc`
- `https://domain.com/categories?title=like.*life*`
- `https://domain.com/categories?or=(id.eq.1,title.like.*tamer*)`
- `https://domain.com/categories?select=myCatId:id,myTitle:title`
- `https://domain.com/categories?select=id,json_data->>slug,json_data->created_at`
- `https://domain.com/posts_categories?select=id,category:categories(id,title),post:posts(id,title)` (foreign key must be defined)