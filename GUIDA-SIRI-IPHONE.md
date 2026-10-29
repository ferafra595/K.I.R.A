# K.I.R.A. V2.1 — «Ehi Siri, Kira» (budget 0 €)

## Cosa è operativo
L’iPhone detta una domanda, invia la richiesta al Worker K.I.R.A., legge una risposta testuale e la pronuncia ad alta voce. Non apre una conversazione continua e non comanda ancora WhatsApp, chiamate o altre app.

## 1 — GitHub e Cloudflare
1. Carica la V2.1 su GitHub mantenendo il valore `database_id` che hai già nel tuo `wrangler.jsonc` attuale. Non eseguire migrazioni e non toccare D1.
2. In Cloudflare → Worker K.I.R.A. → Settings → Variables and Secrets, aggiungi **Secret** `KIRA_SHORTCUT_TOKEN`. NON usare la password ADMIN_PASSWORD.
3. Genera il token su Windows PowerShell:
```powershell
$b = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Fill($b)
[Convert]::ToBase64String($b)
```
4. Copia la stringa prodotta come valore del Secret, salva e verifica il deploy. Non inviare il token a nessuno e non inserirlo su GitHub.

## 2 — Crea il comando rapido su iPhone
1. Apri **Comandi Rapidi** → **+** → rinomina il comando `Kira`.
2. Aggiungi l’azione **Detta testo**; lingua Italiano.
3. Aggiungi l’azione **Ottieni contenuti URL**. Imposta l’URL `https://IL-TUO-WORKER.workers.dev/api/shortcut/ask` (sostituiscilo con il tuo indirizzo HTTPS effettivo).
4. Metodo **POST**, Corpo della richiesta **JSON** con chiave `message` e valore la variabile **Testo dettato** uscita da Detta testo.
5. In **Intestazioni**, aggiungi `Authorization` con valore `Bearer IL_TUO_TOKEN` e `Content-Type` con valore `application/json` (se l’app non lo imposta automaticamente).
6. Aggiungi **Ottieni valore dal dizionario**, chiave `spoken`, prendendolo dal risultato dell’azione Ottieni contenuti URL.
7. Aggiungi **Pronuncia testo**, usando il valore `spoken`. Configura una voce italiana in Comandi Rapidi se disponibile.
8. Prova toccando il comando. Poi prova: **«Ehi Siri, Kira»**. Siri avvierà il comando, e i passaggi raccoglieranno il testo e pronunceranno la risposta.

Nota: i nomi delle azioni possono cambiare leggermente secondo la versione iOS e la lingua. Alcune esecuzioni possono richiedere sblocco, autorizzazioni o conferma; l'ascolto continuo a Kira con app chiusa non è implementabile come una wake word di sistema.

## Sicurezza e limiti
- Token della scorciatoia separato dalla password web. Chi possiede il token può utilizzare l’endpoint AI: proteggilo.
- Le richieste sono limitate allo stesso contatore gratuito dell’AI (35 operazioni/giorno nella versione attuale).
- Non abilita WhatsApp, chiamate, email né apertura di app. Queste richiederanno azioni iOS dedicate e una rubrica con consenso; in futuro le operazioni con effetti esterni dovranno chiedere conferma.
- Siri e «Pronuncia testo» possono avere limitazioni quando l’iPhone è bloccato o in modalità risparmio energetico.
- Non inserire il token in schermate, video o repository pubblici. Se compromesso, rigeneralo in Cloudflare e aggiorna Comandi Rapidi.
- Nessuna API a pagamento aggiunta. Rimangono le quote del piano gratuito Cloudflare.

## Test di verifica
Con Kira avviato da Siri chiedi «Che cosa sei in grado di fare adesso?». Deve rispondere a voce senza dire di avere inviato WhatsApp o chiamato nessuno.
