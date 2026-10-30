# K.I.R.A. — Conversazione con memoria e chiusura naturale

## GitHub
Sostituisci **solo** `src/index.ts` con quello incluso. Commit e attendi che Cloudflare pubblichi il nuovo deploy.
Nessuna modifica a D1, variabili o secret. Il backend usa le tabelle `conversations` e `messages` già presenti.

## Comando Rapido iPhone
Mantieni l'URL e l'intestazione `Authorization` che adesso funzionano. Elimina l'azione temporanea **Mostra risultato**.

1. Nell'app Comandi Rapidi → `Kira`, aggiungi l'azione **Ripeti** e imposta **10 volte**. Trascina dentro Ripeti le quattro azioni che hai già: **Detta testo**, **Ottieni contenuti dell'URL**, **Ottieni valore per `spoken`**, **Leggi ad alta voce**. Tutte queste devono stare DENTRO Ripeti, nell'ordine indicato.
2. Dopo **Leggi ad alta voce**, sempre dentro Ripeti, aggiungi **Ottieni valore per `end`** riferito al risultato verde di **Ottieni contenuti dell'URL**.
3. Aggiungi **Se** (If): se `Valore dizionario` dell'azione `end` **è vero** (oppure `è 1`, in base alle opzioni mostrate), aggiungi dentro il blocco **Interrompi questo comando rapido**. Chiudi il blocco `Se`.
4. L'azione **Fine ripetizione** deve trovarsi dopo `Se`.

Schema:

Ripeti 10 volte
  Detta testo
  Ottieni contenuti dell'URL (POST, JSON message=Testo dettato, Authorization=Bearer ...)
  Ottieni valore per spoken (risultato dell'azione URL)
  Leggi ad alta voce (valore spoken)
  Ottieni valore per end (risultato dell'azione URL)
  Se end è vero
    Interrompi questo comando rapido
  Fine se
Fine ripetizione

## Prova
- «Ehi Kira» → «Mi dici tre idee per il weekend?»
- Alla dettatura successiva: «Approfondisci la seconda.» (deve ricordarla)
- Alla dettatura successiva: «Kira, fermati.» → «Va bene, a presto!» e il Comando Rapido termina.

Il backend restituisce `end: true` per i comandi di chiusura; senza il blocco `Se`, Siri continuerebbe a chiedere il testo fino alla fine delle ripetizioni.

## Limiti e sicurezza
- La sessione di contesto è collegata al token di questo iPhone: se altri telefoni condividono lo stesso token, condividono anche la conversazione. Per separare dispositivi, in futuro servirà una chiave distinta per dispositivo.
- Il contesto temporaneo si resetta dopo 20 minuti o con il comando di chiusura; la cronologia salvata non viene eliminata automaticamente per semplice inattività, ma viene sostituita al successivo utilizzo. I ricordi salvati separatamente restano invariati.
- iOS può interrompere cicli lunghi, soprattutto a schermo bloccato. Dieci turni sono un test, non ascolto continuo garantito.
- Se una parte del token è stata mostrata pubblicamente, rigeneralo e aggiornalo sul dispositivo.
