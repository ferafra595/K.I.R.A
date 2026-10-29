# K.I.R.A. 2.2 — Collega iPhone

## Installazione
1. Aggiorna GitHub con i file `src/index.ts`, `public/app.js`, `public/style.css` e `migrations/0002_shortcut_connections.sql`.
2. Applica la nuova migrazione D1 alla **stessa** banca dati `kira-db`: `npx wrangler d1 migrations apply kira-db --remote` (dalla cartella del progetto, con wrangler.jsonc configurato). In alternativa incolla nella console D1 la singola istruzione SQL del file. Non cancellare le tabelle precedenti.
3. Attendi il deploy, accedi a K.I.R.A. e apri **Collega iPhone**. Il token viene generato dentro K.I.R.A. senza PowerShell e senza aggiungere secret.
4. L'app Comandi Rapidi richiede ancora una configurazione iniziale manuale delle 4 azioni; non è disponibile un'installazione automatica tramite web app.

## Sicurezza
- Solo l'admin autenticato può generare o sostituire il token.
- Il server conserva solo SHA-256 del token.
- Il token è mostrato solo al momento della generazione e può essere copiato dalla schermata attiva.
- Una nuova generazione invalida il token precedente.
- Non condividere la chiave né inserirla in GitHub.
- Se D1 mostra `no such table: shortcut_connections`, la migrazione non è stata applicata.
- L'endpoint Siri risponde con `spoken` ma non invia WhatsApp né effettua chiamate.
