# Basalto

Player web personale che ascolta in streaming FLAC e altri formati audio dalla **cartella dell'app** su Dropbox.

## Privacy
- Accesso Dropbox di tipo *App folder* (solo la cartella dell'app), in lettura (`files.metadata.read`, `files.content.read`).
- Facoltativo: `files.content.write`, solo per salvare preferiti, playlist e ascolti nel file
  `/_player/dati.json`; se nel Remix si usa la batteria vera, i suoni e i ritmi in `/_batteria/`; i remix salvati, come file nuovi, in `/Remix/`. Sempre nella cartella dell'app.
  Il player non scrive né cancella nient'altro: la musica non viene toccata.
  Senza questo permesso i dati restano solo sul dispositivo.
- Login OAuth PKCE senza server: il permesso resta nel browser del dispositivo, nel codice non c'è nessun segreto.
- La pagina può comunicare solo con Dropbox e con il proprio sito, per `version.json` (Content-Security-Policy). Nessun font, script o servizio esterno. L'unica altra sorgente audio ammessa è `blob:`, cioè i brani precaricati in memoria.
- I brani si ascoltano in streaming tramite link temporanei di Dropbox. Dalla v1.52 restano sul telefono solo quelli che scegli di scaricare (album, playlist, singoli brani), identici ai FLAC originali, nella memoria di Basalto (non nell'app File); si tolgono quando vuoi da «Scaricati».
- `sw.js` (v1.52) tiene sul telefono una copia dei soli file del sito, per aprire Basalto anche senza rete. Non tocca Dropbox, MusicBrainz o Wikipedia. Per spegnerla basta pubblicare un `sw.js` che chiama `self.registration.unregister()`.

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


v1.59: cambio rapido cuffie/casse dal lettore. Sotto i comandi c'è una scritta con l'uscita in uso (per esempio «HiFiMAN Ananda Stealth · crossfeed medio» o «Nobsound + SB-PS10», con l'icona delle cuffie o della cassa; in verde se c'è una correzione). Un tocco apre la scelta: cuffie, casse, «Nessuna correzione» e «Regolazioni», che apre il pannello EQ. La musica non si ferma.

v1.60: radio. In Home (e nella pagina «Radio») sei stazioni fisse: Rai Radio 1, 2 e 3 (MP3), Radio Deejay e Radio Capital (AAC in HLS), Lifetime-Radio (laut.fm, MP3). Suonano in un lettore separato da quello della libreria: la coda resta com'è, far partire un brano spegne la radio e viceversa. Mini-lettore e schermata di blocco mostrano stazione e, dove la radio lo manda, il titolo in onda (Lifetime-Radio dal servizio pubblico di laut.fm, Deejay e Capital dai metadati del flusso); ⏮ ⏭ cambiano stazione, niente barra del tempo. Ripartenza automatica dopo vocali e chiamate come per la musica; dopo una pausa di oltre 20 s riaggancia la diretta. Per ogni stazione più indirizzi: se uno non risponde passa al successivo e ricorda quello buono. Correzione cuffie/casse, crossfeed ed equalizzatore non si applicano alla radio. Regole di sicurezza della pagina: aggiunti solo *.rai.it, *.msvdn.net e *.laut.fm (audio; Lifetime-Radio passa da lifetimeradio.stream.laut.fm) e api.laut.fm (titolo in onda); un indirizzo bloccato finisce nel registro.

v1.61: ripartenza dopo un vocale di WhatsApp (o una chiamata). Il registro mostra che iOS congela Basalto mentre è in sottofondo e non suona: l'avviso «interruzione finita» (e perfino i timer) arrivano solo quando torni in Basalto. Ora, se l'interruzione era iniziata con Basalto in sottofondo, la musica o la radio ripartono appena rientri in Basalto (entro 10 minuti, interruttore «Ripartenza automatica»); se iOS non manda proprio l'avviso ma il sensore dice che l'interruzione è finita, riparte lo stesso. Il controllo «pausa senza interruzione» (cuffie scollegate) non decide più se arriva in ritardo per il congelamento. Radio: due ▶ arrivati insieme dalla schermata di blocco riagganciano la diretta una volta sola; nel registro l'inizio di un'interruzione compare una volta.

v1.62: radio, mentre si collega mini-lettore, pagina Radio e schermata di blocco dicono «Collegamento…» (Deejay e Capital possono metterci 5-8 s: con ⏸ e niente suono sembrava ferma, e un tocco la metteva in pausa). Se tutti gli indirizzi falliscono compare «Non raggiungibile». Resta il limite di iOS: durante un vocale Basalto è congelato e riparte solo quando torni in Basalto.
v1.58: crossfeed per le cuffie (Spento, Leggero, Medio, Forte), con l'algoritmo bs2b di Boris Mikhaylov e i suoi tre livelli classici (650 Hz/9,5 dB, 700 Hz/6 dB, 700 Hz/4,5 dB). A ogni orecchio arriva un po' del canale opposto, filtrato e appena in ritardo, come con le casse: il suono si sposta davanti e stanca meno nei dischi con la stereofonia molto separata. Attivo solo con una cuffia scelta (con le casse succede già da sé), mai sopra il livello d'ingresso, brani mono al centro; le voci al centro perdono 1–2 dB sugli acuti, come nell'originale. Le regolazioni di cuffie e casse ora stanno ciascuna sotto la propria riga.
v1.57: correzione cuffie e casse uniformata: «Nessuna» anche nella riga delle casse (ogni riga ha la sua; ne resta attiva una sola in tutto), tolto il tasto «Confronta». Per le cuffie nuovo cursore «Intensità» (0–100%, salvato per ogni cuffia): la correzione AutoEQ si fa più leggera in proporzione su tutte le frequenze, e il volume di sicurezza si ricalcola.
v1.56: correzione anche per le casse. Nel pannello EQ («Correzione cuffie e casse») ci sono due impianti: «Nobsound + SB-PS10» (passa-alto a 65 Hz che toglie i bassi più profondi che i satelliti non riescono a riprodurre, così distorcono meno e il woofer non soffre a volume alto, e +4,5 dB intorno ai 100 Hz) e «Technics CA10» con le SB-CA10, dal Fosi DS1 (+3 dB sotto i 100 Hz, −1,5 dB sugli acuti). Per queste casse non esistono misure e la stanza conta molto, quindi sono profili di partenza da regolare a orecchio con i cursori Bassi, Medi e Alti (±6 dB, salvati per ogni impianto). Il volume si abbassa da solo del picco della correzione, ricalcolato a ogni modifica. Nuovo tasto «Confronta: ascolta senza correzione», per cuffie e casse: esclude i filtri allo stesso volume, senza fermare la musica.
v1.55: nella correzione cuffie resta solo la HiFiMAN Ananda Stealth (tolte Ananda originale e Nano); chi aveva scelto un'altra Ananda passa da solo alla Stealth (misura oratory1990, volume −4,7 dB).
v1.54: correzione cuffie. Nel pannello EQ del lettore (e nelle Impostazioni) si sceglie la cuffia in uso: Meze Alba, HiFiMAN Ananda (anche Stealth e Nano) o Beats Fit Pro. Basalto applica i filtri misurati da AutoEQ (github.com/jaakkopasanen/AutoEq, licenza MIT; misure di Super Review, oratory1990 e Rtings), che portano la risposta verso la curva di riferimento di AutoEQ basata sulle ricerche Harman. I dati sono scritti nell'app: nessuna richiesta esterna. Filtri uguali a quelli di AutoEQ (scarto sotto 0,04 dB), volume abbassato del picco della correzione per non distorcere (da −2,1 a −5,6 dB secondo la cuffia). La correzione passa dal motore audio come l'equalizzatore, si somma ai suoi preset, sta in fondo alla catena (corregge anche batteria e basso del remix) e non entra nei remix salvati. Il DAC Fosi DS1 non va corretto: la sua risposta è lineare (20 Hz–20 kHz ±0,5 dB).
v1.53: ripresa dopo un vocale di WhatsApp. A volte iOS fa ripartire il lettore da solo prima che l'interruzione sia finita davvero: il lettore risulta «in riproduzione» ma il tempo resta fermo e non si sente niente finché non si toccano pausa e ▶. Ora, quando è iOS a far ripartire la musica, Basalto controlla dopo 2 secondi che il tempo vada avanti; se è fermo fa da solo pausa e ▶, se non basta ricarica il brano dal punto in cui era, e se non basta ancora lo rimette in pausa (così la schermata di blocco mostra ▶ invece di contare a vuoto). Con l'equalizzatore riaccende anche il motore audio. Tutto scritto nel registro.
v1.52: ascolto senza rete. Nella pagina di un album o di una playlist c'è la riga «Scarica»; per un solo brano il menu ⋯. I file scaricati sono copie identiche dei FLAC su Dropbox (nessuna conversione), salvati nella memoria di Basalto a pezzi da 8 MB: un download interrotto (rete che cade, app chiusa) riparte da dove era arrivato. Le playlist scaricate restano allineate: i brani aggiunti si scaricano da soli, quelli tolti si cancellano. I brani scaricati suonano sempre dal telefono, anche con la rete: partenza immediata, spostamenti esatti, passaggi senza pause, nessun dato usato. I download si fermano mentre un brano in streaming parte o si sta scaricando in memoria, per non rubare rete alla musica; vanno avanti mentre Basalto è aperta o la musica suona. Senza rete: la libreria resta navigabile, i brani non scaricati sono più chiari, la coda salta quelli non scaricati, e in Home c'è l'avviso. Nuova pagina «Scaricati» (dalla Home e dalle Impostazioni) con spazio occupato e «Togli tutti i download». In più l'app si apre anche senza nessuna rete: la pagina arriva sempre dalla rete come prima (aggiornamenti invariati), e se la rete non risponde entro 3,5 s si apre la copia salvata sul telefono.
v1.51: foto della biografia presa da Dropbox. Anche con il Referer (v1.50) l'app sul telefono non riceve le foto da upload.wikimedia.org (25/11 sera: «Load failed» a 960 e 500 px e foto vuota anche caricata direttamente), mentre il testo di Wikipedia arriva. Ora, se il telefono non ce la fa, la foto la scaricano i server di Dropbox (files/save_url) direttamente nella cartella dell'app, /_player/schede/Artisti/, e il telefono la legge da lì. Vale anche per le schede già salvate senza foto (Pearl Jam, Black Sabbath, The Beatles): basta riaprirle. Nel registro: perché il telefono non l'ha ricevuta (regole della pagina, server che non risponde all'app o permessi CORS) e se Dropbox ce l'ha fatta.

v1.50: foto della biografia: per le sole foto di Wikimedia Basalto manda l'indirizzo del sito (https://testext82.github.io/, senza percorso), che altrimenti non manda mai (meta referrer «no-referrer»). Dal 2026 upload.wikimedia.org rifiuta spesso le richieste senza «Referer» (Phabricator T413570): «Load failed» anche a 500 px e foto non visibile nemmeno caricata direttamente (25/11, Pearl Jam, Black Sabbath, Beatles). Le foto rimaste «da Wikimedia» vengono riscaricate e salvate su Dropbox appena si apre la scheda; una foto che non arriva non lascia più un riquadro vuoto.

v1.49: foto della biografia chiesta a Wikimedia come miniatura larga esattamente 960 px (se non va 500 px): la miniatura della voce è calcolata sul lato più lungo, e una foto verticale aveva una larghezza fuori standard → «429», in Safari «Load failed» (Pearl Jam anche con la v1.48). Se la voce italiana non ha una foto prendo quella della voce inglese. Il registro dice la misura usata o l'errore preciso. Se la foto non si lascia scaricare, la mostro direttamente da Wikimedia (non salvata su Dropbox).

v1.48: foto della biografia chiesta a 960 px, una delle misure standard di Wikimedia: con 900 px Wikimedia rispondeva «429» (registro del 25/11: «foto non scaricata (Load failed)» per i Pearl Jam). Per le schede già salvate senza foto basta «Aggiorna da Wikipedia».

v1.47: **biografia dell'artista e storia del disco, avvio più rapido con rete debole**.
- Biografia (pagina dell'artista) e «Il disco» (pagina dell'album): la voce intera di Wikipedia in italiano, in inglese se quella italiana non c'è, senza note e collegamenti. La voce giusta si trova con MusicBrainz → Wikidata (niente omonimi: serve lo stesso nome; con più artisti omonimi vince quello che ha i tuoi album); se manca il collegamento provo i titoli più probabili e controllo che parlino di musica. Foto dell'artista dalla voce, con autore e licenza.
- Permanente: la scheda (testo .json e foto) viene salvata su Dropbox in `/_player/schede/Artisti/` e `/_player/schede/Album/` e da lì si legge sempre, anche se Wikipedia cambia; sul telefono ne resta una copia per aprirla subito. «Aggiorna da Wikipedia», «Modifica» (scegli tu la voce con un link o un titolo, oppure scrivi il testo).
- Si cerca solo aprendo un artista o un album che non ha ancora la scheda; escono solo il nome dell'artista e il titolo dell'album (a MusicBrainz, Wikidata e Wikipedia; la foto da upload.wikimedia.org). Interruttore «Biografie e schede dei dischi» in Impostazioni › Riproduzione: spento, solo su richiesta. Sotto il testo: «Da Wikipedia… licenza CC BY-SA 4.0» (obbligatorio per la licenza).
- Avvio con rete debole: nei registri del 17/11 alcuni brani in streaming partivano dopo 7-9 s mentre Basalto scaricava in memoria il brano intero. Ora all'avvio la rete è tutta per lo streaming: il download in memoria comincia 1,5 s dopo che la musica è partita, il precarico di un altro brano ancora lontano dalla fine si ferma (riparte dopo), quello dello stesso brano appena cominciato (sotto il 30%) pure; se il precarico di questo brano finisce entro 1,5 s lo aspetto e parto dalla memoria. «⏱ Partito in…» include l'attesa.

v1.46: **contatore giusto dopo vocali e pause a schermo spento**.
- Registro del 19/11 (14:34-14:38): il brano era partito in streaming; la copia in memoria è arrivata a schermo spento, ma il lettore ha continuato dal link di streaming (passa alla copia solo con uno spostamento). Dopo il vocale e una pausa, Safari ha rimesso da solo il suo contatore a 0:00 (14:36:53): al ▶ la musica è ripartita dal punto giusto ma il contatore e la schermata di blocco erano indietro di 35 s, e la ripresa e lo spostamento successivi sono partiti dal punto sbagliato.
- In pausa (tua, o di iOS senza interruzione), se il brano è già tutto in memoria, il lettore passa in silenzio alla copia in memoria nel punto esatto: «In pausa passo alla copia in memoria». Lo stesso quando la copia arriva con il lettore in pausa o quando si riaccende lo schermo. Durante un'interruzione no: la musica riparte da sola.
- In pausa la posizione non può cambiare: se Safari la cambia da solo il registro lo scrive («Safari ha cambiato da solo la posizione in pausa…») e la posizione viene rimessa giusta (con la copia in memoria anche il suono; senza, il contatore, resa esatta appena possibile).
- Il registro dice «dalla memoria» o «streaming» secondo il link che il lettore sta davvero usando (prima bastava che la copia esistesse); il battito «… suona» solo quando la musica suona.
- In alcuni browser il tempo della «fetta» precisa arriva solo a dati caricati: ora corretto anche col lettore in pausa.

v1.45: **musica che riparte dopo un vocale di WhatsApp, tonalità senza picchi schiacciati**.
- Ripartenza dopo le interruzioni: su iPhone Safari non avvisa la pagina quando un'interruzione finisce (vocale di WhatsApp, chiamata, Siri); la musica ripartiva solo se l'altra app lo chiedeva a iOS. Il motore audio invece cambia stato all'inizio («interrupted») e alla fine («suspended» o «running»). Ora, senza motore audio, un contesto audio vuoto fa da sensore mentre la musica suona: non è collegato all'uscita (nessun suono, non compare sulla schermata di blocco, la musica non ci passa, qualità invariata) e si ferma quando metti in pausa tu. Alla fine dell'interruzione la musica riparte (entro 10 minuti, solo con Basalto in sottofondo) e il registro dice se il suono è ripartito davvero. Una pausa di iOS senza interruzione (cuffie, auto o AirPlay scollegati) lascia la musica in pausa. Con il motore audio acceso conta anche il passaggio «interrupted» → «suspended», che prima era ignorato.
- Tonalità: con la tonalità diversa da «Originale» tutto il remix (brano, effetti, batteria e basso, in equilibrio) suona 3 dB più piano, così i picchi che salgono spostando il tono ci stanno senza essere schiacciati (registro della v1.43: limitatore fino a 3,8 dB per metà del tempo). Il limitatore resta come sicurezza; la riga «Tonalità …» del registro dice «volume −3 dB» e quanto lavora ancora. Anche nel salvataggio (il volume uniforme lo compensa col ReplayGain misurato). Prova con un brano a −0,2 dBFS: livello −3,00 dB, nessun picco da abbassare.
- CarPlay: la scritta «Web» in alto nel riquadro «In riproduzione» è il nome che iOS dà a tutte le web app della schermata Home; una pagina web non la può cambiare.

v1.44: **Remix spento senza ripartire da capo, posizione esatta dopo gli spostamenti in streaming**.
- Dal registro della v1.43 (16:41): Remix acceso e spento pochi secondi dopo su un brano in streaming con rete lenta → il brano ripartiva da 0:00. Il nuovo lettore (quello del motore audio) non aveva ancora raggiunto il punto voluto e se ne leggeva il tempo (0). Ora viene usato il punto voluto. Le righe «play() rifiutato: AbortError» dovute al cambio di lettore non vengono più scritte (erano normali).
- Posizione stimata da Safari (spostamento o cambio di lettore mentre il brano è ancora in streaming): Safari indica il punto chiesto ma può suonare da un altro, anche di decine di secondi (es. «finito a 4:23 su 3:05»). Appena il brano è tutto in memoria, o quando si riaccende lo schermo, il suono viene portato sul punto indicato con uno spostamento preciso: riga «Posizione resa esatta … (era stimata da Safari)». Si può sentire un piccolo salto, una volta; da lì contatore, schermata di blocco, batteria e passaggio senza pause tornano esatti.

v1.43: **▶ dalla schermata di blocco dopo una pausa (tentativo), filtri Walkman e Giradischi**.
- Dal registro della v1.42: musica messa in pausa nell'app, schermo spento, ▶ sulla schermata di blocco → il comando arriva a Basalto («Riprende · schermata di blocco · schermo spento»), il lettore dice di suonare e il contatore scorre, ma il tempo resta fermo (3:08 prima e dopo) e non si sente niente finché non si riapre l'app. È un limite noto di iOS per le app aggiunte alla schermata Home (WebKit 243258, aperto dal 2022: dopo circa 5 secondi di pausa in sottofondo l'audio non riparte; segnalato anche sui forum Apple nel 2024). Tentativo dentro l'assetto attuale: dopo una pausa decisa da te (tasto o schermata di blocco), per 10 minuti un terzo lettore suona silenzio vero (un WAV di zeri creato in memoria: niente rete, niente salvato), così iOS tiene attiva la sessione audio di Basalto. Mai dopo una pausa decisa da iOS (chiamata, altra app, cuffie tolte). Se iOS mandasse «pausa» al posto di ▶ (crede che Basalto suoni), con la musica ferma vale come ▶. Disattivabile in Impostazioni › Riproduzione («▶ dalla schermata di blocco dopo una pausa»).
- Controllo nel registro: 3 s dopo un ▶ a schermo spento una riga «✓ Suono ripartito a schermo spento» oppure «✗ … non ha fatto ripartire il suono»; in quel caso la musica torna in pausa, così la schermata di blocco non conta a vuoto. La riga della pausa dice se la sessione audio è tenuta sveglia.
- Remix › Filtro: **Walkman** (cassetta: acuti che cadono da 11 a 5,5 kHz, «gobba» della testina sui 100 Hz, saturazione morbida del nastro, fruscio, velocità che oscilla: ±0,3% da nuovo, ±1% consumato) e **Giradischi** (vinile: scricchiolii e schiocchi della superficie, rombo del piatto, acuti da 16 a 9 kHz, canali un po' mescolati, ondulazione dei 33 giri ±0,1-0,4%). Il cursore diventa «Usura». Funzionano anche nel salvataggio su Dropbox: oscillazioni e rumori sono allineati al punto del brano, così i pezzi si uniscono senza giunture (prova: differenza con il pezzo unico 4·10⁻⁴). Prova con un master forte: rumore da solo a −53/−44 dBFS (walkman, nuovo/consumato), −55/−46 dBFS (giradischi); volume della musica quasi invariato.

v1.42: **tonalità senza gracchi, interruttore «Come un disco» chiarito**.
- Gracchi con la tonalità: il modulo `rx-tono.js` calcolava un blocco intero del vocoder in una sola chiamata del motore audio (1-4 ms, quando per 128 campioni a 48 kHz ce ne sono 2,7); ora ogni blocco è diviso in 4 passi, uno per chiamata, e anche il ricampionamento va a ritmo costante (prova sul computer, 4 minuti a +2: la chiamata più lenta su mille passa da 1,7 a 0,6 ms; su iPhone lo dirà il registro). Le fasi vengono riportate tra −π e π, così restano piccole e precise (anche nel salvataggio del remix, con lo stesso suono). Durante l'ascolto il modulo non crea più oggetti in memoria.
- Picchi oltre 0 dBFS: spostando il tono i picchi possono salire di 1-2 dB (prova su un master forte a −0,2 dBFS: fino a +1,7 dBFS) e venivano tagliati. Il modulo ha ora lo stesso limitatore del salvataggio (−0,1 dBFS, 5 ms di anticipo), che non tocca niente sotto il limite. Il calcolo resta identico a prima (differenza massima 1,5·10⁻⁸ con un segnale sotto il limite); il ritardo è lo stesso (113-139 ms).
- Moduli rimasti accesi: a ogni cambio di tonalità il modulo vecchio veniva staccato ma continuava a calcolare (in silenzio) finché il motore audio restava acceso. Ora gli viene detto di fermarsi.
- Cambi senza scatti: quando la catena del Remix si ricostruisce (tonalità, effetti, batteria) la nuova entra con una dissolvenza di 30 ms quando ha il suono pronto e la vecchia esce insieme; con lo stesso ritardo (es. da +1 a +2, o un effetto acceso con la tonalità spostata) senza nessun buco. Prova in Chrome con una nota fissa: prima a ogni cambio uno scatto (salto 50-350 volte il normale) e 120-130 ms di silenzio; ora nessuno scatto e nessun buco, tranne da 0 a una tonalità (90 ms di silenzio sfumato: il tempo che serve al modulo). Mentre il modulo della tonalità arriva, un attimo di silenzio invece del vecchio metodo a «grani».
- Registro: ogni 30 s (la prima volta dopo 5 s) una riga «Tonalità …» con il peso del calcolo, eventuali buchi e quanto ha lavorato il limitatore.
- Pannello Remix: «Cambia anche il tono» stava sopra il cursore della tonalità e sembrava il suo interruttore; in realtà riguarda solo la velocità. Ora si chiama «Come un disco» ed è nella sezione «Velocità» (con la velocità a 1,00× non cambia niente, e lo dice); la tonalità ha una sezione sua con i tasti −2…+2 e «Originale».

v1.41: **schermata di blocco: contatore che scorre anche per il brano avviato dall'app (tentativo)**. Dal registro: il brano avviato a schermo acceso (in streaming, con il lettore di riserva caricato) ha il contatore a scatti e niente animazione; quello partito a schermo spento va bene. Il lettore di riserva resta muto finché non tocca a lui (iOS non considera un lettore muto per «In riproduzione»); allo spegnimento dello schermo i dati vengono riconfermati e il registro scrive cosa è stato dichiarato a iOS.

v1.40: **schermata di blocco: di nuovo il simbolo giusto**. Dal registro della v1.39: riquadro tornato, ma con ▶ mentre la musica suonava e contatore a scatti (iOS credeva la musica in pausa). Lo stato play/pausa torna dichiarato dall'app (come nella v1.37/1.38, dove il simbolo era giusto); il manifest resta senza `id`.

v1.39: **schermata di blocco come prima**. Tolti l'`id` dal manifest (v1.38) e lo stato play/pausa forzato (v1.37): su iPhone, tolta l'altra web app dalla Home, il riquadro «In riproduzione» spariva. Restano la posizione rinfrescata e i comandi riconfermati a ogni partenza.

v1.38 (ritirata in parte dalla v1.39): **schermata di blocco che apre Basalto e resta aggiornata**.
- Il manifest ha ora un `id` proprio (`"basalto"`). Con più web app dello stesso sito nella schermata Home (es. «La mia spesa», anche lei su testext82.github.io) iOS, senza id, a volte associa il riquadro «In riproduzione» all'app sbagliata: il tocco apre l'altra app e il riquadro resta fermo (bug WebKit 267810; rimedio confermato: id esplicito con un nome semplice, non un percorso). iOS legge il manifest solo all'aggiunta alla Home: **va tolta e riaggiunta l'icona di Basalto** (prima «Sincronizza ora»; dopo vanno reinseriti App key e collegamento a Dropbox e le impostazioni del telefono).
- A ogni partenza (anche dopo il cambio di lettore quando il motore audio si accende o si spegne) titolo, copertina e comandi vengono riconfermati a iOS; dopo ogni spostamento la posizione viene rimessa subito.

v1.37: **tonalità esatta, ritmi in shuffle, schermata di blocco**.
- Tonalità dal vivo con un modulo nuovo (`rx-tono.js`, AudioWorklet): lo stesso vocoder di fase + ricampionamento del salvataggio, tono esatto (prova: 440 Hz → 493,9 Hz con +2) e ritardo fisso noto (113-139 ms), compensato per la batteria. Il vecchio metodo a «grani» (tono approssimato a ±20 Hz e ronzio) resta solo come riserva.
- iPhone: il motore audio acceso da un cursore (tonalità, velocità) restava fermo e la musica muta finché non si premeva play. Ora si sveglia al rilascio di ogni tocco (anche con timer brevi, a cui Safari «presta» il tocco).
- Shuffle / 12/8: riconosciuto dall'analisi (attacchi a 1/3 e 2/3 del battito invece che a metà); se il tempo trovato era il doppio sugli ottavi terzinati, viene dimezzato. La batteria suona terzinata (ottavi a 2/3, sedicesimi a 1/3 e 5/6), anche i ritmi fissi e quelli dei batteristi; «Dal brano» legge gli accenti nelle posizioni terzinate. Scelta a mano: «Dritto» / «Terzinato (shuffle)».
- Aggancio con posizione esatta: il ritardo del dispositivo (stabile) vale più di un aggancio debole; uno che se ne discosta di oltre 12 ms si accetta solo se molto netto (somiglianza ≥ 0,5). Il ritardo tipico si aggiorna solo da agganci con somiglianza ≥ 0,5.
- Schermata di blocco: stato (in riproduzione / in pausa) e posizione aggiornati di continuo (con il motore audio iOS non li ricava da solo).

v1.36: **la batteria parte prima e si carica subito**.
- Analisi del ritmo mentre il brano si scarica: il file in arrivo si legge a pezzi (solo la parte già arrivata); dopo i primi 25-30 s analizzati ci sono battiti provvisori e la batteria parte, poi l'analisi definitiva li sostituisce. La batteria non va oltre la parte analizzata.
- Alla prima partenza della batteria l'ascolto già fatto per l'aggancio non si butta più (prima ripartiva da zero): con la posizione stimata si aggancia in pochi secondi anche durante lo scaricamento.
- Suoni veri e ritmi dei batteristi tenuti anche sul telefono (Cache API): dalla seconda volta pronti in meno di mezzo secondo, senza riscaricarli da Dropbox.
- Corretto: «null is not an object (evaluating 'ctx.decodeAudioData')» se si spegneva la batteria mentre si caricavano i suoni veri.
- Le scelte della batteria (suoni, ritmo, volumi, griglia) restano anche se l'app si riapre; l'accensione resta per sessione.
- «Dal brano»: in un brano regolare senza colpi medi netti, rullante sul 2 e sul 4 (e lì niente cassa).
- Nel pannello: quanto è scaricato il brano e a che punto è l'analisi.

v1.35: **batteria a tempo e che si adatta alla canzone**.
- Corretto: il «ritardo tipico» del dispositivo (tra contatore del lettore e suono, 15 ms su iPhone) veniva misurato anche dopo uno spostamento stimato da Safari, dove l'errore è della posizione (fino a mezzo secondo) e non del dispositivo; salvato (569 ms) spostava la batteria in tutti i brani non ancora agganciati. Ora si misura solo con la posizione esatta, valori oltre 250 ms si ignorano (anche quello già salvato).
- Posizione stimata da Safari (streaming): appena il brano è in memoria la rendo esatta (spostamento preciso), e finché non è esatta né agganciata la batteria aspetta invece di suonare fuori tempo.
- Aggancio con posizione esatta: solo tra i ritardi possibili (da −80 a +350 ms), preferendo quello tipico; niente più agganci a un battito di distanza. Se per un po' non lo trova, prova lontano con criteri più severi.
- Ritmo **«Dal brano»** (predefinito): dagli accenti dell'analisi (bassi, medi, acuti) su un giro di una o due battute: cassa e basso dove il brano batte sui bassi, rullante sui colpi medi-acuti netti, charleston a ottavi o sedicesimi; volume che segue il brano (più piano nelle parti calme). Funziona anche con ritmi irregolari (prova: 3+3+4+3+3 ottavi, 5 accenti su 5).

v1.34: **salva il remix su Dropbox** (Remix › Salva il remix › «Salva su Dropbox»).
- Crea un FLAC nuovo nella cartella `Remix` (album «Remix», artista dell'album «Artisti vari»; titolo «… (Remix)», poi «(Remix 2)»…), alla frequenza del brano originale, 24 bit, con copertina, tag e una descrizione delle modifiche. Il brano originale non cambia.
- Contiene quello che si sente: velocità, tonalità, effetti, equalizzatore, batteria e basso. La velocità senza cambio di tono usa un vocoder di fase con fasi agganciate ai picchi e riallineate sugli attacchi; il cambio di tono un ricampionamento sinc (Kaiser). Eco e riverbero continuano senza giunture tra i pezzi e finiscono con la loro coda.
- Limitatore (−0,1 dB, 5 ms di anticipo) solo dove batteria ed effetti farebbero distorcere. Volume uniforme: il guadagno ReplayGain dell'originale corretto di quanto il remix è più forte o più piano.
- Tutto a pezzi da 20 s (poca memoria anche su iPhone), poi caricamento con una sessione di Dropbox a pezzi da 8 MB. Codificatore FLAC scritto per Basalto (LPC fino all'ordine 12/16, stereo con canale di differenza, Rice a partizioni), verificato bit per bit con ffmpeg.

v1.33: la nota sul salvataggio in Impostazioni dice anche della cartella `_batteria` (prima diceva «un solo file»).

v1.32: **batteria vera e ritmi di batteristi** nel Remix.
- «Suoni: Batteria vera»: MuldjordKit (Tama Superstar, CC BY 4.0), 19 colpi con 2–3 intensità (mix stereo dei microfoni fatto per Basalto).
- «Ritmi suonati da batteristi»: 30 ritmi da 2–4 battute del Groove MIDI Dataset di Google Magenta (CC BY 4.0) — punk, rock, pop, funk, hip hop, disco, reggae, soul, jazz, samba, country… — con le imprecisioni umane, adattati battito per battito al brano. Il basso resta sulla griglia e segue gli accordi.
- I file stanno nella cartella `_batteria` di Dropbox (la libreria la ignora). Se mancano, l'app usa la copia pubblica in `batteria/` del sito e, con il salvataggio attivo, la copia su Dropbox; si possono aggiungere altri kit o ritmi nello stesso formato. Crediti in `batteria/LEGGIMI.md`.

v1.31: **batteria del Remix sui brani veri** (provata su tre brani di 39/Smooth, confrontati con madmom).
- Scelta del livello del tempo: se a un altro livello (doppio, metà, altri picchi) cassa e rullante si alternano battito per battito molto più chiaramente, è quello giusto. Nel punk veloce prima l'app sceglieva 101 o 133 BPM invece di 200: ora 202, 200 e 185 BPM, con il 95–97% dei battiti uguali a madmom.
- **Basso che segue gli accordi**: per ogni battito l'app riconosce la fondamentale dell'accordo (basso del brano + note dell'accordo, sequenza scelta con Viterbi) e il basso la suona, intonato con il brano. Nel pannello: «accordi Si, La, Fa♯».
- Le scelte di tempo fatte con la v1.30 vengono rifatte (formato dei dati v3).

v1.30: **batteria del Remix rifatta**.
- L'analisi legge tutto il brano e trova ogni singolo battito (programmazione dinamica, con il tempo locale), quindi la batteria segue anche i brani suonati senza metronomo che accelerano o rallentano. Tarata su brani veri (confronto con madmom) e su brani sintetici a tempo variabile: battiti trovati tutti, scarto medio 2 ms.
- **Aggancio al suono**: un piccolo modulo (`rx-ascolto.js`, AudioWorklet) ascolta la musica dentro il motore audio e la confronta con il file; la batteria si aggancia a quello che si sente davvero, non al contatore del lettore (su iPhone i due possono differire di decimi di secondo). Non registra niente: calcola solo l'inviluppo in 4 bande. Per caricarlo la CSP permette gli script dello stesso sito (`script-src 'self'`).
- Tonalità e accordatura (anche brani accordati mezzo tono sotto): il basso suona intonato con il brano.
- «× 2» e «÷ 2» raddoppiano o dimezzano i colpi; tempi alternativi proposti e «Tocca a tempo» rifanno i battiti con un altro tempo.
- Corretto anche il contatore in Chrome dopo uno spostamento preciso di meno di 2 secondi.

v1.29: toccando il brano già in memoria mentre è in pausa riparte dall'inizio e suona (prima restava fermo); nel registro anche le regolazioni della batteria del Remix (× 2, ÷ 2, ± 10 ms, battuta, tocco).

v1.28: **Remix** (pulsante «Remix» nel lettore). Tutto avviene sul telefono mentre il brano suona; il file su Dropbox non cambia e per ora le impostazioni non vengono salvate.
- **Velocità e tono**: velocità da 0,5× a 1,5× mantenendo il tono, oppure «Come un disco» (cambia anche il tono; vale solo per la velocità); tonalità ±6 semitoni a velocità invariata, con un suo cursore.
- **Effetti**: riverbero, eco a tempo con il brano, filtro (sott'acqua / radio / telefono / walkman / giradischi), distorsione, flanger, audio 8D; preset Slowed + riverbero, Nightcore, Lo-fi, Sott'acqua, Radio, Stadio, 8D.
- **Batteria a tempo**: analisi del ritmo (BPM, primo battito della battuta, tonalità) sui FLAC in memoria; sequencer a 16 passi con cassa, rullante, charleston, mani, tom e un basso sulla nota della tonalità; ritmi pronti, «× 2» / «÷ 2», «± 10 ms», «Sposta la battuta», «Tocca a tempo». I suoni della batteria sono generati dall'app: nessun campione scaricato.

v1.27: nella pagina dell'artista «Notizie e altri siti» viene prima di «Album che non hai».

v1.26:
- **Pagina dell'artista**: «Simili nella tua libreria» (calcolato sul telefono: ascoltati insieme, genere, anni); «Notizie e altri siti» con Google News, Wikipedia, artisti simili su Last.fm, discografia su Discogs, concerti su Songkick, scalette su setlist.fm, video su YouTube (solo link, senza referrer).
- **Album che non hai**: solo quando tocchi «Cerca gli album che mancano» il player manda a MusicBrainz il nome dell'artista e riceve la discografia (titoli, anni, tipo); confronto con gli album su Dropbox, filtri In studio / EP / Dal vivo / Raccolte / Tutto, scelta dell'artista giusto se il nome è ambiguo. Risultati salvati sul telefono per 30 giorni (`mx_mb_v1`, al massimo 120 artisti). Al massimo una richiesta al secondo. La CSP ora permette anche `https://musicbrainz.org`.
- **La coda continua da sola** (interruttore in Riproduzione): quando parte l'ultimo brano aggiunge fino a 25 brani simili della libreria; non con la ripetizione attiva.
- **Temi**: Scuro, Chiaro, Sabbia, Automatico (segue l'iPhone). Il tema si applica prima di disegnare la pagina; la barra dell'ora resta nera (stile «black» delle app sulla schermata Home); la schermata di apertura resta nera.
- Logo dell'app anche in Home.

v1.25: niente ingrandimento della pagina con il doppio tocco (`touch-action: manipulation`), per esempio sulla barra in basso; lo zoom con due dita resta.

v1.24: il brano partito in streaming si scarica in memoria subito (a schermo acceso, con il precarico attivo), prima del successivo; se l'album aveva già cominciato a scaricarlo, quel download continua invece di essere buttato. Uno spostamento chiesto mentre il download sta finendo (meno di ~6 s stimati) aspetta e poi va nel punto esatto; altrimenti resta quello stimato da Safari.

v1.23: **spostamento preciso nei FLAC**. Dal registro (v1.22): dopo uno spostamento dentro il brano Safari dichiarava il secondo richiesto ma l'audio era qualche secondo indietro («finito a 2:32,0, durata del file 2:27,2»): contatore che finiva prima della musica, senza pause che tagliava la fine. Ora, con il file in memoria, il player trova il blocco audio esatto (ogni blocco FLAC porta il suo numero; tabella di ricerca se c'è, altrimenti stima e verifica) e dà a Safari una «fetta» del file (intestazione minima + audio da quel blocco, senza copiare dati): la posizione è sempre esatta. Il brano in corso, se è in streaming, viene scaricato in memoria anche lui a schermo acceso (dopo il successivo); alla ripresa all'apertura il brano si scarica subito e «▶» parte dal punto esatto. In streaming o a schermo spento resta lo spostamento di Safari: il brano viene segnato come «tempo stimato» e per lui il passaggio senza pause non viene usato. Se Safari non accetta la «fetta», si torna da soli al metodo di Safari.

v1.22: il lettore si chiude anche trascinandolo verso il basso da qualunque punto (non dalla barra del tempo, dalla coda o dall'equalizzatore). Fine del brano calcolata con la durata esatta del FLAC (campioni ÷ frequenza) invece che con quella di Safari, che può essere una stima più corta: il contatore finiva prima della musica e il passaggio senza pause tagliava gli ultimi secondi. Senza pause solo per FLAC con durata nota; nel registro le differenze di durata e dove finisce davvero il brano.

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
