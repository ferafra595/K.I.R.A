# K.I.R.A. — Configurazione D1 gratuita

## Attenzione: usa Workers, non Pages
Il pacchetto KIRA-V1-Foundation.zip usa un Cloudflare Worker con `assets.directory=./public` e binding AI/D1. Pubblica **Workers & Pages > Create > Worker > Import a repository** (la dicitura può variare), non un progetto Pages tradizionale.

## A) Crea il database dal pannello Cloudflare
1. Apri Cloudflare Dashboard > Workers & Pages > D1 SQL Database (oppure Storage & databases > D1).
2. Crea un database chiamato esattamente `kira-db`.
3. Entra nel database > Console e incolla tutto il contenuto di `0001_init.sql`, quindi eseguilo. Se la console non accetta più istruzioni, esegui ogni `CREATE TABLE` e `CREATE INDEX` separatamente.
4. Copia l'**ID database**, un UUID generato da Cloudflare.
5. Nel repository sostituisci `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.jsonc` con l'ID (senza parentesi o apici aggiuntivi).

## B) Collega il database al Worker
Se pubblichi da GitHub usando Workers Builds, la configurazione `wrangler.jsonc` con `d1_databases` dovrebbe rendere disponibile il binding `DB`. Controlla in Worker > Settings > Bindings che sia presente: `DB` -> `kira-db`. Se non compare, aggiungilo manualmente dal pannello.

## C) Secrets obbligatori
Nel Worker > Settings > Variables and Secrets, aggiungi come secret:
- `ADMIN_PASSWORD`: una password lunga e unica
- `SESSION_SECRET`: una stringa casuale differente dalla password, di almeno 32 caratteri
Non inserirli nei file GitHub e non mandarli in chat.

## D) Modulo Workers AI
Verifica che il Worker esponga il binding `AI` di tipo Workers AI. È dichiarato in `wrangler.jsonc` e la chat non funziona senza.

## E) Configura GitHub / Deploy
Il repository deve avere `package.json`, `wrangler.jsonc`, `src/`, `public/` e `migrations/` nella directory root usata dal build. Se carichi la cartella `kira-v1` dentro una cartella ulteriore del repository, configura quella come root. Build command: `npm run deploy` oppure deploy command `npx wrangler deploy` secondo l'interfaccia Workers Builds; install command `npm install`.

## Metodo alternativo con terminale Windows (database e migrazione)
Dalla cartella del progetto:
```powershell
npm install
npx wrangler login
npx wrangler d1 create kira-db
# copia il database_id in wrangler.jsonc
npx wrangler d1 migrations apply kira-db --remote
```

## Avvertenze
Il file SQL crea soltanto lo schema, non i dati. Non crea risorse dentro Cloudflare finché non lo esegui. Resta sul piano gratuito e verifica quote di Workers AI e D1. Il frontend è una V1 e non tutte le funzioni previste sono implementate.
