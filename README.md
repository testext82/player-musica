# Basalto

Player web personale che ascolta in streaming FLAC e altri formati audio dalla **cartella dell'app** su Dropbox.

## Privacy
- Accesso Dropbox di tipo *App folder* (solo la cartella dell'app), in lettura (`files.metadata.read`, `files.content.read`).
- Facoltativo: `files.content.write`, solo per salvare preferiti, playlist e ascolti in un unico file,
  `/_player/dati.json`, nella cartella dell'app. Il player non scrive né cancella nient'altro: la musica non viene toccata.
  Senza questo permesso i dati restano solo sul dispositivo.
- Login OAuth PKCE senza server: il permesso resta nel browser del dispositivo, nel codice non c'è nessun segreto.
- La pagina può comunicare solo con Dropbox e con il proprio sito, per `version.json` (Content-Security-Policy). Nessun font, script o servizio esterno. L'unica altra sorgente audio ammessa è `blob:`, cioè i brani precaricati in memoria.
- I brani non vengono salvati: vengono letti in streaming tramite link temporanei di Dropbox.

## Organizzazione delle cartelle
Basta copiare le cartelle degli album così come sono dentro `Applicazioni/<nome app>/`.
L'app ricava artista, album e anno dal nome della cartella e poi li corregge con i tag dei FLAC o con il file `.cue`:
```
Adele - 21 (2011) [FLAC 16-44]/01. Adele - Rolling in the Deep.flac
1983 - Pantera - Metal Magic (LP, …, 24-48)/01 - Ride My Rocket.m4a
Black Sabbath 1970 - Paranoid [SACD] (2010 SHM-SACD ISO) flac 24-48/Paranoid (1) War Pigs.flac
Nirvana - In Utero (…) (2023) [16Bit-44.1kHz] FLAC/Disc 1/01. ….flac
1956. Harry Belafonte - Calypso {AFZ 138}/… .flac + … .cue   (album in un file unico)
Artista/Album/01 Brano.flac                                      (struttura classica)
```
- Copertina: scelta tra le immagini dell'album (cover/folder/front, anche in Artwork, Covers, Scans), scartando retro, disco, booklet; in mancanza, quella incorporata nel FLAC.
- Album in un file unico con `.cue`: i brani vengono ricavati dal `.cue` e la riproduzione passa da uno all'altro senza interruzioni.

## Funzioni (v1.17)

Nome dell'app: Basalto. All'apertura una schermata nera con il solo logo per 1 secondo (v1.18).


v1.21: nella pagina dell'artista, sotto «Notizie», il link alla voce di Wikipedia in italiano (nuova scheda, senza referrer; il player non contatta Wikipedia).

v1.20: barra in basso (lettore ridotto e schede) e menu dal basso semitrasparenti con sfocatura; logo dell'app accanto al titolo «Impostazioni»; corretto il riquadro delle stelle nel menu ⋯ (era enorme).

Novità della v1.19:
- **Interruttori** come quelli di iOS nelle Impostazioni, raccolti nel riquadro «Riproduzione».
- **Volume uniforme** (ReplayGain): legge `REPLAYGAIN_ALBUM_GAIN/PEAK` e `REPLAYGAIN_TRACK_GAIN/PEAK` dai FLAC e applica
  un guadagno fisso per album (o per brano) nel motore Web Audio, in virgola mobile: nessuna compressione, la dinamica
  non cambia, non alza mai oltre il picco del file (al massimo +6 dB). Album senza dati: il valore mediano della libreria.
  I tag si aggiungono per esempio con foobar2000 (ReplayGain › Scan as albums): l'audio non viene modificato.
- **Senza pause tra i brani**: tra brani consecutivi dello stesso album il successivo, già in memoria nel secondo lettore,
  parte qualche millesimo di secondo prima della fine (anticipo misurato e corretto a ogni passaggio). Se non parte in
  tempo o iOS lo rifiuta resta il passaggio normale; dopo due rifiuti a schermo spento lo fa solo a schermo acceso.
- **Valutazioni da 1 a 5 stelle** nel lettore e nel menu ⋯ del brano; si salvano in `dati.json` tra i preferiti
  (chiave `s:`, così le versioni precedenti le conservano). Playlist automatiche «5 stelle» e «4 stelle e più»;
  le stelle pesano nei mix.
- **Booklet e immagini**: nella pagina dell'album, se la cartella contiene immagini, PDF, TIFF o BMP. Le immagini si
  vedono nell'app (anteprime Dropbox da 2048 px, liberate alla chiusura; scorri, pizzica, doppio tocco); i PDF e
  l'originale si aprono in una nuova scheda. L'indice (v2) comprende ora anche pdf/tif/bmp: alla prima apertura
  la libreria viene riletta per intero una volta.
- **Controllo libreria** (Impostazioni › Libreria): copertine mancanti, tag mancanti o diversi nello stesso album,
  numerazione, album e brani doppi, qualità miste, album senza ReplayGain, copertine incorporate pesanti, file non
  letti, formati, anno e genere. «Analizza tutti i brani» legge l'inizio di ogni FLAC (16–64 KB).
- **Statistiche** (Home › I tuoi ascolti): 7 giorni, 30 giorni, 12 mesi, sempre; ascolti, tempo, artisti, album,
  ascolti per giorno/mese e per ora, classifiche, dati della libreria. Oltre i 3000 ascolti i più vecchi restano come
  riepilogo mensile in `dati.json` (`agg`), unito tra dispositivi senza contare due volte lo stesso ascolto.
- I tag letti dai FLAC stanno ora in IndexedDB («mx_meta») invece che in localStorage (spostati alla prima apertura).


Aggiornamenti: all'avvio e quando l'app torna in primo piano (al massimo ogni 10 minuti) la pagina legge
`version.json` dal proprio sito; se c'è una versione nuova mostra «Aggiorna». `version.json` va tenuto
allineato a `VERSION` in index.html a ogni rilascio. In Impostazioni: «Controlla aggiornamenti».


Copertine salvate sul dispositivo (IndexedDB «mx_covers»): miniature fino a 256 px e copertine incorporate
ridotte a 800 px, legate alla revisione del file su Dropbox. All'apertura si vedono subito; dopo l'avvio il
player scarica in sottofondo quelle mancanti. Si cancellano in Impostazioni. Nessun file musicale viene salvato.


Mix da un brano, un album o un artista («Avvia un mix da qui»): stesso artista (al massimo 40%), artisti ascoltati
negli stessi momenti, stesso genere, preferiti. Playlist automatiche: I più ascoltati del mese, Mai ascoltati,
Riscoperte, Hi-res, Ultimi arrivati. La coda si può salvare come playlist. Lo sfondo del lettore prende il colore
della copertina. Icona per la schermata Home (manifest e apple-touch-icon): su iPhone l'app installata ha dati
separati da Safari, quindi chiede di nuovo la chiave e il collegamento a Dropbox.


AirPlay dal lettore (Safari). Coda modificabile: trascina dalla maniglia, togli un brano, svuota.
Home: «Aggiunti di recente» (data di caricamento su Dropbox). Libreria: ordina per nome, artista,
titolo, anno, aggiunti di recente, più ascoltati; filtra per qualità (hi-res / CD) e genere (dal tag GENRE).


Pagina dell'artista: «Notizie» apre Google News sull'artista in una nuova scheda (link diretto, senza referrer;
il player non contatta Google).


Home: «Il tuo mix» (rifatto a ogni apertura della Home, simile agli ultimi ascolti: artisti e album
ascoltati di recente, preferiti, brani mai sentiti, massimo 4 brani per album), album ascoltati di
recente, preferiti (brani, album, artisti) e playlist. Un ascolto conta dopo 30 secondi o metà brano.
Menu ⋯ su ogni brano: preferiti, aggiungi a playlist, riproduci dopo, vai all'album o all'artista.
Cuore nel lettore, nella pagina dell'album e dell'artista. Playlist: crea, rinomina, elimina, sposta
e togli brani; il mix si può salvare come playlist. Con il permesso di scrittura i dati sono uguali
su tutti i dispositivi (vince la modifica più recente, la cronologia si unisce).

Libreria per artisti e album, ricerca, coda con riproduzione casuale e ripetizione, ±10 secondi,
comandi sulla schermata di blocco (brano precedente/successivo), ripresa dal punto interrotto,
aggiornamento incrementale della libreria, diagnostica in Impostazioni.

Equalizzatore sperimentale (spento di default): 10 bande da 31 Hz a 16 kHz e preset
(Piatto, Mega Bass, Bassi, Rock, Pop, Voce, Classica, Acuti, Loudness). Usa Web Audio e
imposta la sessione audio di iOS su "playback", così Safari lo tratta come musica e non
come suono di sottofondo. Spegnendolo il lettore torna subito normale, senza ricaricare la
pagina. Se Dropbox non consente l'accesso richiesto, l'equalizzatore si spegne da solo.

Precarico (attivo di default, disattivabile in Impostazioni): aprendo un album con la musica ferma
il primo brano viene scaricato in memoria; mentre un brano suona, dopo 5 secondi viene scaricato
per intero il successivo (sempre uno avanti). I file sono identici agli originali, il passaggio non
aspetta la rete e il salto nel brano è istantaneo. La memoria si libera al cambio di brano; nulla
viene salvato sul dispositivo. Uscendo da un album il download non finito si interrompe. I file
oltre 150 MB restano in streaming. Il registro misura la partenza di ogni brano e la velocità dei
download.

Lettore di riserva: un secondo lettore tiene pronto il brano successivo (collegato e con l'inizio già
caricato) un secondo dopo l'avvio del brano attuale, e il primo brano quando apri un album. Con lo
schermo acceso ⏭ o un tocco su quel brano lo fanno solo partire. A schermo spento e a fine brano
resta il passaggio sullo stesso lettore (iOS non permette di cambiare lettore in sottofondo).

Ripartenza automatica (attiva di default, disattivabile in Impostazioni): se iOS ferma la musica
mentre è in sottofondo (microfono, Siri, chiamata), riparte quando l'interruzione finisce. Non
riparte dopo una pausa data da te, dopo più di 10 minuti o se il lettore è aperto. Il segnale di
fine interruzione arriva dal motore dell'equalizzatore oppure, se Safari lo fornisce, dalla
sessione audio.
