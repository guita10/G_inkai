/* dados.js — o CONTRATO do site novo. Tudo o que o site diz e mostra vive aqui:
   textos (EN e PT), a lista de obras, os projetos, o percurso, os formatos de
   comissao e o merch. As tres paginas leem este ficheiro; ja nao ha copias
   para manter iguais.

   Copiado a 15 Nov 2026 do CONFIG do index.html e do loja.html do site atual,
   por script, sem tocar numa palavra. O que e novo esta marcado com "NOVO".

   As regras do CLAUDE.md, seccao 9, valem aqui tal e qual: fan art nunca se
   vende, nenhuma localizacao, nenhum preco de comissao, nada inventado, EN e
   PT sempre a par, nenhum travessao longo no texto. */
window.CONFIG = {
  artistName: "Guita_Ink",
  realName: "Frederico Guita",
  email: "frederico@guitaink.com",
  instagram: "https://www.instagram.com/guita_ink",
  /* os links do fundo da pagina, alem do Instagram */
  otherLinks: [
    { label: "Webtoon", url: "https://www.webtoons.com/en/canvas/survival-of-kings/list?title_no=1055635" },
    { label: "PAMP", url: "https://www.instagram.com/premiosanimemangaportugal/" }
  ],

  /* ---------- COMISSOES ---------- sem precos, nunca (CLAUDE.md 9.4) */
  commissionsOpen: true,
  tiers: [
    { key: "headshot", handle: "commission-headshot-bust" },
    { key: "half", handle: "commission-half-body" },
    { key: "full", handle: "commission-full-body" },
    { key: "sheet", handle: "commission-character-sheet" }
  ],

  /* ---------- A LOJA ---------- */
  shopOpen: true,
  shop: "https://xqms3c-zk.myshopify.com",
  shopDrop: "Drop 01",
  merchCollection: "merch-guita_ink",
  livroReclamacoes: "https://www.livroreclamacoes.pt/Inicio/",
  /* hold:true = existe no Shopify mas nao esta publicado: nao aparece.
     variants = os IDs do Shopify por ordem cartesiana das opts (a ultima opcao
     muda mais depressa). Sao copias: se a Printful voltar a sincronizar um
     produto, e preciso ir busca-los outra vez. */
  merch: [
    { key: "tee", price: "30", unit: "€", from: false, handle: "t-shirt-drop-01", plate: "衣", src: "images/merch/tshirt.jpg", w: 800, h: 800, foto: "tshirt-{design}-{colour}", opts: [{ k: "design", v: ["Queen", "Monk", "Sumo"] }, { k: "colour", v: ["Black", "White"] }, { k: "size", v: ["S", "M", "L", "XL"], pick: true }],
      variants: ["60968526479694", "60968526512462", "60968526545230", "60968526577998", "60968526610766", "60968526643534",
        "60968526676302", "60968526709070", "60968526741838", "60968526774606", "60968526807374", "60968526840142",
        "60968526872910", "60968526905678", "60968526938446", "60968526971214", "60968527003982", "60968527036750",
        "60968527069518", "60968527102286", "60968527135054", "60968527167822", "60968527200590", "60968527233358"] },
    { key: "hoodie", price: "45", unit: "€", from: false, handle: "hoodie-drop-01", plate: "帽", src: "images/merch/hoodie.jpg", w: 800, h: 800, foto: "hoodie-{design}-{colour}", opts: [{ k: "design", v: ["Queen", "Monk", "Sumo"] }, { k: "colour", v: ["Black", "White"] }, { k: "size", v: ["S", "M", "L", "XL"], pick: true }],
      variants: ["60968527331662", "60968527364430", "60968527397198", "60968527429966", "60968527462734", "60968527495502",
        "60968527528270", "60968527561038", "60968527593806", "60968527626574", "60968527659342", "60968527692110",
        "60968527724878", "60968527757646", "60968527790414", "60968527823182", "60968527855950", "60968527888718",
        "60968527921486", "60968527954254", "60968527987022", "60968528019790", "60968528052558", "60968528085326"] },
    { key: "print", price: "18", unit: "€", from: false, handle: "art-print-drop-01", plate: "版", src: "images/merch/print.jpg", w: 800, h: 800, foto: "print-{design}", opts: [{ k: "design", v: ["OC 01", "OC 02", "OC 03"] }, { k: "size", v: ["A4"] }],
      variants: ["60968458518862", "60968458551630", "60968458584398"] },
    { key: "limited", price: "45", unit: "€", from: false, handle: "limited-edition-a3-drop-01", plate: "限", hold: true },
    { key: "sticker", price: "4", unit: "€", from: false, handle: "stickers-drop-01", plate: "貼", src: "images/merch/stickers.jpg", w: 800, h: 800, foto: "sticker-{design}", opts: [{ k: "design", v: ["Queen", "Monk", "Sumo"] }, { k: "finish", v: ["Matte"] }],
      variants: ["60968458649934", "60968458682702", "60968458715470"] },
    { key: "acrylic", price: "12", unit: "€", from: false, handle: "acrylic-keychain-drop-01-pre-order", plate: "鍵", preorder: true, hold: true }
  ],

  /* ---------- AS OBRAS ---------- a ordem e a da parede, escolhida pelo Frede.
     cat: character | fanart | sketches. collab:true soma-se a categoria. */
  wallPreview: 12,
  heroArt: [
    "images/oc-2.jpg",
    "images/the-witch.jpg",
    "images/geisha.jpg",
    "images/oc.jpg",
    "images/silen.jpg",
    "images/spain.jpg"
  ],
  artworks: [
    { src: "images/angela.jpg", label: "Angela", ratio: "34", cat: "character" },
    { src: "images/mira-starborn.jpg", label: "Mira Starborn", ratio: "11", cat: "character" },
    { src: "images/collab-mira-final.jpg", label: "Mira, collab", ratio: "34", cat: "character", collab: true },
    { src: "images/collab.jpg", label: "Duelo, Dragon Ball collab", ratio: "43", cat: "fanart", collab: true },
    { src: "images/arkevil-final.jpg", label: "ArkEvil", ratio: "34", cat: "fanart" },
    { src: "images/oc-1.jpg", label: "OC 02", ratio: "11", cat: "character" },
    { src: "images/kon.jpg", label: "Kon, Chainsaw Man", ratio: "11", cat: "fanart" },
    { src: "images/ilustracao-sem-titulo-1.jpg", label: "Espírito", ratio: "11", cat: "character" },
    { src: "images/italy.jpg", label: "Italy", ratio: "34", cat: "character" },
    { src: "images/estudo-luz.jpg", label: "Estudo de luz", ratio: "34", cat: "sketches" },
    { src: "images/shocked.jpg", label: "Shocked", ratio: "34", cat: "sketches" },
    { src: "images/surpresa.jpg", label: "Surpresa", ratio: "11", cat: "sketches" },
    { src: "images/oc.jpg", label: "OC 01", ratio: "34", cat: "character" },
    { src: "images/oc-2.jpg", label: "OC 03", ratio: "34", cat: "character" },
    { src: "images/silen.jpg", label: "Silen", ratio: "34", cat: "character" },
    { src: "images/the-witch.jpg", label: "The Witch", ratio: "34", cat: "character" },
    { src: "images/geisha.jpg", label: "Geisha", ratio: "34", cat: "character" },
    { src: "images/spain.jpg", label: "Spain", ratio: "34", cat: "character" },
    { src: "images/clair.jpg", label: "Clair", ratio: "11", cat: "fanart" },
    { src: "images/arti.jpg", label: "Arti, Survival of Kings", ratio: "34", cat: "character" },
    { src: "images/kei.jpg", label: "Kei, Survival of Kings", ratio: "34", cat: "character" },
    { src: "images/edan.jpg", label: "Edan, Survival of Kings", ratio: "34", cat: "character" },
    { src: "images/lumi.jpg", label: "Lumi, Survival of Kings", ratio: "34", cat: "character" },
    { src: "images/masami.jpg", label: "Masami, Survival of Kings", ratio: "34", cat: "character" },
    { src: "images/yakura.jpg", label: "Yakura, Survival of Kings", ratio: "34", cat: "character" },
    { src: "images/kindo.jpg", label: "Kindo, Survival of Kings", ratio: "34", cat: "character" },
    { src: "images/aki.jpg", label: "Aki, Chainsaw Man", ratio: "34", cat: "fanart" },
    { src: "images/makima.jpg", label: "Makima, Chainsaw Man", ratio: "34", cat: "fanart" },
    { src: "images/pochita.jpg", label: "Pochita, Chainsaw Man", ratio: "11", cat: "fanart" },
    { src: "images/even-yeager.jpg", label: "Eren Yeager, AoT", ratio: "34", cat: "fanart" },
    { src: "images/final-aot-season-4.jpg", label: "Attack on Titan S4", ratio: "34", cat: "fanart" },
    { src: "images/yuta-fanart.jpg", label: "Yuta, Jujutsu Kaisen", ratio: "34", cat: "fanart" },
    { src: "images/nami-30x40.jpg", label: "Nami, One Piece", ratio: "34", cat: "fanart" },
    { src: "images/ilustracao-sem-titulo.jpg", label: "Tony Tony Chopper, card", ratio: "43", cat: "fanart" },
    { src: "images/op-deck-ace-hearts.jpg", label: "Ace of Hearts, One Piece Deck", ratio: "34", cat: "fanart" },
    { src: "images/dante.jpg", label: "Dante", ratio: "11", cat: "fanart" },
    { src: "images/lucy.jpg", label: "Lucy", ratio: "11", cat: "fanart" }
  ],

  /* ---------- OS PROJETOS ---------- src = a capa; gallery = o resto da serie.
     NOVO: rows (so no baralho) diz como a serie se arruma em filas: o verso,
     os quatro naipes (As, 2, Valete, Dama, Rei) e os dois Jokers. */
  featured: "sok",
  projects: [
    { src: "images/proj-sok.jpg", label: "Survival of Kings", ratio: "34", key: "sok", plate: "SOK", link: "https://www.webtoons.com/en/canvas/survival-of-kings/list?title_no=1055635",
      gallery: [
        "images/arti.jpg",
        "images/kei.jpg",
        "images/edan.jpg",
        "images/lumi.jpg",
        "images/masami.jpg",
        "images/yakura.jpg",
        "images/kindo.jpg"
      ] },
    { src: "images/proj-tr.jpg", label: "Tokyo Revengers", ratio: "34", key: "tr", plate: "TR",
      gallery: ["images/proj-tr-2.jpg", "images/proj-tr-3.jpg", "images/proj-tr-4.jpg"] },
    { src: "images/proj-pamp.jpg", label: "PAMP", ratio: "34", key: "pamp", plate: "P", link: "https://www.instagram.com/premiosanimemangaportugal/",
      gallery: [
        "images/proj-pamp-2.jpg",
        "images/proj-pamp-3.jpg",
        "images/proj-pamp-4.jpg",
        "images/proj-pamp-5.jpg",
        "images/proj-pamp-6.jpg"
      ] },
    { src: "images/op-deck-ace-hearts.jpg", label: "One Piece Deck", ratio: "34", key: "deck", plate: "Q",
      gallery: [
        "images/op-deck-back.jpg",
        "images/op-deck-ace-spades.jpg",
        "images/op-deck-2-spades.jpg",
        "images/op-deck-katakuri.jpg",
        "images/op-deck-yamato.jpg",
        "images/op-deck-shanks.jpg",
        "images/op-deck-ace-hearts.jpg",
        "images/op-deck-2-hearts.jpg",
        "images/op-deck-doflamingo.jpg",
        "images/op-deck-hancock.jpg",
        "images/op-deck-luffy.jpg",
        "images/op-deck-ace-diamonds.jpg",
        "images/op-deck-2-diamonds.jpg",
        "images/op-deck-crocodile.jpg",
        "images/op-deck-nami.jpg",
        "images/op-deck-roger.jpg",
        "images/op-deck-ace-clubs.jpg",
        "images/op-deck-2-clubs.jpg",
        "images/op-deck-kaido.jpg",
        "images/op-deck-robin.jpg",
        "images/op-deck-blackbeard.jpg",
        "images/op-deck-zoro.jpg",
        "images/op-deck-buggy.jpg"
      ],
      rows: [["back", 1], ["spades", 5], ["hearts", 5], ["diamonds", 5], ["clubs", 5], ["jokers", 2]] }
  ],

  /* ---------- O PERCURSO ---------- */
  timeline: [
    { key: "iberanime", year: 2023, month: null, status: "past" },
    { key: "sok", year: 2025, month: null, status: "past" },
    { key: "comicon", year: 2026, month: 4, status: "past" },
    { key: "coimbrabd", year: 2026, month: 4, status: "past" },
    { key: "workshop", year: 2026, month: 7, status: "past" }
  ],

  /* ---------- OS TEXTOS ---------- cada chave existe nas duas linguas */
  i18n: {
    en: {
      heroRole: "Illustration and character design",
      heroPick: "Choose a piece",
      heroShow: "Show",
      a11ySkip: "Skip to work",
      a11yNav: "Main",
      a11yLang: "Switch language",
      a11yTheme: "Switch theme",
      a11yFilters: "Filter gallery",
      a11yViewer: "Artwork viewer",
      a11yClose: "Close",
      a11yPrev: "Previous",
      a11yNext: "Next",
      ctaWork: "View work",
      ctaComm: "Commissions",
      navWork: "Work",
      navProjects: "Projects",
      navAbout: "About",
      navComm: "Commissions",
      navContact: "Contact",
      navMenu: "Menu",
      galleryTitle: "Selected work",
      filters: {
        all: "All",
        webtoon: "Webtoon",
        covers: "Covers",
        character: "Character design",
        fanart: "Fan art",
        sketches: "Sketches",
        collab: "Collabs"
      },
      projectsTitle: "Featured projects",
      openProject: "Open project",
      projects: {
        sok: {
          kicker: "Webtoon series",
          title: "Survival of Kings",
          desc: "Ongoing webtoon / graphic novel, co-created with writer Reeeborn. Ink-style panels and vertical-scroll storytelling.",
          link: "Read on Webtoon"
        },
        tr: {
          kicker: "Monthly, with Distrito Manga",
          title: "Tokyo Revengers, covers reimagined",
          desc: "Each volume cover redrawn in the original format, with faces from the anime and manga community standing in for the characters. A new one goes out every month, alongside the publisher's releases."
        },
        pamp: {
          kicker: "Visual identity",
          title: "PAMP: Prémios Anime Manga Portugal",
          desc: "Full visual identity: key art, logo lock-ups and event graphics.",
          link: "PAMP on Instagram"
        },
        deck: {
          kicker: "Fan art, playing cards",
          title: "One Piece Deck",
          desc: "One Piece characters drawn as playing cards. Queens: Nami, Robin, Yamato and Boa Hancock. Kings: Gol D. Roger, Luffy, Blackbeard and Shanks. Jacks: Crocodile, Katakuri, Doflamingo and Kaido. Jokers: Zoro and Buggy. Each ace carries the flag of its king's crew."
        }
      },
      tlTitle: "Along the way",
      tlUpcoming: "Upcoming",
      tlNext: "Next up",
      months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      timeline: {
        iberanime: {
          title: "Iberanime manga contest, 1st place",
          where: "Iberanime · Lisbon",
          desc: "Won the manga contest. The push that turned a handle into a body of work."
        },
        sok: {
          title: "Survival of Kings, Chapter 01",
          where: "Webtoon · with Reeeborn",
          desc: "First chapter published. Written by Reeeborn, drawn by me."
        },
        comicon: {
          title: "Panel talk",
          where: "COMICON · Portugal",
          desc: "On building comic worlds: perspective, space and structure."
        },
        coimbrabd: {
          title: "Artist Alley",
          where: "Coimbra BD",
          desc: "A table of prints, originals and live commissions. Readers met face to face."
        },
        workshop: {
          title: "Character design & creative writing workshop",
          where: "Termas Romanas das Taipas",
          desc: "Co-facilitated with Reeeborn. Twelve people, ninety minutes, one character each."
        }
      },
      aboutTitle: "About",
      aboutBody: [
        "I'm an illustrator, and I sign my work Guita_Ink. I draw characters and the worlds they live in, with anime and manga never far away.",
        "Winning the Iberanime manga contest in 2023 was the push that turned a name into a body of work. I have not stopped since: a cover a month with Distrito Manga, Survival of Kings growing with Reeeborn, and commissions in between.",
        "I studied architecture, and what stayed with me is the habit of treating the space around a figure as part of the drawing, not as backdrop. I always start with the line, and it is the most important part of my process: that is where the drawing is decided, long before any colour goes in.",
        "If you made it this far, thank you. It matters more than you would think."
      ],
      aboutMeta: "Frederico Guita · Guita_Ink",
      commTitle: "Commissions",
      commOpen: "Open",
      commClosed: "Closed",
      commIntro: "Four formats, from a bust to a full character sheet. Tell me what you have in mind and I reply with the format, the price and the timeline.",
      commSee: "Formats and how to ask",
      tiers: {
        headshot: { name: "Headshot / Bust", desc: "Head and shoulders, fully rendered." },
        half: { name: "Half body", desc: "Waist-up illustration, fully rendered." },
        full: { name: "Full body", desc: "Complete character, fully rendered." },
        sheet: {
          name: "Character sheet",
          desc: "Turnarounds, expressions and detail callouts. Final quote depends on the number of views."
        }
      },
      navShop: "Shop",
      contactTitle: "Say hi",
      contactBody: "For commissions, use the button on the commissions page: the email starts with the brief already in it. For collabs or publishing, email is fastest; for everything else, Instagram.",
      footerNote: "Drawn & built by hand.",
      lightboxHint: "Esc to close · ← → to browse",
      lightboxHintTouch: "Swipe to browse",
      lbOf: "of",
      placeholderNote: "placeholder, swap in /images",
      wallEmpty: "Nothing in this category yet.",
      wallMore: "See all {n} pieces",
      copyEmail: "Copy address",
      copied: "Copied",
      backHome: "Portfolio",
      a11yJump: "On this page",
      commJump: "Commissions",
      commNote: "Prices and the full process go by email, with a short guide of how we work together.",
      commCta: "Ask about a commission",
      shopTitle: "Shop",
      merchTitle: "Merch",
      shopIntro: "Clothing, prints, stickers and small things made from original Guita_Ink art. Released in drops.",
      shopAll: "See the whole shop",
      shopPreorder: "Pre-order",
      fromPrefix: "From",
      merchItems: {
        tee: { name: "T-shirt", desc: "Unisex, printed on the front. Black or white, S to XL." },
        hoodie: { name: "Hoodie", desc: "Unisex, printed on the front. Black or white, S to XL." },
        print: { name: "Art print", desc: "A4, heavyweight matte paper. Three original portraits." },
        limited: { name: "Limited edition", desc: "A3, signed and numbered. 50 copies of each design, never reprinted." },
        sticker: { name: "Stickers", desc: "Vinyl, cut around the character." },
        acrylic: { name: "Acrylic keychain", desc: "Double-sided clear acrylic. Made once the batch fills." }
      },
      optNames: { design: "Design", colour: "Colour", size: "Size", finish: "Finish" },
      optValues: {},
      pickOne: "Choose",
      pickMissing: "Choose every option first.",
      addToBag: "Add to bag",
      added: "Added",
      addedLive: "added to the bag",
      bagShort: "Bag",
      bagTitle: "Your bag",
      bagEmpty: "Nothing here yet. Choose a size and add something above.",
      bagTotal: "Total",
      bagShipping: "Shipping is calculated at checkout.",
      checkout: "Checkout",
      checkoutNote: "Payment happens on Shopify's secure checkout, with this bag already in it.",
      qtyLess: "One less",
      qtyMore: "One more",
      remove: "Remove",
      mailSubject: "Commission request",
      mailBody: "Hi Frede,\n\nFormat (bust / half body / full body / character sheet): \nCharacter: \nReference links: \nPose or framing you have in mind: \nColours or mood: \nAny date you need it by: \nCommercial use (yes / no): \n\nThanks,\n",
      questions: "Questions first? Write to",
      footComplaints: "Complaints book",
      stageLabel: "Selected piece",
      stageOpen: "View larger",
      projNotFound: "Project not found",
      otherProjects: "Other projects",
      seriesOf: "Pieces in this project",
      a11ySkipContent: "Skip to content",
      deckRows: {
        back: "Card back",
        spades: "Spades",
        hearts: "Hearts",
        diamonds: "Diamonds",
        clubs: "Clubs",
        jokers: "Jokers"
      }
    },
    pt: {
      heroRole: "Ilustração e design de personagens",
      heroPick: "Escolhe uma peça",
      heroShow: "Mostrar",
      a11ySkip: "Saltar para o trabalho",
      a11yNav: "Principal",
      a11yLang: "Mudar de língua",
      a11yTheme: "Mudar de tema",
      a11yFilters: "Filtrar a galeria",
      a11yViewer: "Visualizador de obras",
      a11yClose: "Fechar",
      a11yPrev: "Anterior",
      a11yNext: "Seguinte",
      ctaWork: "Ver trabalho",
      ctaComm: "Comissões",
      navWork: "Trabalho",
      navProjects: "Projetos",
      navAbout: "Sobre",
      navComm: "Comissões",
      navContact: "Contacto",
      navMenu: "Menu",
      galleryTitle: "Trabalho selecionado",
      filters: {
        all: "Tudo",
        webtoon: "Webtoon",
        covers: "Capas",
        character: "Design de personagens",
        fanart: "Fan art",
        sketches: "Esboços",
        collab: "Colaborações"
      },
      projectsTitle: "Projetos em destaque",
      openProject: "Abrir projeto",
      projects: {
        sok: {
          kicker: "Série webtoon",
          title: "Survival of Kings",
          desc: "Webtoon / graphic novel em curso, co-criado com o escritor Reeeborn. Painéis a tinta e narrativa em scroll vertical.",
          link: "Ler no Webtoon"
        },
        tr: {
          kicker: "Mensal, com a Distrito Manga",
          title: "Tokyo Revengers, capas reinterpretadas",
          desc: "Cada capa de volume refeita no formato original, com figuras da comunidade anime e manga no lugar das personagens. Sai uma por mês, a acompanhar os lançamentos da editora."
        },
        pamp: {
          kicker: "Identidade visual",
          title: "PAMP: Prémios Anime Manga Portugal",
          desc: "Identidade visual completa: key art, logótipos e grafismo de evento.",
          link: "O PAMP no Instagram"
        },
        deck: {
          kicker: "Fan art, cartas de jogar",
          title: "One Piece Deck",
          desc: "Personagens de One Piece desenhadas como cartas de jogar. Damas: Nami, Robin, Yamato e Boa Hancock. Reis: Gol D. Roger, Luffy, Barba Negra e Shanks. Valetes: Crocodile, Katakuri, Doflamingo e Kaido. Jokers: Zoro e Buggy. Cada ás leva a bandeira da tripulação do seu rei."
        }
      },
      tlTitle: "Percurso",
      tlUpcoming: "Em breve",
      tlNext: "A seguir",
      months: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
      timeline: {
        iberanime: {
          title: "Concurso de manga Iberanime, 1.º lugar",
          where: "Iberanime · Lisboa",
          desc: "Vitória no concurso de manga. O empurrão que transformou um nome num corpo de trabalho."
        },
        sok: {
          title: "Survival of Kings, Capítulo 01",
          where: "Webtoon · com Reeeborn",
          desc: "Primeiro capítulo publicado. Escrito pelo Reeeborn, desenhado por mim."
        },
        comicon: {
          title: "Painel / conversa",
          where: "COMICON · Portugal",
          desc: "Sobre construir mundos de banda desenhada: perspetiva, espaço e estrutura."
        },
        coimbrabd: {
          title: "Artist Alley",
          where: "Coimbra BD",
          desc: "Mesa com prints, originais e comissões ao vivo. Leitores conhecidos em pessoa."
        },
        workshop: {
          title: "Workshop de character design & escrita criativa",
          where: "Termas Romanas das Taipas",
          desc: "Co-facilitado com o Reeeborn. Doze pessoas, noventa minutos, uma personagem cada."
        }
      },
      aboutTitle: "Sobre",
      aboutBody: [
        "Sou ilustrador e assino Guita_Ink. Desenho personagens e os mundos onde elas vivem, com o anime e a manga sempre por perto.",
        "Ganhar o concurso de manga da Iberanime, em 2023, foi o empurrão que transformou um nome num corpo de trabalho. Desde aí não voltei a parar: uma capa por mês com a Distrito Manga, o Survival of Kings a crescer com o Reeeborn, e comissões pelo meio.",
        "Estudei arquitetura e ficou-me o hábito de olhar para o espaço à volta de uma figura como parte do desenho, não como fundo. Começo sempre pela linha, e é a parte mais importante do meu processo: é aí que o desenho se decide, muito antes de entrar a cor.",
        "Se chegaste até aqui, obrigado. Faz mais diferença do que parece."
      ],
      aboutMeta: "Frederico Guita · Guita_Ink",
      commTitle: "Comissões",
      commOpen: "Abertas",
      commClosed: "Fechadas",
      commIntro: "Quatro formatos, do busto à character sheet completa. Diz-me o que tens em mente e respondo com o formato, o valor e o prazo.",
      commSee: "Formatos e como pedir",
      tiers: {
        headshot: { name: "Headshot / Busto", desc: "Cabeça e ombros, totalmente renderizado." },
        half: { name: "Meio corpo", desc: "Ilustração da cintura para cima, totalmente renderizada." },
        full: { name: "Corpo inteiro", desc: "Personagem completa, totalmente renderizada." },
        sheet: {
          name: "Character sheet",
          desc: "Turnarounds, expressões e detalhes. Orçamento final depende do número de vistas."
        }
      },
      navShop: "Loja",
      contactTitle: "Diz olá",
      contactBody: "Para comissões, usa o botão da página das comissões: o email já começa com o pedido escrito. Para colaborações ou publicação, o email é o mais rápido; para tudo o resto, Instagram.",
      footerNote: "Desenhado & construído à mão.",
      lightboxHint: "Esc para fechar · ← → para navegar",
      lightboxHintTouch: "Desliza para navegar",
      lbOf: "de",
      placeholderNote: "placeholder, substituir em /images",
      wallEmpty: "Ainda não há nada nesta categoria.",
      wallMore: "Ver as {n} peças",
      copyEmail: "Copiar endereço",
      copied: "Copiado",
      backHome: "Portefólio",
      a11yJump: "Nesta página",
      commJump: "Comissões",
      commNote: "Os valores e o processo completo seguem por email, com um guia curto de como vamos trabalhar.",
      commCta: "Pedir uma comissão",
      shopTitle: "Loja",
      merchTitle: "Merch",
      shopIntro: "Roupa, prints, autocolantes e pequenas coisas feitas a partir da arte original Guita_Ink. Sai em drops.",
      shopAll: "Ver a loja toda",
      shopPreorder: "Pré-venda",
      fromPrefix: "Desde",
      merchItems: {
        tee: { name: "T-shirt", desc: "Unissexo, estampada à frente. Preta ou branca, do S ao XL." },
        hoodie: { name: "Sweat com capuz", desc: "Unissexo, estampada à frente. Preta ou branca, do S ao XL." },
        print: { name: "Print", desc: "A4, papel mate de gramagem alta. Três retratos originais." },
        limited: { name: "Edição limitada", desc: "A3, assinada e numerada. 50 exemplares de cada desenho, sem reimpressão." },
        sticker: { name: "Autocolantes", desc: "Vinil, recortado à volta da personagem." },
        acrylic: { name: "Porta-chaves acrílico", desc: "Acrílico transparente, dupla face. Produzido quando o lote fecha." }
      },
      optNames: { design: "Desenho", colour: "Cor", size: "Tamanho", finish: "Acabamento" },
      optValues: { Black: "Preto", White: "Branco", Matte: "Mate" },
      pickOne: "Escolhe",
      pickMissing: "Escolhe primeiro todas as opções.",
      addToBag: "Adicionar ao cesto",
      added: "Adicionado",
      addedLive: "adicionado ao cesto",
      bagShort: "Cesto",
      bagTitle: "O teu cesto",
      bagEmpty: "Ainda está vazio. Escolhe o tamanho e junta alguma coisa acima.",
      bagTotal: "Total",
      bagShipping: "Os portes são calculados no pagamento.",
      checkout: "Finalizar compra",
      checkoutNote: "O pagamento é feito na página segura do Shopify, já com este cesto.",
      qtyLess: "Menos um",
      qtyMore: "Mais um",
      remove: "Remover",
      mailSubject: "Pedido de comissão",
      mailBody: "Olá Frede,\n\nFormato (busto / meio corpo / corpo inteiro / character sheet): \nPersonagem: \nLinks de referência: \nPose ou enquadramento que imaginas: \nCores ou ambiente: \nAlguma data a cumprir: \nUso comercial (sim / não): \n\nObrigado,\n",
      questions: "Dúvidas antes? Escreve para",
      footComplaints: "Livro de Reclamações",
      stageLabel: "Peça escolhida",
      stageOpen: "Ver maior",
      projNotFound: "Projeto não encontrado",
      otherProjects: "Outros projetos",
      seriesOf: "Peças deste projeto",
      a11ySkipContent: "Saltar para o conteúdo",
      deckRows: { back: "Verso", spades: "Espadas", hearts: "Copas", diamonds: "Ouros", clubs: "Paus", jokers: "Jokers" }
    }
  }
};
