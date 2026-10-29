# K.I.R.A. V1 — prototipo funzionante (budget 0 €)

Un'app personale privata per Cloudflare Workers Free. Comprende login con password, chat Workers AI, progetti, memoria manuale, attività e laboratorio di file testuali versionati. La sintesi vocale usa le voci del browser. Non contiene un agente Windows, un editor CAD, controllo delle mani o ricerca web: sono funzionalità successive e non vengono simulate.

## Requisiti
- Un account Cloudflare con piano Workers **Free**, senza passare al piano Paid.
- Node.js 20+ e npm sul computer per il deploy.
- Un account GitHub facoltativo (non richiesto).

## Installazione (Windows PowerShell)

1. Decomprimi la ZIP e apri PowerShell nella cartella `kira-v1`.
2. Esegui `npm install`, poi `npx wrangler login`.
3. Crea il DB gratuito:
   ```powershell
   npx wrangler d1 create kira-db
   ```
4. Copia l'ID che ottieni al posto di `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.jsonc`.
5. Crea le tabelle sul DB cloud:
   ```powershell
   npm run db:remote
   ```
6. Configura una password privata lunga, senza inserirla nel repository:
   ```powershell
   npx wrangler secret put ADMIN_PASSWORD
   npx wrangler secret put SESSION_SECRET
   ```
   Per il secondo secret usa una stringa casuale differente di almeno 32 caratteri.
7. Pubblica:
   ```powershell
   npm run deploy
   ```
8. Apri il sito `https://kira-core.<tuo-subdominio>.workers.dev` indicato dal comando. Accedi con `ADMIN_PASSWORD`.

### Sviluppo locale

Copiando `.dev.vars.example` in `.dev.vars`, impostando password e secret di test, puoi usare `npm run db:local` e `npm run dev`. Le richieste a Workers AI possono usare le quote del tuo account anche durante lo sviluppo; resta nel piano Free.

## Limiti reali
- Chat limitata dal codice a **35 chiamate al giorno**, oltre ai limiti Cloudflare. Il contatore aumenta anche se la richiesta AI fallisce.
- Non esiste fatturazione automatica prevista da questo progetto. **Verifica comunque di essere sul piano Free prima di pubblicare.**
- Il modello selezionato è `@cf/meta/llama-3.1-8b-instruct`. Se Cloudflare ne modifica la disponibilità o l'interfaccia, occorre aggiornare la configurazione.
- L'assistente non scrive file automaticamente: puoi copiare il codice generato nella chat e salvarlo nel Project Lab.
- I file del Project Lab sono per ora solo testo (massimo 20.000 caratteri per file); nessun upload PDF o immagini.
- La memoria è aggiunta manualmente, non salva di nascosto informazioni sulle conversazioni.
- Nessuna generazione di voce professionale: la funzione Voce ON usa `speechSynthesis` del browser, se disponibile.
- I progetti eliminati restano senza accesso tramite la lista; si raccomanda un backup prima di cancellarli. La gestione delle cancellazioni a cascata sarà perfezionata in una versione successiva.
- La password viene confrontata tramite PBKDF2 con 100.000 iterazioni per compatibilità con Cloudflare Workers. Sessioni random e memorizzate come hash, cookie HttpOnly Secure SameSite Strict; blocco temporaneo dopo 7 tentativi dalla stessa IP.
- La V1 è per **un solo proprietario**, non per registrazioni pubbliche.

## Percorso futuro
V1.1: generazione di file direttamente tramite strumenti server verificati, download ZIP, upload documenti e miglioramenti privacy.
V2: agente Windows e integrazione FreeCAD/Blender per progetti tecnici reali.
V3: controllo gestuale via webcam con MediaPipe e voce bidirezionale locale.
V4: PWA avanzata, notifiche e dispositivi.
V5: visori mixed reality e Holographic Studio.

## Sicurezza
Non condividere password o valori dei secret. Se dovessi esporli, rigenerali. Esegui `wrangler secret put` solo dal tuo terminale. Nessun pagamento o accesso ai dispositivi esterni è abilitato dal codice.
