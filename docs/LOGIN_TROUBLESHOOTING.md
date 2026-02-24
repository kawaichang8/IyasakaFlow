# ログインできなくなった場合の対処

**ローカルを使わず Vercel + Supabase のみで運用している場合**は、[デプロイ手順の「ローカルを使わずに運用する場合」](../デプロイ手順.md#ローカルを使わずに運用する場合vercel--supabase-のみ)を参照してください。DB のテーブル作成（db push）や管理者作成（create:admin）は **GitHub Actions の「DB Setup」** で手動実行できます。

---

## 原因（Supabase に切り替えた場合）

1. **アプリは `.env.local` の `DATABASE_URL` を参照します**  
   `.env` だけ Supabase にしても、`npm run dev` 実行時は `.env.local` が優先されます。  
   `.env.local` が localhost のまま → DB に繋がらずログインできません。

2. **Supabase 側にユーザーが存在しない**  
   これまでローカル DB で使っていたユーザーは、Supabase にはコピーされていません。

---

## 手順

### 1. `.env.local` に Supabase の DATABASE_URL を設定する

- `.env` にある **Supabase 用の `DATABASE_URL` の行全体**をコピーする  
  （`postgresql://postgres:...@db.xxx.supabase.co:5432/postgres` の形式）
- `.env.local` を開き、**`DATABASE_URL=` の行を、コピーした内容に書き換える**（または同じ内容の行を追加する）
- 保存する

これでアプリ起動時に Supabase に接続されます。

### 2. Supabase にユーザーを作成する（シード実行）

ターミナルで以下を実行します（`.env` の `DATABASE_URL` が Supabase を指している必要があります）:

```bash
npm run db:seed
```

- **「Can't reach database server」になる場合:** `.env` の `DATABASE_URL` の末尾に `?sslmode=require` を付けてみてください（Supabase は SSL 必須のことがあります）。  
  例: `...postgres` → `...postgres?sslmode=require`
- シードは **ご自身の環境（Supabase に接続できるネットワーク）** で実行してください。

次のテストアカウントが作成されます:

| メール | パスワード |
|--------|------------|
| admin@crm-app.example.com | Admin123! |
| sales@crm-app.example.com | Sales123! |

### 3. 管理者ユーザーを1件だけ作成する（シードが重い・失敗する場合）

シード全体ではなく、管理者だけ作成する場合:

- **ローカルで実行**: `npm run create:admin`（`.env` の `DATABASE_URL` が Supabase を指していること）
- **ローカルを使わない場合**: GitHub の **Actions** → **DB Setup** を実行し、「管理者ユーザー作成」をオンにして Run する

成功すると **admin@crm-app.example.com** / **Admin123!** でログインできます。

### 4. ログインする

- アプリを再起動: `npm run dev` を一度止めてから再度実行
- ログインページで **admin@crm-app.example.com** / **Admin123!** でログイン

---

---

## Vercel でログインできない場合

再デプロイしても「メールアドレスまたはパスワードが正しくありません」になる場合は、**Vercel のログで原因を確認**してから環境変数や DB を確認してください。

### 原因の切り分け（Vercel のログを見る）

アプリではログイン試行時にサーバー側で `[auth]` のログを出しています。

1. **Vercel ダッシュボード** → 対象プロジェクト → **Logs** または **Deployments** → 最新デプロイ → **Functions**
2. ログインを一度試したあと、ログを開き **「[auth]」** で検索する。
3. 出ているメッセージで原因を判断する:
   - **`[auth] DB error in authorize`** … Vercel から DB に接続できていない（`DATABASE_URL` の誤り、Supabase の Session Pooler 未使用、プロジェクト停止など）
   - **`[auth] authorize: user not found`** … そのメールのユーザーが DB にいない（Vercel の `DATABASE_URL` が別の DB を指している、または create:admin が別 DB で実行された）
   - **`[auth] authorize: user has no password`** … ユーザーはいるがパスワードが NULL（create:admin の実行失敗や別手段で作成したユーザー）
   - **`[auth] authorize: password mismatch`** … パスワードが一致していない（別 DB のユーザーで作ったハッシュ、または入力ミス）

原因が分かったら、下記の環境変数確認や「同じ DATABASE_URL で create:admin をやり直す」などで対処してください。

### 必須の環境変数（3つ）

### 必須の環境変数（3つ）

| 変数名 | 設定内容 |
|--------|----------|
| **DATABASE_URL** | Supabase の接続URL（ローカルの `.env.local` と同じ値）。末尾に `?sslmode=require` を付ける。 |
| **AUTH_SECRET** | 認証用シークレット。未設定だとログインが不安定になる。`openssl rand -base64 32` で生成した文字列。 |
| **AUTH_URL** | **Vercel の本番URL そのもの**（例: `https://iyasaka-flow.vercel.app`）。`https://` を含め、末尾に `/` は付けない。 |

- **AUTH_URL** を入れ忘れていると、NextAuth のコールバック先がずれてログインに失敗することがあります。  
- 設定・変更したあとは **Redeploy** を実行してください（環境変数は再デプロイで反映されます）。

### 確認手順

1. Vercel のダッシュボード → 対象プロジェクト → **Settings** → **Environment Variables**
2. `DATABASE_URL`・`AUTH_SECRET`・`AUTH_URL` が **Production** に設定されているか確認
3. **Deployments** タブで **Latest** の「⋯」→ **Redeploy** を実行
4. デプロイ完了後、**admin@crm-app.example.com** / **Admin123!** でログインを試す

---

## 新規登録に失敗する場合（「登録に失敗しました」と出る）

1. **画面に表示されるエラーコードを確認する**  
   メッセージの末尾に `[P2021]` や `[P2010]` などが出ている場合:
   - **P2021 / P2010**: 本番DBにテーブルが存在しません。
   - **ローカルで実行する場合**: `DATABASE_URL="Vercelの環境変数と同じ接続URL" npx prisma db push` を実行（接続URLは Vercel の Settings → Environment Variables の `DATABASE_URL` をコピー。Supabase の場合は末尾に `?sslmode=require` を付ける）。
   - **ローカルを使わない場合**: GitHub の **Settings → Secrets** に `DATABASE_URL` を登録したうえで、**Actions** → **DB Setup** を実行し、「Prisma db push」をオンにして Run する。

2. **Vercel の DATABASE_URL（Supabase）の形式**  
   - Supabase の **Settings → Database** で、**Connection string** の **Transaction** モード（ポート 6543）を使うと、Vercel のようなサーバーレスで接続数制限に当たりにくくなります。  
   - 例: `postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require`  
   - 既に **Session** モード（ポート 5432）で接続できている場合はそのままで構いません。接続エラーになる場合に Transaction モードを試してください。

3. **Vercel の Function ログで原因を確認する**  
   - Vercel ダッシュボード → **Deployments** → 対象デプロイ → **Functions** タブ、または **Logs** で、`/api/auth/register` 実行時の `Registration error` ログを確認すると、DB接続エラーや Prisma のメッセージが分かります。

---

## 自分用のアカウントでログインしたい場合

- ログインページの「新規登録」から新しいアカウントを作成し、そのメール・パスワードでログインできます。
- 上記シード実行後でも、同じメールがなければ新規登録できます。
