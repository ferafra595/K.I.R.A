# K.I.R.A. V2 – Rilascio integrato (budget 0 €)

## Installazione
Sostituisci l’intero repository con i file dello ZIP, **conservando il tuo database_id D1** nel `wrangler.jsonc` di produzione. Non ricreare D1. Conserva gli stessi secret ADMIN_PASSWORD e SESSION_SECRET. Verifica il nuovo deploy e prova prima su un ambiente di test.

## Funzioni collegate
- Chat AI in Workers AI; memoria D1, conversazioni, task, cronologia, autenticazione.
- Project Lab: genera e modifica file tramite risposta strutturata dell'AI, archivia revisioni in D1, esporta uno ZIP reale, preview HTML/CSS, controlli statici dei link locali e JSON.
- Nessun template di siti attivato automaticamente dalla chat. Il comando esplicito in Project Lab genera file veri, oppure restituisce un errore.
- Nessun pagamento automatico: usa la quota Workers AI gratuita, con limite giornaliero prudenziale.

## Limiti reali
Il modello gratuito ha capacità limitate e può non restituire JSON valido o codice di qualità. Il controllo verifica formato, riferimenti locali e limiti; **non equivale a test nel browser, build JavaScript, sicurezza o qualità grafica**. Alcune pagine richiedono più iterazioni. Non esistono nella V2 agent desktop, CAD, ricerca web nativa, visori o AI universale. Non sono simulati.

## Test suggeriti
1. Login; crea progetto “Prova Kira”; usa Genera con richiesta per una landing completa in unico `index.html` con CSS interno.
2. Apri Anteprima, verifica visivamente; Controlla file; Esporta ZIP, apri l'archivio.
3. Richiedi modifica al progetto, verifica nuova versione e risultato.
4. Controlla che conversazioni, ricordi e task precedenti siano presenti.
