'use strict';
// Kara (character designer) front end. Plain JavaScript, no framework, no build step.
(() => {
  const $ = (id) => document.getElementById(id);

  const STR = {
    en: {
      lede: 'Ready-made characters to start from. Your current settings stay one click away with Undo.',
      startFrom: 'Inspirations',
      random: 'Random',
      randomTitle: 'A character picked at random (the settings at the bottom stay as they are)',
      undo: 'Undo',
      redo: 'Redo',
      steps: 'History',
      start: 'Start',
      resumed: 'Settings from last visit',
      edit: 'Edit',
      cleared: 'cleared',
      reuse: 'Reuse these settings',
      deleteCard: 'Delete',
      layout: 'Layout',
      layouts: { auto: 'Auto', side: 'Side by side', top: 'Image on top' },
      session: 'Session',
      exportSession: 'Export the session (.html)',
      importSession: 'Import a session',
      clearSession: 'Clear the session',
      sessionNote: 'Your images, prompts and settings are kept in this browser. The export is one .html file: it opens anywhere and can be imported back here.',
      confirmClear: 'Delete every image of this session from this browser? Export it first if you want to keep it.',
      confirmDelete: 'Delete this image from the session?',
      emptySession: 'Nothing to export yet.',
      badFile: 'This file is not a Kara session.',
      imported: 'images imported',
      exportTitle: 'Kara session',
      exportSub: 'Exported from Kara, open source character designer, MIT license.',
      extraLabel: '// Extra details',
      extraPlaceholder: 'e.g. a red scarf, a tired look, rain on the jacket',
      extraShort: 'Details',
      extraEmpty: 'Add…',
      seedLabel: '// Seed',
      seedName: 'Seed',
      lock: 'Keep this seed',
      generate: 'Generate',
      generating: 'Generating',
      cancel: 'Cancel',
      download: 'Download',
      prompt: '// Prompt sent to the model',
      promptBtn: 'Prompt',
      copy: 'Copy',
      copied: 'Copied',
      waiting: '// Your character will appear here',
      waitingHint: 'Make your choices on the left, then click Generate.',
      queued: '// Waiting in the {p} queue',
      running: '// Generating',
      failed: 'The generation failed.',
      timeout: 'This is taking too long. Check ComfyUI, then try again.',
      noImage: 'ComfyUI finished but returned no image.',
      comfyOn: 'ComfyUI connected',
      comfyOff: 'ComfyUI not reachable',
      comfyHelp: 'Start ComfyUI first, then reload this page. Expected at',
      cloudOn: 'Comfy Cloud connected',
      cloudOff: 'Comfy Cloud not available',
      cloudHelp_nokey: 'No Comfy Cloud key found. Put COMFY_CLOUD_API_KEY in the .env file, then restart the app.',
      cloudHelp_badkey: 'Comfy Cloud refused the key. Check COMFY_CLOUD_API_KEY in the .env file.',
      cloudHelp_credits: 'Not enough Comfy Cloud credits.',
      cloudHelp_nosub: 'Comfy Cloud needs an active paid plan to use the API.',
      cloudHelp_unreachable: 'Cannot reach Comfy Cloud. Check your internet connection.',
      cloudHelp_http: 'Comfy Cloud returned an unexpected error. Try again in a moment.',
      magnificOn: 'Magnific connected',
      magnificOff: 'Magnific not available',
      magnificHelp_nokey: 'No Magnific key found. Put MAGNIFIC_API_KEY in the .env file, then restart the app.',
      magnificHelp_badkey: 'Magnific refused the key. Check MAGNIFIC_API_KEY in the .env file.',
      magnificHelp_unreachable: 'Cannot reach Magnific. Check your internet connection.',
      magnificHelp_http: 'Magnific returned an unexpected error. Try again in a moment.',
      max: 'max',
      customPlaceholder: 'Or describe it yourself',
      pickColor: 'Pick a colour',
      resetColor: 'Back to the choice above (no custom colour)',
      agePlaceholder: 'Or type an age',
      years: 'years',
      heightPick: 'Or slide to set a height',
      addOutfitRefs: 'Add outfit images (top, bottom, shoes...)',
      addAccessoryRefs: 'Add accessory images',
      addLookRefs: 'Add style images (the look to imitate)',
      wheelHint: 'Mild inside, intense outside',
      zoomHint: 'Click to zoom',
      viewerHint: 'Scroll or pinch to zoom, drag to move, double-click for actual size.',
      fit: 'Fit',
      about: 'About',
      aboutText: 'Kara is an open-source character designer. Build a character from simple menus, add reference images if you like, and get a clean character sheet from the image model of your choice: on your own computer through ComfyUI, or online through Magnific, KIE or fal with your own key.',
      aboutBy: 'Made by',
      aboutLicense: 'MIT license: free to use, change and share.',
      aboutRepo: 'Source code on GitHub',
      aboutFeedback: 'Send feedback',
      aboutFeedbackNote: 'Opens a new issue on GitHub (a free GitHub account is needed).',
      updTitle: 'Updates',
      updChecking: 'Looking for a new version…',
      updUpToDate: 'This is the latest version.',
      updAvailable: 'A new version is available ({d}).',
      updUnknown: 'Version of this copy unknown: updating installs the latest one.',
      updError: 'Could not reach GitHub: {e}',
      updBtn: 'Update',
      updBusy: 'Updating…',
      updDone: 'Updated. Restart Kara to use the new version.',
      updRestart: 'Restart Kara',
      updRestarting: 'Restarting…',
      updFailed: 'The update failed: {e}',
      aboutSite: 'Website',
      info: 'Image details',
      infoModel: 'Model',
      infoProvider: 'Provider',
      infoFormat: 'Format',
      infoSeed: 'Seed',
      infoMade: 'Made',
      infoRefs: 'Reference images',
      infoNoRefs: 'None',
      infoRefsOld: 'Not kept (image made before this was recorded)',
      infoPrompt: 'Full prompt',
      refKinds: { main: 'Start', guide: 'Face drawing', outfit: 'Outfit', accessories: 'Accessories', look: 'Style' },
      refModes: { sheet: 'sheet of this character', inspire: 'inspired by it' },
      payeeTip: 'These images are made and billed by {p}.',
      payeeFree: 'These images are made on your own machine, for free.',
      localSteps: ['Install ComfyUI Desktop (free) from {link}, then start it.', 'Leave it open in the background: the dot at the top turns green.', 'Click "Install the model" below: about {gb} GB, once only.'],
      localNoComfy: 'ComfyUI does not answer at this address. Start it, then reopen this panel.',
      localReady: 'Z-Image Turbo is installed in ComfyUI. You can generate for free.',
      localMissing: 'Files missing for Z-Image Turbo:',
      installModel: 'Install the model ({gb} GB)',
      installing: 'Downloading',
      installDone: 'Installation finished.',
      installError: 'Installation failed: ',
      comfyDirLabel: 'ComfyUI folder (only if asked)',
      comfyDirAsk: 'ComfyUI does not say where its folders are: give the ComfyUI folder below, then Save.',
      noModelLocal: 'The model is not installed in ComfyUI. Open Keys, choose "ComfyUI on your own machine", then "Install the model".',
      batch: 'Images per click',
      groupBatches: 'Group by batch',
      batchOf: 'Batch of',
      groupHint: 'Images made in one click stay together. Ungroup to reorder.',
      hexPlaceholder: 'Hex code, e.g. #3FA068',
      gallery: 'Gallery',
      galleryAll: 'All',
      galleryFav: 'Favourites',
      galleryHint: 'Drag to reorder. Click an image to open it.',
      galleryEmpty: 'No image here yet.',
      close: 'Close',
      fav: 'Favourite',
      refsTitle: '// Start from images',
      dropText: 'Drop one or more photos or drawings here (several views of the same character help), or click to choose',
      refSheet: 'Make the sheet of this character',
      refInspire: 'Use as inspiration',
      refNoModel: 'The selected model works from text only. Pick a model with the image badge (Qwen, FLUX 3 Klein, Nano Banana, Seedream) to use these images.',
      refSheetNote: 'Sheet mode: the character in your images is kept as is (face, hair, body, outfit) and laid out as a clean sheet. The menus about the person are left out; use Extra details for changes.',
      refInspireNote: 'Inspiration mode: the menus describe the character; your images only guide the look (style, outfit, colours, mood). The result is a new character, not a copy of the one in the images.',
      refMax: 'This model takes up to',
      refOver: 'This model takes {max} images in all and there are {total}: the {n} greyed ones will not be sent.',
      refImages: 'images',
      refBadFile: 'Only PNG, JPEG or WebP images.',
      needsRefsBadge: 'Needs an image',
      settings: 'Keys',
      dockTitle: '// Settings',
      providerTitle: '// Providers and keys',
      oddEyes: 'Odd eyes (two colours)',
      faceEditor: 'Face editor',
      viewFront: 'Front',
      viewProfile: 'Profile',
      searchPlaceholder: 'Find a setting (Ctrl+K)',
      tilesTitle: 'Size of the pictures in the menus',
      searchNone: 'Nothing found.',
      clearAll: 'Remove all',
      clearField: 'Clear',
      sameAsHair: 'Same colour as the hair',
      guide: 'Guide the image with this drawing',
      guideShort: 'Face drawing',
      layoutGuided: 'Portrait (locked)',
      layoutGuidedTip: 'The face drawing guides the image, so the layout is a portrait. Turn the face drawing off (bottom bar) to choose another layout.',
      layoutLockNote: 'Locked: the face drawing makes a portrait. Turn it off with “Face drawing”, in this bar.',
      guideStateOn: 'On',
      guideStateOff: 'Off',
      guideStrength: 'Strength',
      guideLoose: 'Free',
      guideStrict: 'Strict',
      guideExplain: 'The drawing made in the Face editor steers the picture, so the face keeps its proportions (width, jaw, eyes, nose, mouth). A high strength follows the drawing closely; a low one leaves the model more freedom.',
      guideWhyLock: 'While it is on, the image is always a portrait (the drawing is a face), so the sheet layouts are locked.',
      compareGuide: 'Compare with the face drawing',
      guideOff: 'The drawing is only a help: the words of the menus make the face.',
      guideControl: 'On your own machine, the drawing steers the image (ControlNet): a head and shoulders portrait in its proportions.',
      guideRef: 'The drawing is sent with the prompt as a reference image for the face proportions.',
      guideNone: 'This model takes no image: only the words of the menus are used.',
      styleAvatar: 'Avatar',
      stylePlate: 'Anatomy plate',
      faceHint: 'Drag the points on the face, or use the settings. Keys: V front or profile, S drawing style.',
      feViewKey: 'Front or profile (V key)',
      feStyleKey: 'Drawing style (S key)',
      feDone: 'Done',
      feWords: 'In the prompt',
      otherEye: 'Colour of the other eye',
      custom: 'Custom',
      exportList: 'Details',
      exportMedium: 'Medium',
      downloadAll: 'Download all',
      tiles_small: 'Small thumbnails',
      tiles_big: 'Large thumbnails',
      modelTiles_list: 'List (names and prices)',
      modelTiles_small: 'Small tiles',
      modelTiles_medium: 'Medium tiles',
      modelTiles_big: 'Large tiles',
      pricePerImage: 'Price of one image with this provider',
      priceLater: 'price after 1 image',
      notWith: 'not at {p}',
      keyMissing: 'add a key',
      balanceShort: 'no balance shown',
      addKeyFor: 'Add a {p} key to use it (click)',
      provider: 'Provider',
      tiles_none: 'Names only',
      noAnswer: 'No answer from the app (connection lost, or the app was closed on your own machine). Reload the page and try again.',
      providers: {
        local: ['ComfyUI on your own machine', 'Free, runs on your own graphics card.'],
        cloud: ['Comfy Cloud', "ComfyUI running on Comfy's servers: the same open models as on your own machine (Z-Image Turbo), without a graphics card. Needs a Comfy Cloud subscription and its API key."],
        router: ['Comfy Router', "Comfy's API for partner models (Nano Banana, GPT Image, Seedream, FLUX 3...): paid per image in Comfy credits, no subscription. Uses your Comfy API key (platform.comfy.org)."],
        magnific: ['Magnific', 'Paid per image. Needs a Magnific API key.'],
        kie: ['KIE', 'Paid per image, many models (Qwen, Z-Image...). Needs a KIE API key.'],
        fal: ['fal', 'Paid per image, prices known in advance (Z-Image, FLUX, Krea...). Needs a fal API key.'],
      },
      kieOn: 'KIE connected',
      kieOff: 'KIE not available',
      falOn: 'fal connected',
      routerOn: 'Comfy Router connected',
      routerOff: 'Comfy Router not available',
      falOff: 'fal not available',
      free: 'free',
      credits: 'credits',
      comfyUrlLabel: 'ComfyUI address',
      keyLabel: 'API key',
      keySaved: 'A key is saved. Type a new one to replace it.',
      keyNone: 'Paste your key here',
      keyOwn: 'Your {p} key',
      getKey: 'No key yet? Create one here',
      remember: 'Remember on this device',
      byokNote: 'Your key is sent with each generation over an encrypted connection, used for that call only, never stored on the server.',
      localNote: 'Saved in the .env file on your own machine. The key is never shown again.',
      save: 'Save',
      forget: 'Forget my key',
      savedOk: 'Saved.',
      forgotOk: 'Key removed from your machine.',
      model: 'Model',
      localModels: 'On your own machine, free (a click runs it here)',
      openModels: 'Open weights',
      apiModels: 'API only',
      openBadge: 'Open',
      apiBadge: 'API',
      refsBadge: 'Reference images',
      soon: 'Soon',
      notHere: 'Not available with this provider',
      localOff: 'ComfyUI is not running on your own machine',
      otherProvider: 'With another provider',
      needKey: 'Needs a key',
      thisPc: 'Your machine',
      missingKey: '{p} key missing',
      runWith: 'Run this model with',
      via: 'via',
      clickToSwitch: 'click to switch to',
      switchConfirm: 'Switch to {p} to use this model? The page reloads; your settings and images are kept.',
      needKeyFor: 'Paste your {p} key, then Save, to use this model.',
      balance: 'Balance',
      balanceNone: 'balance not given by the API',
      balanceNoRight: 'this key cannot read the balance',
      balanceNoKey: 'no key',
      balanceError: 'balance unavailable',
      advanced: 'Advanced',
      moreSettings: 'Settings',
      ratio: 'Ratio',
      resolution: 'Resolution',
      auto: 'Auto (sheet layout)',
      seedModes: { random: 'Random', fixed: 'Keep', inc: '+1', dec: '-1' },
      seedModeTitle: 'After each generation',
      seedDown: 'Seed minus 1',
      seedUp: 'Seed plus 1',
      seedDice: 'New random seed',
      namePlaceholder: 'character',
      nameTitle: 'Name of this character (used for file names)',
      footer: '// Open source, MIT license. Built for ComfyUI.',
      sections: {},
    },
    fr: {
      lede: 'Des personnages tout prêts pour démarrer. Vos réglages actuels restent récupérables avec Annuler.',
      startFrom: 'Inspirations',
      random: 'Au hasard',
      randomTitle: 'Un personnage tiré au hasard (les réglages du bas restent comme ils sont)',
      undo: 'Annuler',
      redo: 'Rétablir',
      steps: 'Historique',
      start: 'Départ',
      resumed: 'Réglages de la dernière visite',
      edit: 'Modification',
      cleared: 'effacé',
      reuse: 'Reprendre ces réglages',
      deleteCard: 'Supprimer',
      layout: 'Disposition',
      layouts: { auto: 'Auto', side: 'Côte à côte', top: 'Image en haut' },
      session: 'Session',
      exportSession: 'Exporter la session (.html)',
      importSession: 'Importer une session',
      clearSession: 'Vider la session',
      sessionNote: 'Vos images, prompts et réglages sont gardés dans ce navigateur. L\'export est un seul fichier .html : il s\'ouvre partout et se réimporte ici.',
      confirmClear: 'Supprimer toutes les images de cette session de ce navigateur ? Exportez-la avant si vous voulez la garder.',
      confirmDelete: 'Supprimer cette image de la session ?',
      emptySession: 'Rien à exporter pour l\'instant.',
      badFile: "Ce fichier n'est pas une session Kara.",
      imported: 'images importées',
      exportTitle: 'Session Kara',
      exportSub: 'Exporté depuis Kara, créateur de personnages open source, licence MIT.',
      extraLabel: '// Détails en plus',
      extraPlaceholder: "ex. une écharpe rouge, l'air fatigué, de la pluie sur la veste",
      extraShort: 'Détails',
      extraEmpty: 'Ajouter…',
      seedLabel: '// Seed',
      seedName: 'Seed',
      lock: 'Garder cette seed',
      generate: 'Générer',
      generating: 'Génération',
      cancel: 'Annuler',
      download: 'Télécharger',
      prompt: '// Prompt envoyé au modèle',
      promptBtn: 'Prompt',
      copy: 'Copier',
      copied: 'Copié',
      waiting: '// Votre personnage apparaîtra ici',
      waitingHint: 'Faites vos choix à gauche, puis cliquez sur Générer.',
      queued: '// En attente dans la file de {p}',
      running: '// Génération en cours',
      failed: 'La génération a échoué.',
      timeout: 'Ça prend trop de temps. Vérifiez ComfyUI, puis réessayez.',
      noImage: "ComfyUI a terminé mais n'a renvoyé aucune image.",
      comfyOn: 'ComfyUI connecté',
      comfyOff: 'ComfyUI injoignable',
      comfyHelp: "Lancez d'abord ComfyUI, puis rechargez cette page. Adresse attendue :",
      cloudOn: 'Comfy Cloud connecté',
      cloudOff: 'Comfy Cloud indisponible',
      cloudHelp_nokey: "Aucune clé Comfy Cloud trouvée. Mettez COMFY_CLOUD_API_KEY dans le fichier .env, puis relancez l'app.",
      cloudHelp_badkey: 'Comfy Cloud a refusé la clé. Vérifiez COMFY_CLOUD_API_KEY dans le fichier .env.',
      cloudHelp_credits: 'Pas assez de crédits Comfy Cloud.',
      cloudHelp_nosub: "Comfy Cloud demande un abonnement payant actif pour utiliser l'API.",
      cloudHelp_unreachable: 'Comfy Cloud est injoignable. Vérifiez votre connexion internet.',
      cloudHelp_http: 'Comfy Cloud a renvoyé une erreur inattendue. Réessayez dans un instant.',
      magnificOn: 'Magnific connecté',
      magnificOff: 'Magnific indisponible',
      magnificHelp_nokey: "Aucune clé Magnific trouvée. Mettez MAGNIFIC_API_KEY dans le fichier .env, puis relancez l'app.",
      magnificHelp_badkey: 'Magnific a refusé la clé. Vérifiez MAGNIFIC_API_KEY dans le fichier .env.',
      magnificHelp_unreachable: 'Magnific est injoignable. Vérifiez votre connexion internet.',
      magnificHelp_http: 'Magnific a renvoyé une erreur inattendue. Réessayez dans un instant.',
      max: 'max',
      customPlaceholder: 'Ou décrivez-le vous-même',
      pickColor: 'Choisir une couleur',
      resetColor: 'Revenir au choix au-dessus (sans couleur perso)',
      agePlaceholder: 'Ou tapez un âge',
      years: 'ans',
      heightPick: 'Ou faites glisser pour choisir une taille',
      addOutfitRefs: 'Ajouter des images de tenue (haut, bas, chaussures...)',
      addAccessoryRefs: "Ajouter des images d'accessoires",
      addLookRefs: 'Ajouter des images de style (le rendu à imiter)',
      wheelHint: 'Léger au centre, intense au bord',
      zoomHint: 'Cliquez pour zoomer',
      viewerHint: 'Molette ou pincement pour zoomer, glisser pour se déplacer, double clic pour la taille réelle.',
      fit: 'Ajuster',
      about: 'À propos',
      aboutText: "Kara est un créateur de personnages open source. Composez un personnage avec des menus simples, ajoutez des images de référence si vous voulez, et obtenez une planche de personnage propre avec le modèle d'image de votre choix : sur votre machine via ComfyUI, ou en ligne via Comfy Router, KIE, fal ou Magnific avec votre propre clé.",
      aboutBy: 'Conçu par',
      aboutLicense: "Licence MIT : libre d'utiliser, de modifier et de partager.",
      aboutRepo: 'Code source sur GitHub',
      aboutFeedback: 'Donner un avis',
      aboutFeedbackNote: 'Ouvrez un nouveau sujet sur GitHub (un compte GitHub gratuit est nécessaire).',
      updTitle: 'Mises à jour',
      updChecking: 'Recherche d’une nouvelle version…',
      updUpToDate: 'C’est la dernière version.',
      updAvailable: 'Une nouvelle version est disponible ({d}).',
      updUnknown: 'Version de cette copie inconnue : mettre à jour installe la dernière.',
      updError: 'GitHub ne répond pas : {e}',
      updBtn: 'Mettre à jour',
      updBusy: 'Mise à jour…',
      updDone: 'C’est fait. Redémarrez Kara pour utiliser la nouvelle version.',
      updRestart: 'Redémarrer Kara',
      updRestarting: 'Redémarrage…',
      updFailed: 'La mise à jour a échoué : {e}',
      aboutSite: 'Site',
      info: "Détails de l'image",
      infoModel: 'Modèle',
      infoProvider: 'Fournisseur',
      infoFormat: 'Format',
      infoSeed: 'Seed',
      infoMade: 'Faite le',
      infoRefs: 'Images de référence',
      infoNoRefs: 'Aucune',
      infoRefsOld: 'Non gardées (image plus ancienne que cette fonction)',
      infoPrompt: 'Prompt complet',
      refKinds: { main: 'Départ', guide: 'Dessin du visage', outfit: 'Tenue', accessories: 'Accessoires', look: 'Style' },
      refModes: { sheet: 'planche de ce perso', inspire: "s'en inspirer" },
      payeeTip: 'Ces images sont faites et facturées par {p}.',
      payeeFree: 'Ces images sont faites sur votre machine, gratuitement.',
      localSteps: ['Installez ComfyUI Desktop (gratuit) depuis {link}, puis lancez-le.', 'Laissez-le ouvert en arrière-plan : le point en haut passe au vert.', 'Cliquez sur « Installer le modèle » ci-dessous : environ {gb} Go, une seule fois.'],
      localNoComfy: 'ComfyUI ne répond pas à cette adresse. Lancez-le, puis rouvrez ce panneau.',
      localReady: 'Z-Image Turbo est installé dans ComfyUI. Vous pouvez générer gratuitement.',
      localMissing: 'Fichiers manquants pour Z-Image Turbo :',
      installModel: 'Installer le modèle ({gb} Go)',
      installing: 'Téléchargement',
      installDone: 'Installation terminée.',
      installError: "L'installation a échoué : ",
      comfyDirLabel: 'Dossier ComfyUI (seulement si demandé)',
      comfyDirAsk: "ComfyUI ne dit pas où sont ses dossiers : indiquez le dossier ComfyUI ci-dessous, puis Enregistrer.",
      noModelLocal: "Le modèle n'est pas installé dans ComfyUI. Ouvrez Clés, choisissez « ComfyUI sur votre machine », puis « Installer le modèle ».",
      batch: 'Images par clic',
      groupBatches: 'Grouper par lot',
      batchOf: 'Lot de',
      groupHint: 'Les images faites en un clic restent ensemble. Dégroupez pour réorganiser.',
      hexPlaceholder: 'Code hexa, ex. #3FA068',
      gallery: 'Galerie',
      galleryAll: 'Toutes',
      galleryFav: 'Favoris',
      galleryHint: 'Glissez pour réorganiser. Cliquez sur une image pour l\'ouvrir.',
      galleryEmpty: 'Aucune image ici pour l\'instant.',
      close: 'Fermer',
      fav: 'Favori',
      refsTitle: "// Partir d'images",
      dropText: 'Déposez une ou plusieurs photos ou dessins ici (plusieurs vues du même perso aident), ou cliquez pour choisir',
      refSheet: 'Faire la planche de ce perso',
      refInspire: "S'en inspirer",
      refNoModel: 'Le modèle choisi ne travaille que sur du texte. Choisissez un modèle avec le badge image (Qwen, FLUX 3 Klein, Nano Banana, Seedream) pour utiliser ces images.',
      refSheetNote: 'Mode planche : le personnage de vos images est repris tel quel (visage, coiffure, corps, tenue) et mis en planche propre. Les menus sur le personnage sont mis de côté ; utilisez Détails en plus pour les changements.',
      refInspireNote: "Mode inspiration : ce sont les menus qui décrivent le personnage ; vos images guident seulement le look (style, tenue, couleurs, ambiance). Le résultat est un nouveau personnage, pas une copie de celui des images.",
      refMax: "Ce modèle prend jusqu'à",
      refOver: 'Ce modèle prend {max} images en tout et il y en a {total} : les {n} grisées ne seront pas envoyées.',
      refImages: 'images',
      refBadFile: 'Seulement des images PNG, JPEG ou WebP.',
      needsRefsBadge: 'Demande une image',
      settings: 'Clés',
      dockTitle: '// Réglages',
      providerTitle: '// Fournisseurs et clés',
      oddEyes: 'Yeux vairons (deux couleurs)',
      faceEditor: 'Éditeur de visage',
      viewFront: 'Face',
      viewProfile: 'Profil',
      searchPlaceholder: 'Chercher un réglage (Ctrl+K)',
      tilesTitle: 'Taille des images dans les menus',
      searchNone: 'Rien trouvé.',
      clearAll: 'Tout retirer',
      clearField: 'Effacer',
      sameAsHair: 'Même couleur que les cheveux',
      guide: "Guider l'image avec ce dessin",
      guideShort: 'Dessin du visage',
      layoutGuided: 'Portrait (verrouillé)',
      layoutGuidedTip: 'Le dessin du visage guide l’image, la mise en page est donc un portrait. Coupez le dessin du visage (barre du bas) pour choisir une autre mise en page.',
      layoutLockNote: 'Verrouillé : le dessin du visage impose un portrait. Coupez-le avec « Dessin du visage », dans cette barre.',
      guideStateOn: 'Oui',
      guideStateOff: 'Non',
      guideStrength: 'Force',
      guideLoose: 'Libre',
      guideStrict: 'Fidèle',
      guideExplain: 'Le dessin fait dans l’éditeur de visage guide l’image : le visage garde ses proportions (largeur, mâchoire, yeux, nez, bouche). Une force élevée suit le dessin de près ; une force basse laisse plus de liberté au modèle.',
      guideWhyLock: 'Tant qu’il est activé, l’image est toujours un portrait (le dessin est un visage) : les mises en page de planche sont verrouillées.',
      compareGuide: 'Comparer avec le dessin du visage',
      guideOff: 'Le dessin est une aide : ce sont les mots des menus qui font le visage.',
      guideControl: "Sur votre machine, le dessin pilote l'image (ControlNet) : un portrait aux proportions du dessin.",
      guideRef: "Le dessin part avec le prompt comme image de référence pour les proportions du visage.",
      guideNone: "Ce modèle ne prend pas d'image : seuls les mots des menus comptent.",
      styleAvatar: 'Avatar',
      stylePlate: "Planche d'anatomie",
      faceHint: 'Faites glisser les points sur le visage, ou utilisez les réglages. Touches : V face ou profil, S style du dessin.',
      feViewKey: 'Face ou profil (touche V)',
      feStyleKey: 'Style du dessin (touche S)',
      feDone: 'Terminé',
      feWords: 'Dans le prompt',
      otherEye: "Couleur de l'autre œil",
      custom: 'Sur mesure',
      exportList: 'Détails',
      exportMedium: 'Moyen',
      downloadAll: 'Tout télécharger',
      tiles_small: 'Petites vignettes',
      tiles_big: 'Grandes vignettes',
      modelTiles_list: 'Liste (noms et prix)',
      modelTiles_small: 'Petites cases',
      modelTiles_medium: 'Cases moyennes',
      modelTiles_big: 'Grandes cases',
      pricePerImage: 'Prix d\'une image avec ce fournisseur',
      priceLater: 'prix après 1 image',
      notWith: 'pas chez {p}',
      keyMissing: 'ajouter une clé',
      balanceShort: 'solde non fourni',
      addKeyFor: 'Ajoutez une clé {p} pour l\'utiliser (clic)',
      provider: 'Fournisseur',
      tiles_none: 'Noms seulement',
      noAnswer: 'Pas de réponse de l’app (connexion coupée, ou app fermée sur votre machine). Rechargez la page et réessayez.',
      providers: {
        local: ['ComfyUI sur votre machine', 'Gratuit, tourne sur votre propre carte graphique.'],
        cloud: ['Comfy Cloud', 'ComfyUI qui tourne sur les serveurs de Comfy : les mêmes modèles libres que sur votre machine (Z-Image Turbo), sans carte graphique. Demande un abonnement Comfy Cloud et sa clé API.'],
        router: ['Comfy Router', "L'API de Comfy pour les modèles partenaires (Nano Banana, GPT Image, Seedream, FLUX 3...) : payée à l'image en crédits Comfy, sans abonnement. Utilise votre clé API Comfy (platform.comfy.org)."],
        magnific: ['Magnific', "Payant à l'image. Demande une clé API Magnific."],
        kie: ['KIE', "Payant à l'image, beaucoup de modèles (Qwen, Z-Image...). Demande une clé API KIE."],
        fal: ['fal', "Payant à l'image, prix connus d'avance (Z-Image, FLUX, Krea...). Demande une clé API fal."],
      },
      kieOn: 'KIE connecté',
      kieOff: 'KIE indisponible',
      falOn: 'fal connecté',
      routerOn: 'Comfy Router connecté',
      routerOff: 'Comfy Router indisponible',
      falOff: 'fal indisponible',
      free: 'gratuit',
      credits: 'crédits',
      comfyUrlLabel: 'Adresse de ComfyUI',
      keyLabel: 'Clé API',
      keySaved: 'Une clé est enregistrée. Tapez-en une nouvelle pour la remplacer.',
      keyNone: 'Collez votre clé ici',
      keyOwn: 'Votre clé {p}',
      getKey: 'Pas encore de clé ? Créez-la ici',
      remember: 'Retenir sur cet appareil',
      byokNote: "Votre clé part avec chaque génération sur une connexion chiffrée, sert pour cet appel seulement et n'est jamais stockée sur le serveur.",
      localNote: "Enregistrée dans le fichier .env de votre machine. La clé n'est plus jamais affichée.",
      save: 'Enregistrer',
      forget: 'Oublier ma clé',
      savedOk: 'Enregistré.',
      forgotOk: 'Clé retirée de votre machine.',
      model: 'Modèle',
      localModels: 'Sur votre machine, gratuit (un clic le lance ici)',
      openModels: 'Poids libres',
      apiModels: 'API seulement',
      openBadge: 'Libre',
      apiBadge: 'API',
      refsBadge: 'Images de référence',
      soon: 'Bientôt',
      notHere: 'Pas disponible avec ce fournisseur',
      localOff: 'ComfyUI ne tourne pas sur votre machine',
      otherProvider: 'Avec un autre fournisseur',
      needKey: 'Demande une clé',
      thisPc: 'Votre machine',
      missingKey: 'clé {p} manquante',
      runWith: 'Faire tourner ce modèle avec',
      via: 'via',
      clickToSwitch: 'cliquez pour passer sur',
      switchConfirm: 'Passer sur {p} pour utiliser ce modèle ? La page se recharge, vos réglages et vos images sont gardés.',
      needKeyFor: 'Collez votre clé {p}, puis Enregistrer, pour utiliser ce modèle.',
      balance: 'Solde',
      balanceNone: "solde non donné par l'API",
      balanceNoRight: "cette clé ne peut pas lire le solde",
      balanceNoKey: 'pas de clé',
      balanceError: 'solde indisponible',
      advanced: 'Avancé',
      moreSettings: 'Réglages',
      ratio: 'Ratio',
      resolution: 'Résolution',
      auto: 'Auto (mise en page)',
      seedModes: { random: 'Aléatoire', fixed: 'Garder', inc: '+1', dec: '-1' },
      seedModeTitle: 'Après chaque génération',
      seedDown: 'Seed moins 1',
      seedUp: 'Seed plus 1',
      seedDice: 'Nouvelle seed au hasard',
      namePlaceholder: 'personnage',
      nameTitle: 'Nom de ce personnage (sert aux noms de fichiers)',
      footer: '// Open source, licence MIT. Conçu pour ComfyUI.',
      sections: {},
    },
  };

  // Line icons (24 x 24, stroke), drawn here so the app needs no icon font or download.
  const ICONS = {
    reuse: '<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4.5h4.5"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6.5 7l1 13h9l1-13"/><path d="M10 11v6M14 11v6"/>',
    download: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
    ear: '<path d="M8 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0"/><path d="M11 9a2 2 0 0 1 4 0c0 1.5-2 2-2 3"/>',
    chin: '<path d="M5 6c0 7 3 12 7 12s7-5 7-12"/><path d="M10 15c1 .8 3 .8 4 0"/>',
    forehead: '<path d="M5 14V10a7 7 0 0 1 14 0v4"/><path d="M7 15c1.5-1 3.5-1 5 0c1.5-1 3.5-1 5 0"/>',
    brow: '<path d="M3 12c2-3 5-4 8-3"/><path d="M13 9c3-1 6 0 8 3"/><path d="M6 16h3M15 16h3"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5h.01"/>',
    spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 16v4M17 18h4"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    ruler: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
    face: '<ellipse cx="12" cy="12" rx="7" ry="9"/>',
    nose: '<path d="M12 4c0 6-4 9-4 12a3 3 0 0 0 4 1 3 3 0 0 0 4-1c0-3-4-6-4-12"/>',
    mouth: '<path d="M4 12c3-3 5-3 8-1 3-2 5-2 8 1-3 4-13 4-16 0z"/><path d="M4 12h16"/>',
    tooth: '<path d="M7 4c2 0 3 1 5 1s3-1 5-1c3 0 4 3 3 6-1 4-1 10-3 10-2 0-2-6-5-6s-3 6-5 6c-2 0-2-6-3-10-1-3 0-6 3-6z"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    iris: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/>',
    drop: '<path d="M12 3s6 6.7 6 11a6 6 0 0 1-12 0c0-4.3 6-11 6-11z"/>',
    freckles: '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="11" r=".9" fill="currentColor"/><circle cx="11" cy="13.5" r=".9" fill="currentColor"/><circle cx="15.5" cy="11.5" r=".9" fill="currentColor"/><circle cx="14" cy="15" r=".9" fill="currentColor"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14.5s1.5 2 4 2 4-2 4-2"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.2 8.2 20 20M8.2 15.8 20 4"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-1.9 0-1.2-1-1.4-1-2.5 0-1 .9-1.6 2-1.6h2a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
    moustache: '<path d="M2.5 12.5c1.5 2.5 5 3 7.5.5.8-.8 1.3-1.2 2-1.2s1.2.4 2 1.2c2.5 2.5 6 2 7.5-.5"/><path d="M12 11.8V8"/>',
    shirt: '<path d="M8 3 3.5 6l2 4.5L8 9.5V21h8V9.5l2.5 1 2-4.5L16 3c0 2-1.8 3.2-4 3.2S8 5 8 3z"/>',
    glasses: '<circle cx="6.5" cy="14" r="3.5"/><circle cx="17.5" cy="14" r="3.5"/><path d="M10 14h4M3 14 2 9M21 14l1-5"/>',
    layout: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M11 5v14"/>',
    camera: '<path d="M3.5 8h3.5l2-3h6l2 3h3.5v11h-17z"/><circle cx="12" cy="13" r="3.5"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m3 17 5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1.5"/>',
    chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    ratio: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 11V9h2.5M17 13v2h-2.5"/>',
    grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    sprout: '<path d="M12 21v-9"/><path d="M12 12c0-4 3-7 8-7 0 5-3 7-8 7z"/><path d="M12 14.5c0-3-2.2-5-7-5 0 3.8 2.2 5 7 5z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    square: '<rect x="4" y="4" width="16" height="16" rx="2"/>',
    grid2: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 12h18"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
    body: '<circle cx="12" cy="5" r="2.5"/><path d="M6 9.5h12M12 9.5v5M9 21l3-6.5 3 6.5"/>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    text: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  };

  function icon(name) {
    const span = document.createElement('span');
    span.className = 'ico';
    span.setAttribute('aria-hidden', 'true');
    // Static markup from the table above, never user text.
    span.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.text}</svg>`;
    return span;
  }

  let lang = 'en';
  try {
    const saved = localStorage.getItem('cd-lang');
    if (saved === 'fr' || saved === 'en') lang = saved;
    else lang = (navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
  } catch (err) {
    lang = (navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
  }

  const state = {
    cfg: null,
    selection: {},
    custom: {},
    extra: '',
    activePreset: null,
    busy: false,
    jobToken: 0,
    history: [],
    view: -1,
    steps: [],
    pos: 0,
    model: null,
    render: { ratio: 'auto', resolution: null, on: false },
    seedMode: 'random',
    refs: [],
    groupRefs: {},
    // Free entries put aside by a click on a choice: kept in their field, greyed, back on a click.
    parked: {},
    refMode: 'sheet',
    batch: 1,
    name: '',
    comfyUrl: '',
    comfyOk: null,
    credits: NaN,
  };

  const t = (key) => STR[lang][key] || STR.en[key] || key;
  const label = (item) => (item && (item[lang] || item.en)) || '';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Each call names the provider it is for (header x-user-provider): the one picked for the current model.
  // Online, the visitor's own key for it goes along (x-user-key). Never in a URL. Keys stay in this browser.
  const BYOK = ['router', 'magnific', 'kie', 'fal'];
  const keys = {};
  let userProvider = '';
  try {
    const old = localStorage.getItem('cd-user-key');
    if (old) {
      localStorage.setItem('cd-user-key-magnific', old);
      localStorage.removeItem('cd-user-key');
    }
    for (const p of BYOK) keys[p] = localStorage.getItem(`cd-user-key-${p}`) || sessionStorage.getItem(`cd-user-key-${p}`) || '';
  } catch (err) {
    /* storage blocked: no saved key */
  }

  function storeKey(provider, key, remember) {
    keys[provider] = key;
    try {
      localStorage.removeItem(`cd-user-key-${provider}`);
      sessionStorage.removeItem(`cd-user-key-${provider}`);
      if (key) (remember ? localStorage : sessionStorage).setItem(`cd-user-key-${provider}`, key);
    } catch (err) {
      /* storage blocked: the key still works until the page is closed */
    }
  }

  async function api(path, options = {}) {
    const headers = { ...providerHeaders(userProvider), ...(options.headers || {}) };
    let res;
    try {
      res = await fetch(path, { ...options, headers });
    } catch (err) {
      // No answer at all: the connection dropped, or the app's server is not running.
      throw new Error(t('noAnswer'));
    }
    let data = {};
    try {
      data = await res.json();
    } catch (err) {
      data = {};
    }
    if (!res.ok) throw new Error(data.code === 'nomodel' ? t('noModelLocal') : data.error || `HTTP ${res.status}`);
    return data;
  }

  // Short provider names for small places (switch, labels, image info).
  // Logos of the providers and model makers: their own site icon, fetched through Google's favicon service
  // (nothing is copied into this repository). Offline, or when only a generic icon comes back, initials show instead.
  const LOGO_DOMAINS = {
    kie: 'kie.ai', fal: 'fal.ai', magnific: 'magnific.com', cloud: 'comfy.org', router: 'comfy.org', local: 'comfy.org',
    ZI: 'tongyi.aliyun.com', QW: 'qwen.ai', FX: 'bfl.ai', NB: 'gemini.google.com', GPT: 'openai.com', SD: 'seed.bytedance.com', KR: 'krea.ai', ID: 'ideogram.ai',
  };
  function logo(id, text, cls = '') {
    const box = document.createElement('span');
    box.className = `logo ${cls}`.trim();
    const words = document.createElement('span');
    words.className = 'logo-text';
    words.textContent = text;
    box.appendChild(words);
    const domain = LOGO_DOMAINS[id];
    if (domain) {
      const img = document.createElement('img');
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      img.loading = 'lazy';
      img.addEventListener('load', () => {
        // A tiny answer is the service's generic globe: keep the initials.
        if (img.naturalWidth >= 32) box.classList.add('has-img');
        else img.remove();
      });
      img.addEventListener('error', () => img.remove());
      img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      box.appendChild(img);
    }
    return box;
  }

  const shortName = (p) => (p === 'local' ? t('thisPc') : STR[lang].providers[p] ? STR[lang].providers[p][0] : p);
  // The same name in the middle of a sentence ("Your machine" becomes "your machine"; the others keep their own spelling).
  const inSentence = (p) => (p === 'local' ? shortName(p).charAt(0).toLowerCase() + shortName(p).slice(1) : shortName(p));

  function providerHeaders(provider) {
    if (!provider) return {};
    return { 'x-user-provider': provider, ...(keys[provider] ? { 'x-user-key': keys[provider] } : {}) };
  }

  function postJson(path, body, extra = {}) {
    return api(path, { method: 'POST', headers: { 'content-type': 'application/json', ...extra }, body: JSON.stringify(body) });
  }

  function store(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      /* storage can be blocked, the page still works */
    }
  }

  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  /* ---------- Layout ---------- */

  function setRatio(w, h) {
    if (w && h) document.documentElement.style.setProperty('--ar', `${w} / ${h}`);
  }

  // Menus on the left, image on the right. Narrow screens stack everything.
  function applyLayout() {
    const narrow = window.matchMedia('(max-width: 900px)').matches;
    document.body.classList.toggle('layout-side', !narrow);
  }

  /* ---------- History of settings: undo, redo, jump to any step ---------- */

  const snapshot = () => JSON.stringify({ selection: state.selection, custom: state.custom, extra: state.extra, activePreset: state.activePreset });

  // Records the settings as they are now, after a change, under a readable name.
  function commit(text) {
    clearTimeout(typingTimer);
    const snap = snapshot();
    if (state.steps[state.pos] && state.steps[state.pos].snap === snap) return;
    state.steps = state.steps.slice(0, state.pos + 1);
    state.steps.push({ snap, text, time: Date.now() });
    if (state.steps.length > 120) state.steps.shift();
    state.pos = state.steps.length - 1;
    syncSteps();
    // A setting changed while an image is on screen: nothing visible happens until the next generation,
    // so Generate glows again to say so (showCard removes it once a card is shown).
    if (state.history.length) $('generate').classList.add('hint');
  }

  // Typing records one step once the user pauses, not one per letter.
  let typingTimer = null;
  function commitSoon(text) {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => commit(text()), 900);
  }

  function restore(snap) {
    const s = JSON.parse(snap);
    state.selection = s.selection;
    state.custom = s.custom || {};
    for (const k of Object.keys(state.custom)) delete state.parked[k];
    state.extra = s.extra || '';
    state.activePreset = s.activePreset || null;
    $('extra').value = state.extra;
    for (const f of document.querySelectorAll('input.own')) f.value = state.custom[f.dataset.custom] || state.parked[f.dataset.custom] || '';
    syncControls();
    renderPresets();
    schedulePreview();
  }

  function goTo(index) {
    // A pending typed change is saved first, so it can be come back to.
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimer = null;
      const snap = snapshot();
      if (state.steps[state.pos].snap !== snap) commit(t('edit'));
    }
    if (index < 0 || index >= state.steps.length || index === state.pos) return;
    state.pos = index;
    restore(state.steps[index].snap);
    syncSteps();
  }

  const undo = () => goTo(state.pos - 1);
  const redo = () => goTo(state.pos + 1);

  function syncSteps() {
    $('undo').disabled = state.pos <= 0;
    $('redo').disabled = state.pos >= state.steps.length - 1;
    const list = $('stepList');
    list.textContent = '';
    for (let i = state.steps.length - 1; i >= 0; i--) {
      const step = state.steps[i];
      const b = document.createElement('button');
      b.type = 'button';
      b.className = i > state.pos ? 'step future' : 'step';
      b.setAttribute('aria-current', i === state.pos ? 'step' : 'false');
      const what = document.createElement('span');
      what.textContent = step.text;
      const when = document.createElement('time');
      when.textContent = new Date(step.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      b.append(what, when);
      b.addEventListener('click', () => goTo(i));
      list.appendChild(b);
    }
  }

  // French puts a space before the colon, English does not.
  const colon = () => (lang === 'fr' ? ' : ' : ': ');
  const quote = (text) => `"${String(text).trim().slice(0, 40)}${String(text).trim().length > 40 ? '...' : ''}"`;

  /* ---------- Controls ---------- */

  const groupById = (id) => state.cfg.options.groups.find((g) => g.id === id);
  const optionById = (group, id) => group.options.find((o) => o.id === id);

  function isSelected(group, id) {
    const v = state.selection[group.id];
    return group.type === 'multi' ? Array.isArray(v) && v.includes(id) : v === id;
  }

  function choose(group, id) {
    const was = isSelected(group, id);
    if (group.type === 'multi') {
      const list = Array.isArray(state.selection[group.id]) ? [...state.selection[group.id]] : [];
      const at = list.indexOf(id);
      if (at >= 0) list.splice(at, 1);
      else if (!group.max || list.length < group.max) list.push(id);
      state.selection[group.id] = list;
    } else {
      state.selection[group.id] = id;
    }
    // A single choice parks the free entry: it stays in its field, greyed, and comes back on a click.
    if (group.type !== 'multi' && (state.custom[group.id] || '').trim()) {
      state.parked[group.id] = state.custom[group.id];
      delete state.custom[group.id];
    }
    state.activePreset = null;
    syncControls();
    renderPresets();
    schedulePreview();
    const option = optionById(group, id);
    commit(`${label(group)}${colon()}${group.type === 'multi' ? (was ? '- ' : '+ ') : ''}${label(option)}`);
    // A docked menu with a single choice closes once picked.
    const pop = document.querySelector(`details.pop[data-group="${group.id}"]`);
    if (pop && group.type !== 'multi') pop.open = false;
  }

  const payloadSelection = () => ({ ...state.selection, custom: state.custom });

  // A click on a parked free entry makes it the choice again.
  function wake(group) {
    const kept = state.parked[group.id];
    if (!kept || (state.custom[group.id] || '').trim()) return;
    delete state.parked[group.id];
    state.custom[group.id] = kept;
    state.activePreset = null;
    syncControls();
    renderPresets();
    schedulePreview();
    commit(`${label(group)}${colon()}${currentValue(group)}`);
  }

  // One menu = a <details>. Section columns hold accordions; docked sections (render) open upwards from the bottom bar.
  function renderGroup(group, docked, accordionName) {
    const box = document.createElement('details');
    box.className = docked ? 'pop' : 'group';
    box.name = accordionName;
    box.dataset.group = group.id;

    const head = document.createElement('summary');
    if (docked) head.className = 'chipbtn';
    const name = document.createElement('span');
    name.className = 'g-name';
    name.textContent = label(group);
    const value = document.createElement('span');
    value.className = 'g-value';
    if (docked) {
      const words = document.createElement('span');
      words.className = 'words';
      words.append(name, value);
      head.append(icon(group.icon), words);
    } else {
      head.append(icon(group.icon), name, value);
    }
    box.appendChild(head);

    const body = document.createElement('div');
    body.className = docked ? 'pop-panel' : 'g-body';
    if (group.type === 'multi') {
      const bar = document.createElement('div');
      bar.className = 'multi-bar';
      if (group.max) {
        const hint = document.createElement('small');
        hint.className = 'g-hint';
        hint.textContent = `${t('max')} ${group.max}`;
        bar.appendChild(hint);
      }
      // Removes every choice of the menu at once.
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'ghost small multi-clear';
      clear.dataset.clear = group.id;
      clear.textContent = t('clearAll');
      clear.addEventListener('click', () => {
        if (!(state.selection[group.id] || []).length) return;
        state.selection[group.id] = [];
        state.activePreset = null;
        syncControls();
        renderPresets();
        schedulePreview();
        commit(`${label(group)}${colon()}${t('cleared')}`);
      });
      bar.appendChild(clear);
      body.appendChild(bar);
    }
    const tiles = document.createElement('div');
    tiles.className = 'tiles';
    for (const option of group.options) {
      // The wheel of emotions holds its options, neutral in the middle: no tiles for them.
      if (group.wheel) break;
      if (group.followHair && option.id === 'hair') continue;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tile';
      b.dataset.group = group.id;
      b.dataset.id = option.id;
      // Square thumbnail: a preview image when the option has one, else a colour swatch or a placeholder.
      const thumb = document.createElement('span');
      thumb.className = 'thumb';
      if (group.chips) {
        // Chips: the name only, no picture.
      } else if (option.img) {
        thumb.style.backgroundImage = `url("${option.img}")`;
      } else if (option.sw) {
        const sw = document.createElement('span');
        sw.className = 'sw';
        sw.style.background = option.sw;
        thumb.appendChild(sw);
      } else {
        const initial = document.createElement('span');
        initial.className = 'initial';
        initial.textContent = label(option).slice(0, 2);
        thumb.appendChild(initial);
      }
      const name2 = document.createElement('span');
      name2.textContent = label(option);
      if (group.chips) b.append(name2);
      else b.append(thumb, name2);
      b.addEventListener('click', () => choose(group, option.id));
      tiles.appendChild(b);
    }
    if (group.followHair) body.prepend(followHairToggle(group, body));
    if (group.chips) tiles.classList.add('chips');
    if (!group.wheel && !group.noTiles) body.appendChild(tiles);
    for (const inner of state.cfg.options.groups.filter((g) => g.toggleIn === group.id)) body.appendChild(toggleRow(inner));
    if (group.wheel) body.appendChild(emotionWheel(group));
    if (group.facePanel) body.appendChild(facePanel(group));
    else if (group.editorLink) body.appendChild(faceEditorButton(group.id));

    const own = document.createElement('input');
    own.type = 'text';
    own.className = 'own';
    own.maxLength = 200;
    own.dataset.custom = group.id;
    own.placeholder = t('customPlaceholder');
    own.value = state.custom[group.id] || state.parked[group.id] || '';
    own.addEventListener('focus', () => wake(group));
    own.addEventListener('input', () => {
      delete state.parked[group.id];
      if (own.value.trim()) state.custom[group.id] = own.value;
      else delete state.custom[group.id];
      state.activePreset = null;
      syncControls();
      renderPresets();
      schedulePreview();
      commitSoon(() => `${label(group)}${colon()}${own.value.trim() ? quote(own.value) : t('cleared')}`);
    });
    // A × in the field empties it (shown only when something is typed).
    const ownWrap = document.createElement('span');
    ownWrap.className = 'own-wrap';
    ownWrap.append(own, clearButton(() => {
      own.value = '';
      own.dispatchEvent(new Event('input'));
    }));
    body.appendChild(ownWrap);
    // The kind of free entry depends on the menu: none (gender), a number (age), a slider (height), a colour, or text.
    if (group.noCustom || group.color) own.hidden = true;
    if (group.customType === 'number') {
      own.type = 'number';
      own.min = group.min != null ? group.min : 0;
      own.max = group.max != null ? group.max : 120;
      own.step = 1;
      own.inputMode = 'numeric';
      own.placeholder = t('agePlaceholder');
      own.classList.add('own-number');
      body.appendChild(numberRow(group, own));
    }
    if (group.customType === 'height') {
      own.hidden = true;
      body.appendChild(heightRow(group, own));
    }
    // The field moved into a row of its own (age), or hidden: its wrapper goes too.
    if (own.parentElement !== ownWrap || own.hidden) ownWrap.hidden = true;
    if (group.refs) body.appendChild(groupRefsZone(group));
    // Colour menus: a hex code field, with a swatch that opens the system colour picker.
    if (group.color) {
      const row = document.createElement('div');
      row.className = 'hexrow';
      row.dataset.group = group.id;
      const well = document.createElement('label');
      well.className = 'well';
      well.title = t('pickColor');
      const input = document.createElement('input');
      input.type = 'color';
      input.value = '#888888';
      well.appendChild(input);
      input.addEventListener('click', () => wake(group));
      const hex = document.createElement('input');
      hex.type = 'text';
      hex.className = 'hex';
      hex.maxLength = 7;
      hex.spellcheck = false;
      hex.placeholder = t('hexPlaceholder');
      hex.addEventListener('focus', () => wake(group));
      // Eyes of two colours keep their second colour after a change of the first.
      const second = () => (group.id === 'eyeColor' ? ((state.custom[group.id] || '').split('|')[1] || '') : '');
      const apply = (value) => {
        own.value = value && second() ? `${value}|${second()}` : value;
        own.dispatchEvent(new Event('input'));
      };
      input.addEventListener('input', () => {
        hex.value = input.value.toUpperCase();
        apply(hex.value);
      });
      hex.addEventListener('input', () => {
        const v = hex.value.trim().replace(/^([0-9a-f]{6})$/i, '#$1').toUpperCase();
        if (/^#[0-9A-F]{6}$/.test(v)) apply(v);
        else if (!v && /^#[0-9a-f]{6}$/i.test(own.value.trim())) apply('');
      });
      // Reset: drops the custom colour (kept or not), the choice above applies again.
      const reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'ghost small hex-reset';
      reset.textContent = '×';
      reset.title = t('resetColor');
      reset.setAttribute('aria-label', t('resetColor'));
      reset.addEventListener('click', () => {
        delete state.parked[group.id];
        hex.value = '';
        apply('');
      });
      row.append(well, hex, reset);
      body.insertBefore(row, ownWrap);
    }
    box.appendChild(body);
    return box;
  }

  /* ---------- Parametric face: sliders with notches, and a schematic face that follows them ---------- */

  // Slider positions (0 to 100, 50 = neutral) live next to the free text of their menu, under "~<menu>".
  // A choice in the tiles puts the sliders at its notch ("at" in options.json).
  function sliderValues(group) {
    const vals = {};
    for (const sl of group.sliders || []) vals[sl.id] = 50;
    const kept = state.custom[group.id] ? state.custom[`~${group.id}`] : '';
    if (kept) {
      for (const pair of kept.split(',')) {
        const [k, v] = pair.split(':');
        if (k in vals && Number.isFinite(Number(v))) vals[k] = Number(v);
      }
      return vals;
    }
    const option = optionById(group, state.selection[group.id]);
    return { ...vals, ...((option && option.at) || {}) };
  }
  // Five steps per slider: very, slightly, neutral, slightly, very (the words come from options.json).
  const level = (v) => (v < 15 ? 0 : v < 38 ? 1 : v <= 62 ? 2 : v <= 85 ? 3 : 4);
  function sliderPhrase(group, vals) {
    const adjectives = [];
    const clauses = [];
    for (const sl of group.sliders) {
      const word = sl.words[level(vals[sl.id])];
      if (!word) continue;
      if (sl.noun) clauses.push(`${word} ${sl.noun}`);
      else adjectives.push(word);
    }
    const main = adjectives.length ? `${adjectives.join(', ')}${group.noun ? ` ${group.noun}` : ''}` : '';
    return [main, ...clauses].filter(Boolean).join(', ');
  }
  function setSlider(group, id, value) {
    const vals = sliderValues(group);
    vals[id] = value;
    const phrase = sliderPhrase(group, vals);
    delete state.parked[group.id];
    if (phrase) {
      state.custom[group.id] = phrase;
      state.custom[`~${group.id}`] = Object.entries(vals).map(([k, v]) => `${k}:${v}`).join(',');
    } else {
      // Every slider back in the middle: the neutral choice.
      delete state.custom[group.id];
      delete state.custom[`~${group.id}`];
      if (group.neutral) state.selection[group.id] = group.neutral;
    }
    state.activePreset = null;
    syncControls();
    renderPresets();
    schedulePreview();
    commitSoon(() => `${label(group)}${colon()}${phrase || label(optionById(group, group.neutral) || {})}`);
  }

  // Colours of the two eyes: the chosen colour, or two different ones.
  function eyeColours() {
    const group = groupById('eyeColor');
    const own = (state.custom.eyeColor || '').trim();
    const option = optionById(group, state.selection.eyeColor);
    const base = (option && option.sw) || '#6b4a2b';
    const [a, b] = own.split('|');
    const first = /^#[0-9a-f]{6}$/i.test(a || '') ? a : base;
    return [first, /^#[0-9a-f]{6}$/i.test(b || '') ? b : first];
  }

  // Smooth closed (or open) path through points (Catmull-Rom turned into Bezier curves).
  function smoothPath(pts, closed = true) {
    const n = pts.length;
    const at = (k) => pts[closed ? (k + n) % n : Math.max(0, Math.min(n - 1, k))];
    const f = (v) => v.toFixed(1);
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let k = 0; k < (closed ? n : n - 1); k++) {
      const [p0, p1, p2, p3] = [at(k - 1), at(k), at(k + 1), at(k + 2)];
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return closed ? `${d}Z` : d;
  }
  // Mirror of points on the right half, for a symmetric outline (right side top to bottom, then the left back up).
  const mirrored = (cx, right) => [...right, ...right.slice().reverse().map(([x, y]) => [2 * cx - x, y])];

  // Colours of the face drawing: the chosen skin, hair (for the brows) and eyes.
  // Eyebrows: the hair colour unless "same as hair" is unticked.
  const followsHair = () => state.selection.browColor === 'hair' && !(state.custom.browColor || '').trim();
  const browColour = (hair) => (followsHair() ? hair : swatch('browColor', hair));

  // "Same colour as the hair" box of a menu that follows the hair (eyebrows): ticked, the colours are hidden.
  function followHairToggle(group, holder) {
    const row = document.createElement('label');
    row.className = 'follow-hair';
    const box = document.createElement('input');
    box.type = 'checkbox';
    const words = document.createElement('span');
    words.textContent = t('sameAsHair');
    row.append(box, words);
    box.addEventListener('change', () => {
      if (box.checked) {
        delete state.parked[group.id];
        setColour(group.id, '');
        choose(group, 'hair');
      } else {
        // Starts from the hair colour, ready to be changed.
        setColour(group.id, swatch('hairColor', '#3b2417'));
      }
    });
    row.sync = () => {
      box.checked = followsHair();
      holder.classList.toggle('follow-on', box.checked);
    };
    return row;
  }

  // A yes/no group as a box (cleft chin, inside the Chin menu and its block in the face editor).
  function toggleRow(group) {
    const row = document.createElement('label');
    row.className = 'follow-hair toggle-row';
    const box = document.createElement('input');
    box.type = 'checkbox';
    const words = document.createElement('span');
    words.textContent = label(group);
    row.append(box, words);
    box.addEventListener('change', () => choose(group, box.checked ? 'yes' : 'no'));
    row.sync = () => {
      box.checked = state.selection[group.id] === 'yes';
    };
    return row;
  }

  function swatch(groupId, fallback) {
    const group = groupById(groupId);
    const own = (state.custom[groupId] || '').trim().split('|')[0];
    if (/^#[0-9a-f]{6}$/i.test(own)) return own;
    const option = group && optionById(group, state.selection[groupId]);
    return (option && option.sw) || fallback;
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)));
    return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  }

  let faceSeq = 0;
  // Drawing style of the face: 'avatar' (flat colours) or 'plate' (anatomy plate: ink lines on paper, construction guides).
  let faceStyle = read('cd-face-style') === 'avatar' ? 'avatar' : 'plate';
  // Which side of the head the drawings show: front or profile (the guide sent to the models stays the front).
  let faceView = read('cd-face-view') === 'profile' ? 'profile' : 'front';
  // out: 'control' (lines only, open skull so the hair stays free: the image for ControlNet) or 'ref' (flat colours: a reference image).
  // An ear seen from the front: an oval, its top drawn out to a point when the tip slider is high.
  function earFront(x, y, rx, ry, side, tip, attrs) {
    const p = Math.max(0, tip - 55) / 45;
    const top = [x + side * rx * (0.3 + 0.5 * p), y - ry * (1 + 0.9 * p)];
    const d = smoothPath([[x, y - ry * 0.9], top, [x + side * rx, y - ry * 0.2], [x + side * rx * 0.8, y + ry * 0.6], [x + side * rx * 0.1, y + ry], [x - side * rx * 0.4, y + ry * 0.2]]);
    return `<path d="${d}" ${attrs}/>`;
  }

  // Face drawing seen from the side (looking left), with the same settings as the front view.
  function profileSvg(focus, edit) {
    const plate = faceStyle === 'plate';
    const ink = '#4a3a2c';
    const paper = '#f1ebdd';
    const c = (avatar, inPlate) => (plate ? inPlate : avatar);
    const uid = `fp${(faceSeq += 1)}`;
    const g = (id) => sliderValues(groupById(id));
    const f = g('faceShape');
    const e = g('eyeShape');
    const n = g('nose');
    const m = g('mouth');
    const [c1] = eyeColours();
    const skin = swatch('skin', '#d9a97c');
    const hair = swatch('hairColor', '#3b2417');
    const browC = browColour(hair);
    const lipColour = state.selection.lipColor === 'natural' && !(state.custom.lipColor || '').trim() ? shade(skin, -0.28) : swatch('lipColor', shade(skin, -0.28));
    const cy = 106;
    const h = 64 + (f.length - 50) * 0.26;
    const j = f.jaw / 100;
    const depth = 92 + (f.width - 50) * 0.12;
    const fx = 56;
    const eyeY = cy + h * 0.04;
    const ew = 11 * (0.75 + e.size / 200);
    const eh = ew * 0.48;
    const browY = eyeY - eh * 2.6;
    const noseLen = 24 + (n.length - 50) * 0.18;
    const nasion = [fx + 5, eyeY - 2];
    const baseY = nasion[1] + noseLen;
    const tipX = fx - 9 - (n.length - 50) * 0.1 - (n.width - 50) * 0.02;
    const tipY = baseY - 2 + (50 - n.tip) * 0.09;
    const bump = (n.bridge - 50) * 0.2;
    const mouthY = baseY + (cy + h - baseY) * 0.38;
    const lip = 1.5 + m.fullness * 0.035;
    const chinY = cy + h * 0.96;
    const ch = g('chin');
    const ea = g('ears');
    const fo = g('forehead');
    const br = g('brows');
    const browYp = browY - (br.height - 50) * 0.08;
    const earK = 0.75 + ea.size / 200;
    // Forehead: higher, sloping back, with a brow ridge that juts out.
    const foreH = (fo.height - 50) * 0.12;
    const slope = (fo.slope - 50) * 0.16;
    const ridge = (fo.ridge - 50) * 0.06;
    // Jaw angle: further back and higher when the jaw is soft, sharper and lower when square.
    const jawPt = [fx + depth * (0.5 - 0.06 * j), cy + h * (0.5 + 0.14 * j)];
    const front = [
      [fx + depth * 0.45 + slope * 0.6, cy - h - foreH],
      [fx + 10 + slope, cy - h * 0.82 - foreH * 0.8],
      [fx + 1 + slope * 0.5, cy - h * 0.4 - foreH * 0.4],
      [fx - 1 - ridge, browY + 1],
      nasion,
      [(nasion[0] + tipX) / 2 - bump, (nasion[1] + tipY) / 2],
      [tipX, tipY],
      [fx - 2, baseY + 2],
      [fx + 3, baseY + 3],
      [fx - lip + 1, mouthY - 3],
      [fx + 3, mouthY],
      [fx - lip + 2, mouthY + 3.5],
      [fx + 4, mouthY + 8],
      [fx + 1 - j * 2 - (ch.jut - 50) * 0.12, chinY - 4],
      [fx + 9, chinY + 1],
      [fx + depth * 0.28, chinY - 2 - j * 2],
      jawPt,
      // Behind the jaw: down to the neck, no notch under the ear.
      [fx + depth * 0.64, cy + h * 0.5],
      [fx + depth * 0.86, cy + h * 0.5],
      [fx + depth * 1.0, cy + h * 0.05],
      [fx + depth * 1.02, cy - h * 0.45],
      [fx + depth * 0.82, cy - h * 0.88 - foreH * 0.5],
    ];
    const head = smoothPath(front);
    // Neck and shoulders: the throat under the jaw, the nape behind, down to the chest and the back.
    const neck = smoothPath([
      [fx + depth * 0.3, chinY - 6],
      [fx + depth * 0.32, chinY + 20],
      [fx + depth * 0.18, chinY + 40],
      [fx - 6, 238],
      [fx + depth * 1.25, 238],
      [fx + depth * 1.0, chinY + 30],
      [fx + depth * 0.9, cy + h * 0.55],
      [fx + depth * 0.66, cy + h * 0.45],
      [fx + depth * 0.42, cy + h * 0.5],
    ]);
    const line = plate ? ` stroke="${ink}" stroke-width="1.1" stroke-linejoin="round"` : '';
    const ex = fx + 9;
    const eyeShape = `M${ex - ew * 0.15} ${eyeY - eh * 0.2}Q${ex + ew * 0.5} ${eyeY - eh * 1.1} ${ex + ew * 0.75} ${eyeY - eh * 0.1 - (e.tilt - 50) * 0.04}Q${ex + ew * 0.45} ${eyeY + eh * 0.9} ${ex - ew * 0.1} ${eyeY + eh * 0.25}Z`;
    const guide = (x1, y1, x2, y2) => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    const guides = !plate ? '' : `<g fill="none" stroke="#a0522d" stroke-width=".5" stroke-dasharray="2 2" opacity=".7">
        <circle cx="${(fx + depth * 0.55).toFixed(1)}" cy="${(cy - h * 0.28).toFixed(1)}" r="${(depth * 0.45).toFixed(1)}"/>
        ${[browY, eyeY, baseY, mouthY, chinY].map((y) => guide(fx - 22, y, fx + depth + 8, y)).join('')}
        ${guide(fx + depth * 0.62, cy - h - 6, fx + depth * 0.62, chinY + 8)}
      </g>
      <g fill="#a0522d" font-family="monospace" font-size="5" opacity=".8">
        ${[[browY, 'A'], [baseY, 'B'], [chinY, 'C']].map(([y, k]) => `<text x="${(fx + depth + 10).toFixed(1)}" y="${(y + 1.7).toFixed(1)}">${k}</text>`).join('')}
      </g>`;
    const handles = !edit ? '' : [
      [tipX, tipY, 'nose', 'nose.length:x:-9 nose.tip:y:-11'],
      [(nasion[0] + tipX) / 2 - bump, (nasion[1] + tipY) / 2, 'nose', 'nose.bridge:x:-8'],
      [fx - lip + 1, mouthY - 3, 'mouth', 'mouth.fullness:x:-25'],
      [fx + 1 - j * 2 - (ch.jut - 50) * 0.12, chinY - 4, 'chin', 'chin.jut:x:-8'],
      [fx + depth * 0.6 + 6 * earK, eyeY + 8 - h * 0.12, 'ears', 'ears.size:y:-9 ears.tip:x:10'],
      [fx + 10 + slope, cy - h * 0.82 - foreH * 0.8, 'forehead', 'forehead.slope:x:6 forehead.height:y:-8'],
      [fx - 1 - ridge, browY + 1, 'forehead', 'forehead.ridge:x:-12'],
      [fx + 10, browYp - 2 - br.arch * 0.04, 'brows', 'brows.arch:y:-14 brows.thick:x:10'],
      [fx + 20 + (br.length - 50) * 0.1, browYp - 1 - (br.tail - 50) * 0.04, 'brows', 'brows.length:x:10 brows.tail:y:-14'],
      [fx + 2 - ridge * 0.5, browYp - 1 + (br.angle - 50) * 0.05 + 4, 'brows', 'brows.height:y:-10'],
      [jawPt[0], jawPt[1], 'faceShape', 'faceShape.jaw:y:8'],
      [fx + depth * 1.02, cy - h * 0.45, 'faceShape', 'faceShape.width:x:8'],
      [ex + ew * 0.75, eyeY, 'eyeShape', 'eyeShape.size:x:9 eyeShape.tilt:y:-9'],
    ].map(([x, y, g2, map]) => `<g class="fp-h${focus === g2 ? ' on' : ''}" data-h="${map}" data-g="${g2}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" class="fp-hit"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" class="fp-dot"/></g>`).join('');
    return `<svg viewBox="0 0 200 230" aria-hidden="true">
      <defs><radialGradient id="${uid}s" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="${shade(skin, 0.14)}"/><stop offset=".7" stop-color="${skin}"/><stop offset="1" stop-color="${shade(skin, -0.22)}"/></radialGradient></defs>
      ${plate ? `<rect width="200" height="230" fill="${paper}"/>` : ''}
      <path d="${neck}" fill="${c(shade(skin, -0.18), paper)}"${line}/>
      <path d="${head}" fill="${c(`url(#${uid}s)`, paper)}"${line}/>
      ${earFront(fx + depth * 0.6, eyeY + 8, 6 * earK, h * 0.17 * earK, 1, ea.tip, `fill="${c(shade(skin, -0.1), paper)}"${line || ` stroke="${shade(skin, -0.3)}" stroke-width=".8"`}`)}
      <path d="M${fx + depth * 0.62 - 1.5} ${eyeY + 3}q3 5 0 10" fill="none" stroke="${c(shade(skin, -0.35), ink)}" stroke-width=".8" opacity=".7"/>
      ${guides}
      <path d="M${fx + 1 - ridge * 0.5} ${browYp - 1 + (br.angle - 50) * 0.05}Q${fx + 10} ${browYp - 1.5 - br.arch * 0.04} ${fx + 20 + (br.length - 50) * 0.1} ${browYp - 1 - (br.tail - 50) * 0.04}" fill="none" stroke="${c(browC, ink)}" stroke-width="${(0.9 + br.thick * 0.035).toFixed(2)}" stroke-linecap="round" opacity="${c('.9', '.75')}"/>
      <path d="${eyeShape}" fill="${c('#f4f1ea', '#fbf8f1')}"${plate ? ` stroke="${ink}" stroke-width=".7"` : ''}/>
      <ellipse cx="${ex + ew * 0.12}" cy="${eyeY}" rx="${eh * 0.35}" ry="${eh * 0.8}" fill="${c1}"${plate ? ' opacity=".75"' : ''}/>
      <path d="M${ex - ew * 0.15} ${eyeY - eh * 0.2}Q${ex + ew * 0.5} ${eyeY - eh * 1.1} ${ex + ew * 0.75} ${eyeY - eh * 0.1 - (e.tilt - 50) * 0.04}" fill="none" stroke="${c(shade(skin, -0.75), ink)}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M${tipX + 5} ${baseY - 1}q3 -2 6 1" fill="none" stroke="${c(shade(skin, -0.5), ink)}" stroke-width="1" stroke-linecap="round"/>
      <path d="M${fx - lip + 1} ${mouthY - 3}Q${fx + 1} ${mouthY - 1} ${fx + 3} ${mouthY}Q${fx + 1} ${mouthY + 1} ${fx - lip + 2} ${mouthY + 3.5}" fill="${lipColour}"${plate ? ` fill-opacity=".45"${line}` : ''}/>
      <path d="M${fx + 1} ${mouthY}L${fx + 7} ${mouthY + 0.5}" stroke="${c(shade(lipColour, -0.45), ink)}" stroke-width="1" stroke-linecap="round"/>
      ${handles}
    </svg>`;
  }

  function faceSvg(focus, edit, out) {
    if (!out && faceView === 'profile') return profileSvg(focus, edit);
    const plate = out ? out === 'control' : faceStyle === 'plate';
    const ink = '#4a3a2c';
    const paper = out === 'control' ? '#fff' : '#f1ebdd';
    // One colour in each style.
    const c = (avatar, inPlate) => (plate ? inPlate : avatar);
    // Ids unique to each drawing: a gradient or clip defined in a hidden (closed) menu would not paint.
    const uid = `fp${(faceSeq += 1)}`;
    const g = (id) => sliderValues(groupById(id));
    const f = g('faceShape');
    const e = g('eyeShape');
    const n = g('nose');
    const m = g('mouth');
    const [c1, c2] = eyeColours();
    const skin = swatch('skin', '#d9a97c');
    const hair = swatch('hairColor', '#3b2417');
    const browC = browColour(hair);
    const cx = 100;
    const cy = 106;
    const w = 46 + (f.width - 50) * 0.26;
    const h = 64 + (f.length - 50) * 0.26;
    const j = f.jaw / 100;
    const ch = g('chin');
    const ea = g('ears');
    const fo = g('forehead');
    const br = g('brows');
    // Forehead: a higher one raises the top of the head.
    const foreH = (fo.height - 50) * 0.12;
    // Chin: broader or pointed, a little lower when it juts out.
    const chinW = (ch.width - 50) * 0.003;
    const chinDrop = (ch.jut - 50) * 0.04;
    const earK = 0.75 + ea.size / 200;
    const earOut = (ea.out - 50) * 0.05;
    // Head outline, right half: crown, temple, cheekbone, jaw corner, chin.
    const head = smoothPath(mirrored(cx, [
      [cx, cy - h - foreH],
      [cx + w * 0.72, cy - h * 0.82 - foreH * 0.8],
      [cx + w, cy - h * 0.3],
      [cx + w * 0.98, cy + h * 0.15],
      [cx + w * (0.6 + 0.32 * j), cy + h * (0.6 + 0.1 * j)],
      [cx + w * (0.16 + 0.22 * j + chinW), cy + h * 0.96 + chinDrop],
    ]).filter((p, k, all) => k === 0 || k !== all.length - 1 || p[0] !== cx));
    // For ControlNet: the face from the temples down only, no skull to copy.
    const jawR = [cx + w * (0.6 + 0.32 * j), cy + h * (0.6 + 0.1 * j)];
    const chinR = [cx + w * (0.16 + 0.22 * j + chinW), cy + h * 0.96 + chinDrop];
    const faceLow = smoothPath([[cx + w, cy - h * 0.3], [cx + w * 0.98, cy + h * 0.15], jawR, chinR, [2 * cx - chinR[0], chinR[1]], [2 * cx - jawR[0], jawR[1]], [cx - w * 0.98, cy + h * 0.15], [cx - w, cy - h * 0.3]], false);
    const eyeY = cy + h * 0.04;
    const ew = 11 * (0.75 + e.size / 200);
    // Eye spacing, never so close that the eyes (or the brows) touch.
    const d = Math.max(ew + 3, 19 + (e.spacing - 50) * 0.16);
    const eh = ew * 0.48;
    const tilt = (e.tilt - 50) * 0.28;
    const eye = (x, side, colour, k) => {
      const outer = x + ew * side;
      const inner = x - ew * side;
      const shape = `M${inner} ${eyeY}Q${x - ew * 0.2 * side} ${eyeY - eh * 1.5} ${outer} ${eyeY - eh * 0.1}Q${x} ${eyeY + eh * 1.25} ${inner} ${eyeY}Z`;
      return `<g transform="rotate(${-tilt * side} ${x} ${eyeY})">
        <clipPath id="${uid}e${k}"><path d="${shape}"/></clipPath>
        <path d="${shape}" fill="${c('#f4f1ea', '#fbf8f1')}"${plate ? ` stroke="${ink}" stroke-width=".7"` : ''}/>
        <g clip-path="url(#${uid}e${k})"><circle cx="${x}" cy="${eyeY}" r="${eh * 1.05}" fill="${colour}"${plate ? ` opacity=".75" stroke="${ink}" stroke-width=".6"` : ''}/><circle cx="${x}" cy="${eyeY}" r="${eh * 0.45}" fill="${c('#0b0b0b', ink)}"/><circle cx="${x + eh * 0.35}" cy="${eyeY - eh * 0.35}" r="${eh * 0.2}" fill="#fff" opacity=".85"/></g>
        <path d="M${inner} ${eyeY}Q${x - ew * 0.2 * side} ${eyeY - eh * 1.5} ${outer} ${eyeY - eh * 0.1}" fill="none" stroke="${c(shade(skin, -0.75), ink)}" stroke-width="${c(1.6, 1.2)}" stroke-linecap="round"/>
        <path d="M${inner + ew * 0.2 * side} ${eyeY - eh * 1.25}Q${x} ${eyeY - eh * 2.1} ${outer} ${eyeY - eh * 0.75}" fill="none" stroke="${c(shade(skin, -0.35), ink)}" stroke-width=".9" opacity=".6"/>
      </g>`;
    };
    const browY = eyeY - eh * 2.6;
    // Brows: thickness, arch (the peak goes up) and angle (the inner end goes down when frowning).
    const bTh = 0.5 + br.thick * 0.026;
    const bArch = 0.4 + br.arch * 0.045;
    const bAng = (br.angle - 50) * 0.07;
    const unibrow = state.selection.browJoin === 'yes';
    // Length (the outer end), height above the eye, spacing (the whole brow moves sideways) and tail (the outer end goes up or down).
    const kLen = 1 + (br.length - 50) * 0.008;
    const by = browY - (br.height - 50) * 0.08;
    const dB = Math.max(ew * 1.05 + 0.4, d + (br.gap - 50) * 0.12);
    const tailY = -(br.tail - 50) * 0.05;
    const brow = (x, side) => smoothPath([
      [x - ew * 1.05 * side, by + 2.4 + bAng - bTh * 0.6],
      [x - ew * 0.2 * side, by - bArch - bTh * 0.5],
      [x + ew * 1.15 * kLen * side, by + 1.1 - bAng * 0.3 + tailY],
      [x + ew * 1.1 * kLen * side, by + 1.1 - bAng * 0.3 + tailY + bTh * 0.4],
      [x - ew * 0.2 * side, by - bArch + bTh * 0.6],
      [x - ew * 1.05 * side, by + 2.4 + bAng + bTh * 0.7],
    ]);
    const noseTop = eyeY + 2;
    const noseBot = eyeY + 26 + (n.length - 50) * 0.18;
    const nw = 7.5 + (n.width - 50) * 0.09;
    const bulge = (n.bridge - 50) * 0.16;
    const tipY = noseBot + (50 - n.tip) * 0.07;
    // For ControlNet (out 'control') the bridge line is left out: it came back as a line drawn down the nose.
    const nose = `${out === 'control' ? '' : `<path d="M${cx - 4} ${noseTop}Q${cx - 5 - bulge} ${(noseTop + noseBot) / 2} ${cx - nw * 0.55} ${noseBot - 3}" fill="none" stroke="${c(shade(skin, -0.3), ink)}" stroke-width="${c(1.3, 0.9)}" stroke-linecap="round" opacity=".8"/>`}
      <ellipse cx="${cx}" cy="${tipY - 1}" rx="${nw * 0.55}" ry="${nw * 0.4}" fill="${shade(skin, 0.18)}" opacity="${c('.7', '0')}"/>
      <path d="M${cx - nw} ${noseBot - 3}Q${cx - nw * 1.15} ${noseBot + 2} ${cx - nw * 0.45} ${tipY + 2.5}Q${cx} ${tipY + 4} ${cx + nw * 0.45} ${tipY + 2.5}Q${cx + nw * 1.15} ${noseBot + 2} ${cx + nw} ${noseBot - 3}" fill="none" stroke="${c(shade(skin, -0.45), ink)}" stroke-width="${c(1.4, 1)}" stroke-linecap="round"/>
      <ellipse cx="${cx - nw * 0.42}" cy="${tipY + 1.6}" rx="${nw * 0.2}" ry="${nw * 0.1}" fill="${c(shade(skin, -0.6), ink)}"/><ellipse cx="${cx + nw * 0.42}" cy="${tipY + 1.6}" rx="${nw * 0.2}" ry="${nw * 0.1}" fill="${c(shade(skin, -0.6), ink)}"/>`;
    const mouthY = noseBot + (cy + h - noseBot) * 0.38;
    const mw = 13 + (m.width - 50) * 0.14;
    const lip = 2.2 + m.fullness * 0.055;
    // Natural lips: a darker shade of the skin.
    const lipColour = state.selection.lipColor === 'natural' && !(state.custom.lipColor || '').trim() ? shade(skin, -0.28) : swatch('lipColor', shade(skin, -0.28));
    const upper = `M${cx - mw} ${mouthY}Q${cx - mw * 0.55} ${mouthY - lip * 1.1} ${cx - mw * 0.18} ${mouthY - lip * 1.05}Q${cx} ${mouthY - lip * 0.6} ${cx + mw * 0.18} ${mouthY - lip * 1.05}Q${cx + mw * 0.55} ${mouthY - lip * 1.1} ${cx + mw} ${mouthY}Q${cx} ${mouthY + 0.8} ${cx - mw} ${mouthY}Z`;
    const lower = `M${cx - mw * 0.92} ${mouthY + 0.4}Q${cx} ${mouthY + lip * 1.9} ${cx + mw * 0.92} ${mouthY + 0.4}Q${cx} ${mouthY + 1.2} ${cx - mw * 0.92} ${mouthY + 0.4}Z`;
    const glow = (id) => (focus === id && !edit && !plate && !out ? ` filter="url(#${uid}g)"` : '');
    const neckW = w * 0.42;
    const body = smoothPath(mirrored(cx, [
      [cx + neckW, cy + h * 0.7],
      [cx + neckW * 1.02, cy + h * 1.12],
      [cx + w * 1.25, cy + h * 1.32],
      [cx + w * 1.85, cy + h * 1.55],
      [cx + w * 2.05, 250],
    ]), false);
    const line = plate ? ` stroke="${ink}" stroke-width="1.1" stroke-linejoin="round"` : '';
    // Anatomy plate: construction of the head (cranium circle, middle line, brow, eye, nose and mouth lines, thirds).
    const guide = (x1, y1, x2, y2) => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    const span = w + 16;
    const guides = !plate || out ? '' : `<g fill="none" stroke="#a0522d" stroke-width=".5" stroke-dasharray="2 2" opacity=".7">
        <circle cx="${cx}" cy="${(cy - h * 0.28).toFixed(1)}" r="${(w * 0.92).toFixed(1)}"/>
        ${guide(cx, cy - h - 8, cx, cy + h + 8)}
        ${[browY, eyeY, noseBot, mouthY, cy + h * 0.96].map((y) => guide(cx - span, y, cx + span, y)).join('')}
        ${guide(cx - w, cy - h * 0.4, cx - w, cy + h * 0.5)}${guide(cx + w, cy - h * 0.4, cx + w, cy + h * 0.5)}
      </g>
      <g fill="#a0522d" font-family="monospace" font-size="5" opacity=".8">
        ${[[browY, 'A'], [noseBot, 'B'], [cy + h * 0.96, 'C']].map(([y, k]) => `<text x="${(cx + span + 2).toFixed(1)}" y="${(y + 1.7).toFixed(1)}">${k}</text>`).join('')}
      </g>`;
    // Editor: points to drag. Each one moves sliders: "menu.slider:axis:gain", gain in slider steps per drawing unit.
    const handles = !edit ? '' : [
      [cx - w, cy, 'faceShape', `faceShape.width:x:-3.8`],
      [cx + w, cy, 'faceShape', `faceShape.width:x:3.8`],
      [cx, cy + h * 0.96, 'faceShape', `faceShape.length:y:4`],
      [cx - w * (0.6 + 0.32 * j), cy + h * (0.6 + 0.1 * j), 'faceShape', `faceShape.jaw:x:-6.5`],
      [cx + w * (0.6 + 0.32 * j), cy + h * (0.6 + 0.1 * j), 'faceShape', `faceShape.jaw:x:6.5`],
      [cx - d, eyeY + eh * 2.4, 'eyeShape', `eyeShape.spacing:x:-6`],
      [cx + d, eyeY + eh * 2.4, 'eyeShape', `eyeShape.spacing:x:6`],
      [cx - d - ew, eyeY - eh * 0.1, 'eyeShape', `eyeShape.size:x:-9 eyeShape.tilt:y:-9`],
      [cx + d + ew, eyeY - eh * 0.1, 'eyeShape', `eyeShape.size:x:9 eyeShape.tilt:y:-9`],
      [cx - 5 - bulge * 0.5, (noseTop + noseBot) / 2, 'nose', `nose.bridge:x:-12`],
      [cx, tipY + 4, 'nose', `nose.length:y:5.5`],
      [cx - nw, noseBot - 1, 'nose', `nose.width:x:-11 nose.tip:y:-14`],
      [cx + nw, noseBot - 1, 'nose', `nose.width:x:11 nose.tip:y:-14`],
      [cx - mw, mouthY, 'mouth', `mouth.width:x:-7`],
      [cx + mw, mouthY, 'mouth', `mouth.width:x:7`],
      [cx, mouthY + lip * 0.95, 'mouth', `mouth.fullness:y:18`],
      [cx + w * 0.98 + earOut + w * 0.13, eyeY + 7 - h * 0.12, 'ears', `ears.out:x:12 ears.size:y:-9`],
      [cx + w * (0.16 + 0.22 * j + chinW), cy + h * 0.96 + chinDrop, 'chin', `chin.width:x:14 chin.jut:y:10`],
      [cx, cy - h - foreH, 'forehead', `forehead.height:y:-8`],
      [cx + dB - ew * 0.2, by - bArch - bTh * 0.5, 'brows', `brows.arch:y:-12 brows.thick:x:10`],
      [cx + dB - ew * 1.05, by + 2.4 + bAng, 'brows', `brows.angle:y:12 brows.gap:x:8`],
      [cx + dB + ew * 1.15 * kLen, by + 1.1 - bAng * 0.3 + tailY, 'brows', `brows.length:x:8 brows.tail:y:-14`],
      [cx - dB + ew * 0.2, by - bArch - bTh * 0.5, 'brows', `brows.height:y:-10`],
    ].map(([x, y, g2, map]) => `<g class="fp-h${focus === g2 ? ' on' : ''}" data-h="${map}" data-g="${g2}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" class="fp-hit"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" class="fp-dot"/></g>`).join('');
    return `<svg viewBox="0 0 200 230" aria-hidden="true">
      <defs>
        <radialGradient id="${uid}s" cx="45%" cy="38%" r="70%"><stop offset="0" stop-color="${shade(skin, 0.14)}"/><stop offset=".7" stop-color="${skin}"/><stop offset="1" stop-color="${shade(skin, -0.22)}"/></radialGradient>
        <filter id="${uid}g" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation="1.3" flood-color="#3ecf60" flood-opacity=".8"/></filter>
      </defs>
      ${plate ? `<rect width="200" height="230" fill="${out === 'control' ? '#fff' : paper}"/>` : ''}
      ${out === 'control' ? '' : `<path d="${body}Z" fill="${c(shade(skin, -0.18), paper)}"${line}/>
      <path d="M${cx - neckW * 0.9} ${cy + h * 0.95}Q${cx} ${cy + h * 1.2} ${cx + neckW * 0.9} ${cy + h * 0.95}" fill="none" stroke="${c(shade(skin, -0.4), ink)}" stroke-width="1" opacity=".5"/>`}
      ${[-1, 1].map((side) => earFront(cx + side * (w * 0.98 + earOut), eyeY + 7, w * 0.13 * earK * (1 + Math.max(0, ea.out - 50) * 0.008), h * 0.19 * earK, side, ea.tip, `fill="${c(shade(skin, -0.1), paper)}"${line}`)).join('')}
      ${out === 'control' ? `<path d="${faceLow}" fill="#fff"${line}/>` : `<path d="${head}" fill="${c(`url(#${uid}s)`, paper)}"${line}${glow('faceShape')}/>`}
      ${guides}
      ${fo.ridge > 58 ? `<path d="M${cx - d - ew} ${browY - bArch - 3.5}Q${cx} ${browY - bArch - 1.5 - (fo.ridge - 58) * 0.04} ${cx + d + ew} ${browY - bArch - 3.5}" fill="none" stroke="${c(shade(skin, -0.3), ink)}" stroke-width=".8" opacity="${(0.25 + (fo.ridge - 58) * 0.012).toFixed(2)}"/>` : ''}
      <g fill="${c(browC, ink)}" opacity="${c('.9', '.75')}"${glow('brows')}>${'<path d="' + brow(cx - dB, -1) + '"/>'}${'<path d="' + brow(cx + dB, 1) + '"/>'}${unibrow ? `<path d="M${cx - dB + ew * 1.05} ${by + 2.2 + bAng}Q${cx} ${by + 1.4 + bAng} ${cx + dB - ew * 1.05} ${by + 2.2 + bAng}" fill="none" stroke="${c(browC, ink)}" stroke-width="${(bTh * 0.9).toFixed(2)}" stroke-linecap="round"/>` : ''}</g>
      <g${glow(focus === 'eyeColor' ? 'eyeColor' : 'eyeShape')}>${eye(cx - d, -1, c1, 1)}${eye(cx + d, 1, c2, 2)}</g>
      <g${glow('nose')}>${nose}</g>
      <g${glow('mouth')}><path d="${upper}" fill="${lipColour}"${plate ? ` fill-opacity=".45"${line}` : ''}/><path d="${lower}" fill="${shade(lipColour, 0.12)}"${plate ? ` fill-opacity=".35"${line}` : ''}/><path d="M${cx - mw} ${mouthY}Q${cx} ${mouthY + 1.4} ${cx + mw} ${mouthY}" fill="none" stroke="${c(shade(lipColour, -0.45), ink)}" stroke-width="1" stroke-linecap="round"/></g>
      ${state.selection.chinCleft === 'yes' ? `<path d="M${cx} ${cy + h * 0.86 + chinDrop}l0 4" stroke="${c(shade(skin, -0.4), ink)}" stroke-width="1" stroke-linecap="round" opacity=".7"/>` : ''}
      ${handles}
    </svg>`;
  }

  // The eyes of the avatar drawing, close up (in colour whatever the drawing style).
  function eyesCloseUp() {
    const style = faceStyle;
    const view = faceView;
    faceStyle = 'avatar';
    faceView = 'front';
    const svg = faceSvg('');
    faceStyle = style;
    faceView = view;
    return svg.replace('viewBox="0 0 200 230"', 'viewBox="52 88 96 38"');
  }

  function faceEditorButton(groupId) {
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'ghost small face-open';
    open.append(icon('face'), document.createTextNode(t('faceEditor')));
    open.addEventListener('click', () => openFaceEditor(groupId));
    return open;
  }

  // In a menu: the drawing, its sliders and a button to the face editor. In the editor (bare): the sliders only.
  function facePanel(group, bare) {
    const panel = document.createElement('div');
    panel.className = bare ? 'face-panel bare' : 'face-panel';
    const art = document.createElement('div');
    art.className = 'face-art';
    if (!bare) {
      panel.appendChild(art);
      const open = faceEditorButton(group.id);
      art.after(open);
      if (group.note) {
        const note = document.createElement('p');
        note.className = 'menu-note';
        note.textContent = label(group.note);
        open.after(note);
      }
      open.after(guideToggle());
    }
    const rows = [];
    for (const sl of group.sliders || []) {
      const row = document.createElement('label');
      row.className = 'face-slider';
      const name = document.createElement('span');
      name.className = 'fs-name';
      name.textContent = label(sl);
      const lo = document.createElement('span');
      lo.className = 'fs-end';
      lo.textContent = label(sl.lo);
      const hi = document.createElement('span');
      hi.className = 'fs-end';
      hi.textContent = label(sl.hi);
      const range = document.createElement('input');
      range.type = 'range';
      range.min = 0;
      range.max = 100;
      range.step = 1;
      // Notches: the positions of the choices above.
      range.setAttribute('list', `notches-${group.id}-${sl.id}`);
      const list = document.createElement('datalist');
      list.id = `notches-${group.id}-${sl.id}`;
      for (const v of new Set([50, ...group.options.map((o) => (o.at && o.at[sl.id]) || 50)])) list.appendChild(new Option('', v));
      range.addEventListener('input', () => setSlider(group, sl.id, Number(range.value)));
      row.append(name, lo, range, hi, list);
      panel.appendChild(row);
      rows.push([sl, range]);
    }
    // Eye colour: eyes of two different colours.
    if (group.id === 'eyeColor') {
      const odd = document.createElement('label');
      odd.className = 'odd-eyes';
      const box = document.createElement('input');
      box.type = 'checkbox';
      const text = document.createElement('span');
      text.textContent = t('oddEyes');
      const well = document.createElement('input');
      well.type = 'color';
      well.title = t('otherEye');
      const set = (second) => {
        const first = eyeColours()[0];
        const own = document.querySelector('input.own[data-custom="eyeColor"]');
        own.value = second ? `${first.toUpperCase()}|${second.toUpperCase()}` : first.toUpperCase();
        own.dispatchEvent(new Event('input'));
      };
      box.addEventListener('change', () => set(box.checked ? '#3A7BD5' : ''));
      well.addEventListener('input', () => set(well.value));
      odd.append(box, text, well);
      panel.appendChild(odd);
      panel.syncOdd = () => {
        const on = (state.custom.eyeColor || '').includes('|');
        box.checked = on;
        well.hidden = !on;
        if (on) well.value = eyeColours()[1].toLowerCase();
      };
    }
    panel.syncFace = () => {
      // Eye colour: a close-up on the eyes, the colour reads better than on the whole face.
      if (!bare) art.innerHTML = group.id === 'eyeColor' ? eyesCloseUp() : faceSvg(group.id);
      if (!bare) art.classList.toggle('eyes', group.id === 'eyeColor');
      const vals = group.sliders ? sliderValues(group) : {};
      for (const [sl, range] of rows) if (document.activeElement !== range) range.value = vals[sl.id];
      panel.classList.toggle('set', !!state.custom[group.id] && !!group.sliders);
      if (panel.syncOdd) panel.syncOdd();
    };
    panel.syncFace();
    return panel;
  }

  /* ---------- Face editor: one big drawing with points to drag, and every face setting next to it ---------- */

  const FACE_GROUPS = ['faceShape', 'forehead', 'brows', 'browColor', 'eyeShape', 'eyeColor', 'nose', 'ears', 'chin', 'mouth', 'lipColor', 'skin'];
  let feFocus = 'faceShape';

  // A colour of a colour menu, through its (hidden) free entry; eyes of two colours keep the second.
  function setColour(groupId, hex) {
    const own = document.querySelector(`input.own[data-custom="${groupId}"]`);
    if (!own) return;
    const second = groupId === 'eyeColor' ? (state.custom.eyeColor || '').split('|')[1] : '';
    own.value = hex && second ? `${hex.toUpperCase()}|${second}` : (hex || '').toUpperCase();
    own.dispatchEvent(new Event('input'));
  }

  // The sentences of the prompt that describe the face, for the editor.
  function syncFaceWords(prompt) {
    const box = $('feWords');
    if (!box) return;
    const keep = (prompt || '').match(/(Appearance:[^.]*\.|Distinctive nose[^.]*\.)/g) || [];
    box.textContent = keep.join(' ');
  }

  function buildFaceEditor() {
    const root = document.createElement('div');
    root.id = 'faceEditor';
    root.className = 'fe';
    root.hidden = true;
    const head = document.createElement('div');
    head.className = 'fe-head';
    const title = document.createElement('p');
    title.className = 'mono';
    title.textContent = `// ${t('faceEditor')}`;
    const hint = document.createElement('span');
    hint.className = 'fe-hint';
    hint.textContent = t('faceHint');
    const done = document.createElement('button');
    done.type = 'button';
    done.className = 'primary small';
    done.textContent = t('feDone');
    done.addEventListener('click', closeFaceEditor);
    // Drawing style, kept from one visit to the next (also used by the small drawings in the menus).
    const styles = document.createElement('div');
    styles.className = 'tile-size fe-style';
    for (const [id, key] of [['plate', 'stylePlate'], ['avatar', 'styleAvatar']]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.style = id;
      b.textContent = t(key);
      b.addEventListener('click', () => {
        faceStyle = id;
        store('cd-face-style', id);
        syncControls();
      });
      styles.appendChild(b);
    }
    const views = document.createElement('div');
    views.className = 'tile-size fe-style fe-view';
    for (const [id, key] of [['front', 'viewFront'], ['profile', 'viewProfile']]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.view = id;
      b.textContent = t(key);
      b.addEventListener('click', () => {
        faceView = id;
        store('cd-face-view', id);
        syncControls();
      });
      views.appendChild(b);
    }
    head.append(title, hint, done);
    const guideRow = guideToggle();
    guideRow.classList.add('fe-guide');

    const art = document.createElement('div');
    art.className = 'fe-art';
    const side = document.createElement('div');
    side.className = 'fe-side';
    const blocks = [];
    for (const id of FACE_GROUPS) {
      const group = groupById(id);
      if (!group) continue;
      const block = document.createElement('section');
      block.className = 'fe-block';
      block.dataset.group = id;
      const bh = document.createElement('header');
      const name = document.createElement('span');
      name.textContent = label(group);
      const value = document.createElement('span');
      value.className = 'g-value';
      bh.append(icon(group.icon), name, value);
      const chips = document.createElement('div');
      chips.className = 'fe-chips';
      for (const option of group.options) {
        if (group.followHair && option.id === 'hair') continue;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'fe-chip';
        b.dataset.id = option.id;
        if (option.sw) {
          const dot = document.createElement('i');
          dot.style.background = option.sw;
          b.appendChild(dot);
        }
        b.appendChild(document.createTextNode(label(option)));
        b.addEventListener('click', () => choose(group, option.id));
        chips.appendChild(b);
      }
      block.append(bh, chips);
      if (group.followHair) bh.after(followHairToggle(group, block));
      for (const inner of state.cfg.options.groups.filter((g) => g.toggleIn === id)) chips.after(toggleRow(inner));
      if (group.sliders || id === 'eyeColor') block.appendChild(facePanel(group, true));
      if (group.color) {
        const well = document.createElement('label');
        well.className = 'fe-well';
        const input = document.createElement('input');
        input.type = 'color';
        const text = document.createElement('span');
        text.textContent = t('pickColor');
        input.addEventListener('input', () => setColour(id, input.value));
        well.append(input, text);
        block.appendChild(well);
        block.syncWell = () => {
          const hex = (state.custom[id] || '').split('|')[0];
          input.value = (/^#[0-9a-f]{6}$/i.test(hex) ? hex : swatch(id, '#888888')).toLowerCase();
        };
      }
      block.addEventListener('pointerenter', () => {
        if (drag || feFocus === id) return;
        feFocus = id;
        art.syncFace();
      });
      side.appendChild(block);
      blocks.push([group, block, value, chips]);
    }

    art.syncFace = () => {
      if (root.hidden) return;
      art.innerHTML = faceSvg(feFocus, true);
      art.classList.toggle('plate', faceStyle === 'plate');
      for (const b of styles.children) b.setAttribute('aria-pressed', b.dataset.style === faceStyle ? 'true' : 'false');
      for (const b of views.children) b.setAttribute('aria-pressed', b.dataset.view === faceView ? 'true' : 'false');
      for (const [group, block, value, chips] of blocks) {
        value.textContent = currentValue(group);
        const own = (state.custom[group.id] || '').trim();
        for (const c of chips.children) c.setAttribute('aria-pressed', !own && state.selection[group.id] === c.dataset.id ? 'true' : 'false');
        block.classList.toggle('on', block.dataset.group === feFocus);
        if (block.syncWell) block.syncWell();
      }
    };

    // Dragging a point: its sliders follow the pointer (as many steps per drawing unit as its gain).
    let drag = null;
    // The settings of the touched part come into view on the right, and blink once.
    const showBlock = (id, behavior = 'smooth') => {
      const block = side.querySelector(`.fe-block[data-group="${id}"]`);
      if (!block) return;
      side.scrollTo({ top: block.offsetTop - side.offsetTop - 4, behavior });
      block.classList.remove('flash');
      void block.offsetWidth;
      block.classList.add('flash');
    };
    root.showBlock = showBlock;
    art.addEventListener('pointerdown', (e) => {
      let h = e.target.closest('[data-h]');
      if (!h) {
        // A click on the drawing near a point (eyebrow, ear, chin...): show the settings of that part.
        const svg = art.querySelector('svg');
        const m = svg && svg.getScreenCTM();
        if (!m) return;
        const x = (e.clientX - m.e) / m.a;
        const y = (e.clientY - m.f) / m.d;
        let best = 22;
        for (const g of art.querySelectorAll('[data-h]')) {
          const c = g.querySelector('circle');
          const dist = Math.hypot(Number(c.getAttribute('cx')) - x, Number(c.getAttribute('cy')) - y);
          if (dist < best) [best, h] = [dist, g];
        }
        if (h) {
          feFocus = h.dataset.g;
          art.syncFace();
          showBlock(feFocus);
        }
        return;
      }
      e.preventDefault();
      const svg = art.querySelector('svg');
      const scale = svg.getScreenCTM().a || 1;
      const maps = h.dataset.h.split(' ').map((m) => {
        const [key, axis, gain] = m.split(':');
        const [g, sl] = key.split('.');
        const group = groupById(g);
        return { group, sl, axis, gain: Number(gain), start: sliderValues(group)[sl] };
      });
      feFocus = h.dataset.g;
      showBlock(feFocus);
      drag = { x: e.clientX, y: e.clientY, scale, maps };
      art.setPointerCapture(e.pointerId);
      art.classList.add('dragging');
      art.syncFace();
    });
    art.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const delta = { x: (e.clientX - drag.x) / drag.scale, y: (e.clientY - drag.y) / drag.scale };
      for (const m of drag.maps) {
        const v = Math.max(0, Math.min(100, Math.round(m.start + delta[m.axis] * m.gain)));
        if (sliderValues(m.group)[m.sl] !== v) setSlider(m.group, m.sl, v);
      }
    });
    const end = () => {
      if (!drag) return;
      drag = null;
      art.classList.remove('dragging');
    };
    art.addEventListener('pointerup', end);
    art.addEventListener('pointercancel', end);

    // The drawing with its two switches on top of it: view (left) and style (right).
    const stage = document.createElement('div');
    stage.className = 'fe-stage';
    // Style on the left, view on the right (the view changes more often, the hand is already there).
    styles.classList.add('fe-tl');
    views.classList.add('fe-tr');
    styles.title = t('feStyleKey');
    views.title = t('feViewKey');
    // Under the drawing: the face part of the prompt, live (what the models will read).
    const words = document.createElement('div');
    words.className = 'fe-words';
    const wl = document.createElement('span');
    wl.className = 'mono';
    wl.textContent = `// ${t('feWords')}`;
    const wt = document.createElement('p');
    wt.id = 'feWords';
    words.append(wl, wt);
    stage.append(art, views, styles, words);
    const body = document.createElement('div');
    body.className = 'fe-body';
    body.append(stage, side);
    root.append(head, guideRow, body);
    root.addEventListener('click', (e) => {
      if (e.target === root) closeFaceEditor();
    });
    window.addEventListener('resize', () => {
      if (!root.hidden) balanceChips();
    });
    document.body.appendChild(root);
    return root;
  }

  // No choice left alone on its last line: the row of choices gets narrower until two share it.
  function balanceChips() {
    for (const box of document.querySelectorAll('#faceEditor .fe-chips')) {
      box.style.maxWidth = '';
      const rows = () => {
        const tops = [...box.children].map((c) => c.offsetTop);
        const last = Math.max(...tops);
        return { n: new Set(tops).size, alone: tops.filter((t) => t === last).length === 1 };
      };
      const start = rows();
      if (start.n < 2 || !start.alone) continue;
      for (let w = box.clientWidth - 16; w > 120; w -= 16) {
        box.style.maxWidth = `${w}px`;
        const now = rows();
        if (now.n > start.n) { box.style.maxWidth = ''; break; }
        if (!now.alone) break;
      }
    }
  }

  function openFaceEditor(groupId) {
    const root = $('faceEditor') || buildFaceEditor();
    feFocus = FACE_GROUPS.includes(groupId) ? groupId : 'faceShape';
    root.hidden = false;
    document.body.classList.add('fe-open');
    syncControls();
    syncFaceWords($('promptText').textContent);
    balanceChips();
    // The settings of the part asked for, at the top of the right column.
    if (root.showBlock) root.showBlock(feFocus, groupId ? 'auto' : 'smooth');
  }
  function closeFaceEditor() {
    const root = $('faceEditor');
    if (!root) return;
    root.hidden = true;
    document.body.classList.remove('fe-open');
  }

  /* ---------- Age: a slider next to the number field ---------- */

  function numberRow(group, own) {
    const row = document.createElement('div');
    row.className = 'agerow';
    const range = document.createElement('input');
    range.type = 'range';
    range.min = own.min;
    range.max = group.sliderMax || 100;
    range.step = 1;
    range.addEventListener('pointerdown', () => wake(group));
    range.addEventListener('input', () => {
      own.value = range.value;
      own.dispatchEvent(new Event('input'));
    });
    row.syncRow = () => {
      const on = (state.custom[group.id] || '').trim();
      const v = on || (state.parked[group.id] || '').trim();
      range.value = /^\d+$/.test(v) ? v : 30;
      row.classList.toggle('set', !!on);
      row.classList.toggle('parked', !on && !!v);
    };
    row.append(range, own);
    row.syncRow();
    return row;
  }

  /* ---------- Plutchik's wheel of emotions ---------- */

  // 8 emotions, 3 intensities each (mild inside, intense outside), neutral in the middle. Data in options.json.
  function emotionWheel(group) {
    const NS = 'http://www.w3.org/2000/svg';
    const make = (tag, attrs) => {
      const el = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
      return el;
    };
    const wrap = document.createElement('div');
    wrap.className = 'wheel';
    const svg = make('svg', { viewBox: '-106 -106 212 212', role: 'group' });
    const caption = document.createElement('p');
    caption.className = 'wheel-cap';
    // Under the wheel: the emotion chosen on it, else how to use it.
    const rest = () => {
      const option = !(state.custom[group.id] || '').trim() && optionById(group, state.selection[group.id]);
      const petal = option && option.petal && group.wheel.find((w) => w.id === option.petal);
      caption.textContent = petal ? (label(petal) === label(option) ? label(option) : `${label(petal)} · ${label(option)}`) : t('wheelHint');
      caption.classList.toggle('on', !!petal);
    };
    const pt = (r, a) => {
      const rad = ((a - 90) * Math.PI) / 180;
      return `${(r * Math.cos(rad)).toFixed(2)} ${(r * Math.sin(rad)).toFixed(2)}`;
    };
    // Mild next to neutral, more intense further out (Plutchik's own wheel goes the other way).
    const rings = { 1: [24, 50], 2: [50, 76], 3: [76, 102] };
    const step = 360 / group.wheel.length;
    const segment = (option, shape, petal) => {
      shape.classList.add('w-seg');
      shape.dataset.group = group.id;
      shape.dataset.wheel = option.id;
      shape.setAttribute('tabindex', '0');
      shape.setAttribute('role', 'button');
      shape.setAttribute('aria-label', label(option));
      const pick = () => choose(group, option.id);
      shape.addEventListener('click', pick);
      shape.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pick();
        }
      });
      shape.addEventListener('mouseenter', () => {
        caption.textContent = petal && label(petal) !== label(option) ? `${label(petal)} · ${label(option)}` : label(option);
      });
      shape.addEventListener('mouseleave', rest);
      svg.appendChild(shape);
    };
    group.wheel.forEach((petal, i) => {
      const a0 = i * step - step / 2 + 1;
      const a1 = i * step + step / 2 - 1;
      for (const level of [1, 2, 3]) {
        const option = group.options.find((o) => o.petal === petal.id && o.level === level);
        if (!option) continue;
        const [r0, r1] = rings[level];
        const d = `M ${pt(r0 + 0.8, a0)} L ${pt(r1 - 0.8, a0)} A ${r1 - 0.8} ${r1 - 0.8} 0 0 1 ${pt(r1 - 0.8, a1)} L ${pt(r0 + 0.8, a1)} A ${r0 + 0.8} ${r0 + 0.8} 0 0 0 ${pt(r0 + 0.8, a0)} Z`;
        segment(option, make('path', { d, fill: petal.color, 'fill-opacity': { 1: 0.38, 2: 0.68, 3: 1 }[level] }), petal);
      }
      const [x, y] = pt(63, i * step).split(' ');
      const name = make('text', { x, y, class: 'w-name' });
      name.textContent = label(petal);
      svg.appendChild(name);
    });
    const neutral = group.options.find((o) => o.id === 'neutral');
    if (neutral) {
      segment(neutral, make('circle', { r: 22, class: 'w-center' }), null);
      const name = make('text', { x: 0, y: 0, class: 'w-name w-center-name' });
      name.textContent = label(neutral);
      svg.appendChild(name);
    }
    wrap.rest = rest;
    wrap.append(svg, caption);
    rest();
    return wrap;
  }

  /* ---------- Height slider (metres or feet) ---------- */

  let heightUnit = read('cd-height-unit');
  // Metres in French, feet in English, until the user picks a unit.
  const hUnit = () => heightUnit || (lang === 'fr' ? 'm' : 'ft');

  // The prompt always gets both units: "1.78 m (5 ft 10 in)".
  function heightValue(cm) {
    const inches = Math.round(cm / 2.54);
    return `${(cm / 100).toFixed(2)} m (${Math.floor(inches / 12)} ft ${inches % 12} in)`;
  }

  function heightCm(text) {
    const m = /(\d+(?:[.,]\d+)?)\s*m\b/.exec(String(text || ''));
    return m ? Math.round(Number(m[1].replace(',', '.')) * 100) : 170;
  }

  function heightLabel(cm) {
    if (hUnit() === 'm') return `${(cm / 100).toFixed(2).replace('.', lang === 'fr' ? ',' : '.')} m`;
    const inches = Math.round(cm / 2.54);
    return `${Math.floor(inches / 12)}' ${inches % 12}"`;
  }

  // A schematic, neutral figure drawn at the chosen height. Its proportions follow the height: a small person has
  // a larger head for the body and shorter legs, a very tall one a small head and long legs. A 1.70 m figure stays
  // behind it, dashed, to compare.
  const PRESET_CM = { short: 155, average: 170, tall: 188 };
  const lerp = (pts, x) => {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i];
      const [x0, y0] = pts[i - 1];
      if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
    return pts[pts.length - 1][1];
  };
  // Neutral mannequin, centred on x = 0, standing on the ground line: a head, one smooth outline
  // for neck, torso and legs, and two arms. Proportions follow the height (big head and short legs
  // for a child, long legs when tall).
  function figureParts(cm, ground) {
    const headH = lerp([[50, 12], [100, 19], [140, 22], [170, 23], [230, 25]], cm);
    const headW = headH * 0.78;
    const legs = cm * lerp([[50, 0.3], [120, 0.4], [170, 0.47], [230, 0.5]], cm);
    const top = ground - cm;
    const neckY = top + headH * 0.92;
    const shoulderY = top + headH * 1.22;
    const sw = headH * lerp([[50, 0.75], [140, 0.92], [230, 1.02]], cm);
    const hipY = ground - legs;
    const torso = hipY - shoulderY;
    const hw = sw * 0.74;
    const waistY = shoulderY + torso * 0.62;
    const limb = headW * 0.4;
    const kneeY = ground - legs * 0.5;
    const body = smoothPath(mirrored(0, [
      [headW * 0.2, neckY],
      [headW * 0.22, shoulderY - headH * 0.12],
      [sw * 0.72, shoulderY],
      [sw * 0.98, shoulderY + headH * 0.3],
      [sw * 0.86, shoulderY + torso * 0.36],
      [sw * 0.66, waistY],
      [hw, hipY],
      [hw * 0.92, hipY + legs * 0.22],
      [hw * 0.62, kneeY],
      [hw * 0.6, ground - legs * 0.3],
      [hw * 0.4, ground - limb * 0.6],
      [hw * 0.62, ground],
      [hw * 0.14, ground],
      [hw * 0.16, ground - limb * 0.7],
      [hw * 0.15, kneeY],
      [hw * 0.06, hipY + legs * 0.1],
    ]));
    const elbowY = shoulderY + torso * 0.62;
    const wristY = Math.min(ground - limb * 2, hipY + torso * 0.12);
    const arm = (k) => smoothPath([
      [sw * 0.7, shoulderY + limb * 0.25],
      [sw + limb * 0.42, shoulderY + headH * 0.42],
      [sw + limb * 0.62, elbowY],
      [sw + limb * 0.72, wristY],
      [sw + limb * 0.5, wristY + limb * 1.3],
      [sw + limb * 0.05, wristY + limb * 0.4],
      [sw + limb * 0.02, elbowY],
      [sw * 0.84, shoulderY + headH * 0.75],
    ].map(([x, y]) => [x * k, y]));
    return [
      `<ellipse cx="0" cy="${top + headH / 2}" rx="${headW / 2}" ry="${headH / 2}"/>`,
      `<path d="${body}"/><path d="${arm(1)}"/><path d="${arm(-1)}"/>`,
    ].join('');
  }
  function heightFigure(cm) {
    const ground = 236;
    // The figure, and the 1.70 m reference drawn dotted over it.
    return `<svg viewBox="-70 0 140 240" aria-hidden="true">
      <line x1="-70" x2="70" y1="${ground}" y2="${ground}" class="hf-ground"/>
      <line x1="-70" x2="70" y1="${ground - cm}" y2="${ground - cm}" class="hf-top"/>
      <g class="hf-me">${figureParts(cm, ground)}</g>
      <g class="hf-ref">${figureParts(170, ground)}</g>
      <text x="${(-40).toFixed(0)}" y="${ground - 170 - 3}" class="hf-label">1,70 m</text>
    </svg>`;
  }

  function heightRow(group, own) {
    const row = document.createElement('div');
    row.className = 'heightrow';
    const range = document.createElement('input');
    range.type = 'range';
    range.min = 50;
    range.max = 230;
    range.step = 1;
    range.dataset.height = group.id;
    const out = document.createElement('output');
    const unit = document.createElement('button');
    unit.type = 'button';
    unit.className = 'ghost small';
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'ghost small';
    clear.textContent = '×';
    clear.title = t('cleared');
    const fig = document.createElement('div');
    fig.className = 'height-figure';
    // Reference points under the slider: short, average, tall (the menu's choices), at their height.
    const marks = document.createElement('div');
    marks.className = 'h-marks';
    for (const option of group.options) {
      const cmAt = PRESET_CM[option.id];
      if (!cmAt) continue;
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.id = option.id;
      b.style.left = `${((cmAt - 50) / 180) * 100}%`;
      b.textContent = label(option);
      b.addEventListener('click', () => choose(group, option.id));
      marks.appendChild(b);
    }
    const sync = () => {
      const set = !!(state.custom[group.id] || '').trim();
      const kept = !set && !!(state.parked[group.id] || '').trim();
      const cm = heightCm(state.custom[group.id] || state.parked[group.id]);
      const shown = set ? cm : PRESET_CM[state.selection[group.id]] || 170;
      fig.innerHTML = heightFigure(shown);
      range.value = shown;
      for (const b of marks.children) b.setAttribute('aria-pressed', !set && state.selection[group.id] === b.dataset.id ? 'true' : 'false');
      out.textContent = set || kept ? heightLabel(cm) : t('heightPick');
      row.classList.toggle('set', set);
      row.classList.toggle('parked', kept);
      unit.textContent = hUnit();
    };
    range.addEventListener('pointerdown', () => wake(group));
    range.addEventListener('input', () => {
      own.value = heightValue(Number(range.value));
      own.dispatchEvent(new Event('input'));
      sync();
    });
    unit.addEventListener('click', () => {
      heightUnit = hUnit() === 'm' ? 'ft' : 'm';
      store('cd-height-unit', heightUnit);
      sync();
      syncControls();
    });
    clear.addEventListener('click', () => {
      delete state.parked[group.id];
      own.value = '';
      own.dispatchEvent(new Event('input'));
      sync();
    });
    row.syncHeight = sync;
    const track = document.createElement('div');
    track.className = 'h-track';
    track.append(range, marks);
    row.append(fig, track, out, unit, clear);
    sync();
    return row;
  }

  /* ---------- Reference images for one menu (outfit, accessories) ---------- */

  // The small × that empties a field or a list.
  function clearButton(onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'clear-x';
    b.textContent = '×';
    b.title = t('clearField');
    b.setAttribute('aria-label', t('clearField'));
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return b;
  }
  // "Remove all" under a list of reference images.
  function refsClearButton(onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ghost small refs-clear';
    b.textContent = t('clearAll');
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
      renderRefs();
      schedulePreview();
    });
    return b;
  }

  function groupRefsZone(group) {
    const zone = document.createElement('div');
    zone.className = 'group-refs';
    zone.dataset.refs = group.id;
    const add = document.createElement('label');
    add.className = 'ghost small add-refs';
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/png,image/jpeg,image/webp';
    file.multiple = true;
    file.hidden = true;
    const words = document.createElement('span');
    words.className = 'add-words';
    add.append(file, icon('image'), words);
    const list = document.createElement('div');
    list.className = 'ref-list';
    const note = document.createElement('p');
    note.className = 'menu-note';
    const clear = refsClearButton(() => {
      state.groupRefs[group.id] = [];
    });
    zone.append(add, list, clear, note);
    file.addEventListener('change', async () => {
      await addGroupRefs(group.id, [...file.files]);
      file.value = '';
    });
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('over');
      addGroupRefs(group.id, [...e.dataTransfer.files]);
    });
    return zone;
  }

  async function addGroupRefs(groupId, files) {
    const list = (state.groupRefs[groupId] = state.groupRefs[groupId] || []);
    for (const f of files) {
      if (!/^image\/(png|jpeg|webp)$/.test(f.type)) {
        showError(t('refBadFile'));
        continue;
      }
      if (list.length >= 6) break;
      try {
        list.push({ data: await shrink(f), name: f.name });
      } catch (err) {
        showError(err.message);
      }
    }
    renderRefs();
    schedulePreview();
  }

  function syncGroupRefs() {
    const budget = refBudget();
    for (const zone of document.querySelectorAll('.group-refs')) {
      const id = zone.dataset.refs;
      const items = state.groupRefs[id] || [];
      zone.querySelector('.add-words').textContent = t({ outfit: 'addOutfitRefs', accessories: 'addAccessoryRefs', look: 'addLookRefs' }[id] || 'addOutfitRefs');
      const list = zone.querySelector('.ref-list');
      list.textContent = '';
      items.forEach((ref, i) => {
        const box = document.createElement('div');
        box.className = 'ref';
        const img = document.createElement('img');
        img.src = ref.data;
        img.alt = ref.name;
        const x = document.createElement('button');
        x.type = 'button';
        x.textContent = '×';
        x.setAttribute('aria-label', 'remove');
        x.addEventListener('click', () => {
          items.splice(i, 1);
          renderRefs();
          schedulePreview();
        });
        if (i >= budget.kept[id]) box.classList.add('dropped');
        box.append(img, x);
        list.appendChild(box);
      });
      zone.querySelector('.refs-clear').hidden = items.length < 2;
      zone.querySelector('.menu-note').textContent = items.length && !maxRefs() ? t('refNoModel') : items.length > budget.kept[id] ? refOverNote(budget) : '';
    }
  }

  // What is sent: counts for the preview, the images themselves to generate (the server cuts to what the model takes).
  function refCounts() {
    if (!maxRefs()) return { main: 0, outfit: 0, accessories: 0, look: 0 };
    const n = (k) => (state.groupRefs[k] || []).length;
    return { main: state.refs.length, guide: guideMode() === 'ref' ? 1 : 0, outfit: n('outfit'), accessories: n('accessories'), look: n('look') };
  }

  function groupRefsPayload() {
    if (!maxRefs()) return undefined;
    const out = {};
    for (const k of ['outfit', 'accessories', 'look']) if ((state.groupRefs[k] || []).length) out[k] = state.groupRefs[k].map((r) => r.data);
    return Object.keys(out).length ? out : undefined;
  }

  /* ---------- Search: find a menu or a choice by its name ---------- */

  const fold = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  // Every menu and every choice, with its names in both languages and the words it adds to the prompt.
  function searchIndex() {
    const out = [];
    for (const group of state.cfg.options.groups) {
      // A box inside another menu: found under that menu.
      if (group.toggleIn) {
        out.push({ group: groupById(group.toggleIn), option: null, text: fold([group.en, group.fr].join(' ')) });
        continue;
      }
      const section = state.cfg.options.sections.find((x) => x.id === group.section) || {};
      const kw = group.keywords ? `${group.keywords.en} ${group.keywords.fr}` : '';
      out.push({ group, option: null, text: fold([group.en, group.fr, section.en, section.fr, kw].join(' ')) });
      for (const option of group.options) out.push({ group, option, text: fold([option.en, option.fr, option.p, group.en, group.fr].join(' ')) });
    }
    return out;
  }
  function searchFor(query) {
    const words = fold(query).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const hits = searchIndex().filter((e) => words.every((w) => e.text.includes(w)));
    // Names that start with the query first, menus before their choices.
    const starts = (e) => fold(label(e.option || e.group)).startsWith(words[0]);
    hits.sort((a, b) => starts(b) - starts(a) || (a.option ? 1 : 0) - (b.option ? 1 : 0));
    return hits.slice(0, 10);
  }
  // Opens the menu and shows the choice.
  function goTo(entry) {
    const { group, option } = entry;
    const box = document.querySelector(`details.group[data-group="${group.id}"], details.pop[data-group="${group.id}"]`);
    if (!box) return;
    box.open = true;
    if (!option) return;
    setTimeout(() => {
      const tile = box.querySelector(`.tile[data-id="${option.id}"], .w-seg[data-wheel="${option.id}"], .h-marks button[data-id="${option.id}"]`);
      if (!tile) return;
      tile.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      tile.classList.remove('found');
      void tile.offsetWidth;
      tile.classList.add('found');
    }, 650);
  }
  function setupSearch() {
    if ($('menuSearch')) return;
    const wrap = document.createElement('div');
    wrap.className = 'menu-search';
    const input = document.createElement('input');
    input.type = 'search';
    input.id = 'menuSearch';
    input.autocomplete = 'off';
    input.spellcheck = false;
    const list = document.createElement('div');
    list.className = 'search-list';
    list.hidden = true;
    wrap.append(icon('search'), input, list);
    // Beside the search box: the one thumbnail-size switch, for every menu.
    const tools = document.createElement('div');
    tools.className = 'menu-tools';
    const sizes = tileSizeButton();
    sizes.title = t('tilesTitle');
    tools.append(wrap, sizes);
    // Above everything in the left column and pinned to its top (a menu opened far down is one tap from a new search).
    $('refs').before(tools);
    let hits = [];
    let at = 0;
    const show = () => {
      hits = searchFor(input.value);
      at = 0;
      list.textContent = '';
      list.hidden = !input.value.trim();
      if (!hits.length) {
        const none = document.createElement('p');
        none.className = 'search-none';
        none.textContent = t('searchNone');
        list.appendChild(none);
        return;
      }
      hits.forEach((e, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'search-hit';
        b.setAttribute('aria-selected', i === at ? 'true' : 'false');
        const where = document.createElement('span');
        where.textContent = label(e.group);
        b.append(icon(e.group.icon));
        if (e.option) {
          const what = document.createElement('strong');
          what.textContent = label(e.option);
          b.append(where, document.createTextNode(' › '), what);
        } else {
          b.append(where);
        }
        b.addEventListener('mousedown', (ev) => ev.preventDefault());
        b.addEventListener('click', () => pick(i));
        list.appendChild(b);
      });
    };
    const pick = (i) => {
      const e = hits[i];
      if (!e) return;
      input.value = '';
      list.hidden = true;
      input.blur();
      goTo(e);
    };
    input.addEventListener('input', show);
    input.addEventListener('focus', () => input.value.trim() && show());
    input.addEventListener('blur', () => setTimeout(() => (list.hidden = true), 120));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        at = (at + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % Math.max(1, hits.length);
        [...list.querySelectorAll('.search-hit')].forEach((b, i) => b.setAttribute('aria-selected', i === at ? 'true' : 'false'));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        pick(at);
      } else if (e.key === 'Escape') {
        input.value = '';
        list.hidden = true;
        input.blur();
      }
    });
    wrap.syncText = () => {
      input.placeholder = t('searchPlaceholder');
      input.setAttribute('aria-label', t('searchPlaceholder'));
    };
    wrap.syncText();
  }

  function renderControls() {
    setupSearch();
    const search = document.querySelector('.menu-search');
    if (search) search.syncText();
    const root = $('controls');
    const dock = $('dockGroups');
    root.textContent = '';
    dock.textContent = '';
    for (const section of state.cfg.options.sections) {
      // A yes/no group shown as a box inside another menu (cleft chin in Chin) gets no menu of its own.
      const groups = state.cfg.options.groups.filter((g) => g.section === section.id && !g.toggleIn);
      if (section.dock) {
        for (const group of groups) dock.appendChild(renderGroup(group, true, 'dock-pop'));
        continue;
      }
      const wrap = document.createElement('div');
      wrap.className = 'section';
      const title = document.createElement('p');
      title.className = 'mono';
      title.textContent = `// ${label(section)}`;
      wrap.appendChild(title);
      // The face editor, reachable from the section title too.
      if (section.id === 'face') {
        const head = document.createElement('div');
        head.className = 'section-head';
        title.replaceWith(head);
        head.append(title, faceEditorButton('faceShape'));
      }
      for (const group of groups) wrap.appendChild(renderGroup(group, false, 'menu'));
      root.appendChild(wrap);
    }
    syncControls();
    syncGroupRefs();
  }

  function currentValue(group) {
    const own = (state.custom[group.id] || '').trim();
    if (own && group.customType === 'number') return `${own} ${t('years')}`;
    if (own && group.customType === 'height') return heightLabel(heightCm(own));
    if (own && group.id === 'eyeColor' && own.includes('|')) return t('oddEyes');
    if (own && group.sliders) return t('custom');
    if (own) return own;
    const v = state.selection[group.id];
    const ids = group.type === 'multi' ? v || [] : [v];
    return ids.map((id) => optionById(group, id)).filter(Boolean).map(label).join(', ');
  }

  function syncControls() {
    for (const b of document.querySelectorAll('.tile[data-group][data-id]')) {
      const group = groupById(b.dataset.group);
      const on = isSelected(group, b.dataset.id) && (group.type === 'multi' || !(state.custom[group.id] || '').trim());
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (group.type === 'multi') {
        const count = (state.selection[group.id] || []).length;
        b.disabled = !!group.max && !isSelected(group, b.dataset.id) && count >= group.max;
      }
    }
    for (const f of document.querySelectorAll('input.own')) {
      const id = f.dataset.custom;
      const on = !!(state.custom[id] || '').trim();
      f.classList.toggle('on', on);
      f.classList.toggle('parked', !on && !!(state.parked[id] || '').trim());
      if (document.activeElement !== f) f.value = state.custom[id] || state.parked[id] || '';
    }
    for (const row of document.querySelectorAll('.agerow')) row.syncRow();
    for (const row of document.querySelectorAll('.follow-hair, .toggle-row')) row.sync();
    for (const b of document.querySelectorAll('[data-clear]')) b.disabled = !(state.selection[b.dataset.clear] || []).length;
    for (const seg of document.querySelectorAll('.w-seg')) {
      const group = groupById(seg.dataset.group);
      seg.classList.toggle('on', isSelected(group, seg.dataset.wheel) && !(state.custom[group.id] || '').trim());
    }
    for (const w of document.querySelectorAll('.wheel')) w.rest();
    for (const row of document.querySelectorAll('.hexrow')) {
      const live = (state.custom[row.dataset.group] || '').trim().split('|')[0];
      const hex = live || (state.parked[row.dataset.group] || '').trim().split('|')[0];
      const on = /^#[0-9a-f]{6}$/i.test(hex);
      row.classList.toggle('parked', !live && on);
      row.querySelector('.hex-reset').hidden = !on;
      row.querySelector('.well').style.background = on ? hex : '';
      const field = row.querySelector('.hex');
      if (document.activeElement !== field) field.value = on ? hex.toUpperCase() : '';
      if (on) row.querySelector('input[type=color]').value = hex.toLowerCase();
    }
    for (const row of document.querySelectorAll('.heightrow')) if (row.syncHeight) row.syncHeight();
    for (const panel of document.querySelectorAll('.face-panel, .fe-art')) panel.syncFace();
    for (const box of document.querySelectorAll('.guide-toggle')) box.syncGuide();
    for (const d of document.querySelectorAll('details.group, details.pop[data-group]')) {
      const group = groupById(d.dataset.group);
      d.querySelector('.g-value').textContent = currentValue(group);
      // ControlNet makes a portrait whatever the layout: the layout menu says so.
      if (d.dataset.group === 'layout') {
        const guided = guideMode() === 'control';
        d.classList.toggle('guided', guided);
        if (guided) d.querySelector('.g-value').textContent = t('layoutGuided');
        d.querySelector('summary').title = guided ? t('layoutGuidedTip') : '';
        const panel = d.querySelector('.pop-panel');
        let note = panel.querySelector('.lock-note');
        if (guided && !note) {
          note = document.createElement('p');
          note.className = 'lock-note';
          panel.prepend(note);
        }
        if (note) {
          note.textContent = t('layoutLockNote');
          note.hidden = !guided;
        }
      }
    }
    syncGuideDock();
    syncExtraChip();
  }

  // Brings a menu that was just opened to the top of its column, under the sticky section title.
  // shrink: height that disappears above the menu while it opens (the other menu closing).
  // check: only move if the menu is not already in place (a second look after the first scroll).
  // An opened menu stays where it was clicked; the column only moves as much as needed to show it whole
  // (never past the top). shrink: what the menu closing above it has still to lose, measured at the click,
  // so the column moves once, to the right place, in every browser.
  function revealMenu(box, shrink = 0) {
    let scroller = box.parentElement;
    while (scroller && scroller !== document.body) {
      const y = getComputedStyle(scroller).overflowY;
      if ((y === 'auto' || y === 'scroll') && scroller.scrollHeight > scroller.clientHeight) break;
      scroller = scroller.parentElement;
    }
    const section = box.closest('.section');
    const title = section && section.querySelector(':scope > .mono, :scope > .section-head');
    const pinned = scroller && scroller !== document.body ? document.querySelector('.menu-tools') : null;
    const gap = (title ? title.offsetHeight : 0) + (pinned && getComputedStyle(pinned).position === 'sticky' ? pinned.offsetHeight : 0) + 6;
    const page = !scroller || scroller === document.body;
    const header = document.querySelector('header.top');
    const viewTop = page ? (header ? header.offsetHeight : 0) : scroller.getBoundingClientRect().top;
    const viewHeight = page ? window.innerHeight - viewTop : scroller.clientHeight;
    const now = page ? window.scrollY : scroller.scrollTop;
    const rect = box.getBoundingClientRect();
    // Its height once open: the opening is animated, but what it holds is already laid out (only clipped).
    let bottom = rect.bottom;
    for (const c of box.children) bottom = Math.max(bottom, c.getBoundingClientRect().bottom);
    const height = bottom - rect.top + parseFloat(getComputedStyle(box).paddingBottom || 0) + 2;
    // Where the menu is on screen, and where it will be once the menu above has closed.
    const was = rect.top - viewTop;
    let want = was;
    if (want + height > viewHeight - 8) want = viewHeight - 8 - height;
    want = Math.max(gap, Math.min(want, was));
    const top = Math.max(0, now - shrink + (was - want));
    if (Math.abs(top - now) < 2) return;
    const go = () => (page ? window : scroller).scrollTo({ top, behavior: 'smooth' });
    go();
    // A menu at the very bottom: the column only grows as the menu opens, finish the move then.
    const max = page ? document.documentElement.scrollHeight - window.innerHeight : scroller.scrollHeight - scroller.clientHeight;
    if (top > max + 2) setTimeout(go, 220);
  }

  /* ---------- Presets ---------- */

  function swatchFor(selection, groupId) {
    const group = groupById(groupId);
    const option = group && optionById(group, selection[groupId]);
    return (option && option.sw) || '#444';
  }

  function applyPreset(preset) {
    $('inspirations').open = false;
    state.selection = { ...state.cfg.options.defaults, ...preset.selection };
    state.custom = {};
    state.parked = {};
    for (const f of document.querySelectorAll('input.own')) f.value = '';
    state.extra = preset.extra || '';
    state.activePreset = preset.id;
    $('extra').value = state.extra;
    syncControls();
    renderPresets();
    schedulePreview();
    commit(`${t('startFrom')}${colon()}${label(preset)}`);
  }

  // A character picked at random: every menu about the person, not the render settings at the bottom.
  function randomCharacter() {
    $('inspirations').open = false;
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const sel = { ...state.selection };
    for (const group of state.cfg.options.groups) {
      if (group.section === 'render' || !group.options.length) continue;
      if (group.type === 'multi') {
        // Zero to two extras, never more than the menu allows.
        const pool = [...group.options];
        const n = Math.min(Math.floor(Math.random() * 3), group.max || 2, pool.length);
        sel[group.id] = Array.from({ length: n }, () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0].id);
      } else {
        // Details like the nose or the teeth stay ordinary more often than not.
        sel[group.id] = group.neutral && Math.random() < 0.5 ? group.neutral : pick(group.options).id;
      }
    }
    // No beard on women, now and then on everyone else.
    if (sel.presentation === 'woman' || Math.random() < 0.5) sel.facialHair = 'none';
    // Eyebrows mostly the colour of the hair.
    if (Math.random() < 0.85) sel.browColor = 'hair';
    sel.chinCleft = Math.random() < 0.15 ? 'yes' : 'no';
    sel.browJoin = Math.random() < 0.08 ? 'yes' : 'no';
    state.selection = sel;
    state.custom = {};
    state.parked = {};
    for (const f of document.querySelectorAll('input.own')) f.value = '';
    // Extra details drawn too: none, one or two, from options.json (randomExtras).
    const extras = [...(state.cfg.options.randomExtras || [])];
    const count = Math.floor(Math.random() * 3);
    state.extra = Array.from({ length: Math.min(count, extras.length) }, () => label(extras.splice(Math.floor(Math.random() * extras.length), 1)[0])).join(', ');
    $('extra').value = state.extra;
    state.activePreset = null;
    syncControls();
    renderPresets();
    schedulePreview();
    commit(t('random'));
  }

  // Thumbnails: none (names only, more of them on screen), four per row (the default) or two larger ones. Kept on this device.
  const TILE_SIZES = [['none', 'list'], ['small', 'grid'], ['big', 'grid2']];
  const tileSize = () => (TILE_SIZES.some(([id]) => id === read('cd-tiles')) ? read('cd-tiles') : 'small');
  function syncTileSize() {
    const size = tileSize();
    document.body.classList.toggle('tiles-big', size === 'big');
    document.body.classList.toggle('tiles-none', size === 'none');
    for (const b of document.querySelectorAll('.tile-size button')) b.setAttribute('aria-pressed', b.dataset.size === size ? 'true' : 'false');
  }
  function tileSizeButton() {
    const row = document.createElement('span');
    row.className = 'tile-size';
    row.setAttribute('role', 'group');
    for (const [id, ic] of TILE_SIZES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.size = id;
      b.title = t(`tiles_${id}`);
      b.setAttribute('aria-pressed', id === tileSize() ? 'true' : 'false');
      b.appendChild(icon(ic));
      b.addEventListener('click', () => {
        store('cd-tiles', id);
        syncTileSize();
        // The open menu changes height: keep it at the top of the column.
        const box = row.closest('details.group') || document.querySelector('.side details.group[open]');
        if (box && box.closest('.side')) revealMenu(box);
      });
      row.appendChild(b);
    }
    return row;
  }

  function renderPresets() {
    const root = $('presetList');
    root.textContent = '';
    for (const preset of state.cfg.presets) {
      const merged = { ...state.cfg.options.defaults, ...preset.selection };
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'card';
      b.setAttribute('aria-pressed', state.activePreset === preset.id ? 'true' : 'false');
      // The preview picture fills the card, the name and description sit at the bottom.
      // Without a picture: the skin, hair and eye colours.
      b.classList.add('preset');
      const txt = document.createElement('span');
      txt.className = 'txt';
      if (preset.img) {
        const shot = document.createElement('span');
        shot.className = 'shot';
        shot.style.backgroundImage = `url("${preset.img}")`;
        b.classList.add('has-img');
        b.appendChild(shot);
      } else {
        const dots = document.createElement('span');
        dots.className = 'dots';
        for (const g of ['skin', 'hairColor', 'eyeColor']) {
          const i = document.createElement('i');
          i.style.background = swatchFor(merged, g);
          dots.appendChild(i);
        }
        txt.appendChild(dots);
      }
      const h = document.createElement('h3');
      h.textContent = label(preset);
      const p = document.createElement('p');
      p.textContent = label(preset.tag);
      txt.append(h, p);
      b.appendChild(txt);
      b.addEventListener('click', () => applyPreset(preset));
      root.appendChild(b);
    }
  }

  /* ---------- Prompt preview ---------- */

  let previewTimer = null;
  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(refreshPreview, 200);
  }

  async function refreshPreview() {
    store('cd-settings', snapshot());
    try {
      syncSuffix();
      const data = await postJson('/api/preview', { selection: payloadSelection(), extra: state.extra, model: state.model, render: renderPayload(), refCounts: refCounts(), refMode: state.refMode, guide: guideMode() === 'control' || undefined });
      $('promptText').textContent = data.prompt;
      syncFaceWords(data.prompt);
      state.size = [data.width, data.height];
      syncCost();
      applyLayout();
      if ($('result').hidden) {
        $('meta').textContent = `${data.width} x ${data.height}`;
        setRatio(data.width, data.height);
      }
    } catch (err) {
      $('promptText').textContent = err.message;
    }
  }

  /* ---------- Generation ---------- */

  function setBusy(busy) {
    state.busy = busy;
    $('generate').disabled = busy;
    $('generate').querySelector('.gen-label').textContent = busy ? t('generating') : t('generate');
    $('cancel').hidden = !busy;
  }

  function showError(message) {
    const el = $('error');
    el.textContent = message;
    el.hidden = !message;
  }

  function showProgress(text) {
    $('progress').hidden = !text;
    $('progressText').textContent = text || '';
  }

  function splitName(filename) {
    const dot = filename.lastIndexOf('.');
    return dot > 0 ? [filename.slice(0, dot), filename.slice(dot)] : [filename, ''];
  }

  // Past generations form a stack of cards: arrows (or the keyboard) move through it.
  // The drawing laid over the image (ControlNet: same frame, lines over the picture) or in a corner (reference drawing).
  function syncCompare(item, on) {
    const g = item && item.guide;
    $('compareGuide').hidden = !g;
    const show = !!g && !!on;
    $('compareGuide').setAttribute('aria-pressed', show ? 'true' : 'false');
    $('guideOverlay').hidden = !show;
    if (show) {
      $('guideOverlay').src = g.src;
      $('guideOverlay').classList.toggle('corner', g.mode !== 'control');
    }
  }

  function showCard(index, animate) {
    if (!state.history.length) return;
    state.view = Math.max(0, Math.min(index, state.history.length - 1));
    const item = state.history[state.view];
    syncCompare(item, false);
    const img = $('result');
    img.classList.remove('in');
    img.src = item.url;
    img.alt = item.name;
    img.hidden = false;
    setRatio(item.width, item.height);
    if (animate) {
      void img.offsetWidth;
      img.classList.add('in');
    }
    $('placeholder').hidden = true;
    $('generate').classList.remove('hint');
    const via = item.provider && STR[lang].providers[item.provider] ? ` · ${shortName(item.provider)}` : '';
    const m = item.model ? modelById(item.model) : null;
    $('meta').textContent = `${m ? `${m.name} · ` : ''}seed ${item.seed} · ${item.width} x ${item.height}${via}`;
    if (!$('cardInfo').hidden) renderCardInfo(item);
    const dl = $('download');
    dl.href = item.url;
    dl.download = item.name;
    syncDeck();
    applyLayout();
  }

  function syncFav() {
    const item = state.history[state.view];
    const on = !!(item && item.fav);
    $('favCard').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('favCard').title = t('fav');
  }

  function syncDeck() {
    syncFav();
    const total = state.history.length;
    $('deck').classList.toggle('empty', total === 0);
    if (!total) {
      $('result').hidden = true;
      $('result').removeAttribute('src');
      $('placeholder').hidden = false;
      // Nothing made yet: the Generate button glows, so a newcomer knows where the image comes from.
      $('generate').classList.add('hint');
      if (state.size) {
        $('meta').textContent = `${state.size[0]} x ${state.size[1]}`;
        setRatio(state.size[0], state.size[1]);
      }
    }
    $('prev').hidden = $('next').hidden = total < 2;
    $('window').classList.toggle('stacked', total > 1);
    if (!total) return;
    // The list is newest first (the gallery's order); on screen the newest image is on the right,
    // so the counter counts from the oldest and the right arrow goes towards the newest.
    $('counter').textContent = `${total - state.view} / ${total}`;
    $('prev').disabled = state.view >= total - 1;
    $('next').disabled = state.view <= 0;
  }

  // Left: older image.
  function previous() {
    if (state.view < state.history.length - 1) showCard(state.view + 1, true);
  }

  // Right: newer image.
  function next() {
    if (state.view > 0) showCard(state.view - 1, true);
  }

  function reuseCard() {
    const item = state.history[state.view];
    if (!item || !item.settings) return;
    restore(item.settings);
    if (Number.isInteger(item.seed)) {
      $('seed').value = item.seed;
      setSeedMode('fixed');
    }
    commit(`${t('reuse')} (${state.history.length - state.view} / ${state.history.length})`);
  }

  // Whose queue the image waits in: ComfyUI on this PC, or the provider's name.
  const queueName = (p) => (p === 'local' ? 'ComfyUI' : STR[lang].providers[p] ? STR[lang].providers[p][0] : 'ComfyUI');

  // One click makes 1 to 4 images (batch). They share a batch id, so the gallery can show them together.
  async function generate() {
    if (state.busy) return;
    showError('');
    setBusy(true);
    const token = ++state.jobToken;
    const settings = snapshot();
    const engineUsed = engineFor(modelById(state.model));
    // The provider is fixed for these images, even if the menus change while they are being made.
    const prov = userProvider;
    const provHeaders = providerHeaders(prov);
    const count = Math.max(1, Math.min(4, state.batch || 1));
    const batchId = count > 1 ? `batch-${Date.now()}` : null;
    const creditsBefore = prov === 'kie' ? await api('/api/status', { headers: provHeaders }).then((st) => st.credits).catch(() => NaN) : NaN;
    const base = {
      selection: payloadSelection(),
      extra: state.extra,
      model: state.model,
      render: renderPayload(),
      refs: refsActive() ? state.refs.map((r) => r.data) : undefined,
      groupRefs: groupRefsPayload(),
      refMode: state.refMode,
      workflow: state.cfg.defaultWorkflow,
      guide: guideMode() ? await guidePng(guideMode()) : undefined,
      guideStrength: guideMode() === 'control' ? guideStrength : undefined,
    };
    const refThumbs = await refThumbnails();
    // The drawing that guided these images, kept with them to compare (512 px wide is enough).
    const guideKept = guideMode() ? { mode: guideMode(), src: await guideCopy(guideMode()) } : null;
    const typed = $('seed').value === '' ? null : Math.max(0, Math.floor(Number($('seed').value)));
    const errors = [];
    let made = 0;
    try {
      const jobs = [];
      for (let i = 0; i < count; i++) {
        // The seed is an advanced setting: without Advanced, every image gets a new random one.
        // With a kept seed, the images of a batch use seed, seed + 1, seed + 2...
        const seed = !state.render.on || state.seedMode === 'random' || typed === null ? null : typed + i;
        try {
          const job = await postJson('/api/generate', { ...base, seed }, provHeaders);
          jobs.push({ job, index: i, done: false });
        } catch (err) {
          errors.push(err.message);
        }
        if (token !== state.jobToken) return;
      }
      if (!jobs.length) throw new Error(errors[0] || t('failed'));
      afterSeed(jobs[jobs.length - 1].job.seed);
      const started = Date.now();
      showProgress(t('queued').replace('{p}', queueName(prov)));

      while (jobs.some((j) => !j.done)) {
        await sleep(1200);
        if (token !== state.jobToken) return;
        let running = false;
        for (const j of jobs.filter((x) => !x.done)) {
          const r = await api(`/api/job?id=${encodeURIComponent(j.job.promptId)}`, { headers: provHeaders });
          if (token !== state.jobToken) return;
          if (r.status === 'running') running = true;
          if (r.status === 'error') {
            j.done = true;
            errors.push(r.error || t('failed'));
          }
          if (r.status === 'done') {
            j.done = true;
            if (!r.images.length) {
              errors.push(t('noImage'));
              continue;
            }
            const first = r.images[0];
            const item = await keepCard({
              id: `${Date.now()}-${j.job.seed}-${j.index}`,
              created: Date.now(),
              name: `${fileStem()}_${stamp(new Date())}${count > 1 ? `_${j.index + 1}` : ''}${splitName(first.filename.split('?')[0].split('/').pop())[1] || '.png'}`,
              seed: j.job.seed,
              width: j.job.width,
              height: j.job.height,
              prompt: j.job.prompt || '',
              provider: prov,
              model: state.model,
              batch: batchId,
              batchIndex: j.index,
              refThumbs,
              guide: guideKept,
              refMode: refThumbs.some((r) => r.kind === 'main') ? state.refMode : null,
              settings,
            }, first.url);
            if (token !== state.jobToken) return;
            state.history.unshift(item);
            saveOrder();
            made += 1;
            trackUsage('image', { provider: prov });
            showCard(0, true);
          }
        }
        const secs = Math.round((Date.now() - started) / 1000);
        const left = jobs.filter((x) => !x.done).length;
        if (left) showProgress(`${running ? t('running') : t('queued').replace('{p}', queueName(prov))}${count > 1 ? ` · ${made}/${count}` : ''} · ${secs}s`);
        if (secs > 900) throw new Error(t('timeout'));
      }
      showProgress('');
      if (made) {
        measureCost(creditsBefore, engineUsed, prov, made);
        loadBalances();
      }
      if (errors.length) showError(made ? `${made}/${count} · ${errors[0]}` : errors[0]);
    } catch (err) {
      if (token === state.jobToken) {
        showProgress('');
        showError(err.message || t('failed'));
      }
    } finally {
      if (token === state.jobToken) setBusy(false);
    }
  }

  async function cancel() {
    state.jobToken += 1;
    showProgress('');
    setBusy(false);
    try {
      await postJson('/api/cancel', {});
    } catch (err) {
      showError(err.message);
    }
  }

  /* ---------- Session: kept in the browser, exported as one .html file ---------- */

  // Downloads the image once and keeps it locally: provider links can expire.
  async function keepCard(card, remoteUrl) {
    try {
      const res = await fetch(remoteUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      card.blob = await res.blob();
    } catch (err) {
      return { ...card, url: remoteUrl };
    }
    try {
      await window.CDSession.save(card);
    } catch (err) {
      /* private window or storage full: the card still shows for this visit */
    }
    return withUrl(card);
  }

  function withUrl(card) {
    return { ...card, url: card.blob ? URL.createObjectURL(card.blob) : card.url };
  }

  async function loadSession() {
    try {
      const cards = await window.CDSession.load();
      state.history = sortByOrder(cards.map(withUrl));
    } catch (err) {
      state.history = [];
    }
    if (state.history.length) showCard(0, false);
    else syncDeck();
  }

  async function deleteCard() {
    const item = state.history[state.view];
    if (!item || !window.confirm(t('confirmDelete'))) return;
    await removeItem(item);
  }

  async function removeItem(item) {
    try {
      await window.CDSession.remove(item.id);
    } catch (err) {
      /* nothing stored for this card */
    }
    if (item.blob) URL.revokeObjectURL(item.url);
    const at = state.history.indexOf(item);
    if (at < 0) return;
    state.history.splice(at, 1);
    saveOrder();
    if (state.history.length) showCard(Math.min(state.view, state.history.length - 1), false);
    else syncDeck();
    applyLayout();
    if (!$('gallery').hidden) renderGallery();
  }

  async function clearSession() {
    $('sessionMenu').open = false;
    if (!state.history.length || !window.confirm(t('confirmClear'))) return;
    try {
      await window.CDSession.clear();
    } catch (err) {
      /* nothing stored */
    }
    for (const item of state.history) if (item.blob) URL.revokeObjectURL(item.url);
    state.history = [];
    state.view = -1;
    // A new session starts with a random seed again.
    setSeedMode('random');
    $('seed').value = '';
    syncSeedChip();
    syncDeck();
    applyLayout();
  }

  // Human-readable settings for the export: "Age: Adult", ...
  function summary(settings) {
    if (!settings) return [];
    let s;
    try {
      s = JSON.parse(settings);
    } catch (err) {
      return [];
    }
    const rows = [];
    for (const group of state.cfg.options.groups) {
      const own = s.custom && s.custom[group.id] ? String(s.custom[group.id]).trim() : '';
      const v = s.selection ? s.selection[group.id] : undefined;
      const ids = group.type === 'multi' ? v || [] : [v];
      const names = ids.map((id) => optionById(group, id)).filter(Boolean).map(label);
      if (own && group.type === 'multi') names.push(own);
      const value = own && group.type !== 'multi' ? own : names.join(', ');
      if (value) rows.push([label(group), value]);
    }
    if (s.extra) rows.push([t('extraLabel').replace(/^\/\/\s*/, ''), s.extra]);
    return rows;
  }

  async function exportSession() {
    $('sessionMenu').open = false;
    const cards = state.history.filter((c) => c.blob);
    if (!cards.length) return showError(t('emptySession'));
    const html = await window.CDSession.exportHtml(
      cards.map((c) => ({ ...c, summary: summary(c.settings) })),
      { lang, title: state.name.trim() || t('exportTitle'), subtitle: t('exportSub'), prompt: t('prompt'), gallery: t('gallery'), medium: t('exportMedium'), list: t('exportList'), download: t('download'), downloadAll: t('downloadAll') }
    );
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    a.download = `${fileStem()}-session-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  async function importSession(file) {
    showError('');
    let cards;
    try {
      cards = await window.CDSession.importHtml(await file.text());
    } catch (err) {
      return showError(t('badFile'));
    }
    const known = new Set(state.history.map((c) => c.id));
    const fresh = cards.filter((c) => !known.has(c.id));
    for (const card of fresh) {
      try {
        await window.CDSession.save(card);
      } catch (err) {
        /* still shown for this visit */
      }
    }
    state.history = [...state.history, ...fresh.map(withUrl)].sort((a, b) => b.created - a.created);
    if (state.history.length) showCard(0, true);
    showProgress(`${fresh.length} ${t('imported')}`);
    setTimeout(() => showProgress(''), 2500);
  }

  /* ---------- Copy the prompt ---------- */

  async function copyPrompt() {
    const text = $('promptText').textContent;
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Older browsers or no clipboard permission: select the text and copy it the old way.
      const range = document.createRange();
      range.selectNodeContents($('promptText'));
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('copy');
      sel.removeAllRanges();
    }
    $('copyPrompt').textContent = t('copied');
    setTimeout(() => {
      $('copyPrompt').textContent = t('copy');
    }, 1400);
  }

  /* ---------- Character name ---------- */

  // Safe file name from the character name: "Ines, night courier" -> "ines-night-courier".
  function slug(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
  }

  // Name of the sheet layout, added after the character name: "ines_portrait-full-body".
  function layoutSlug() {
    const group = groupById('layout');
    const option = group && optionById(group, state.selection.layout);
    return option ? slug(label(option)) : '';
  }

  function fileStem() {
    const stem = slug(state.name) || 'character';
    const suffix = layoutSlug();
    return suffix ? `${stem}_${suffix}` : stem;
  }

  // The name field is as wide as its text, so the layout name sits right after it.
  function sizeName() {
    const field = $('charName');
    field.style.width = `calc(${Math.max(4, (field.value || field.placeholder).length) + 1}ch + 12px)`;
  }

  // Date and time for file names: 2026-10-27_223512. Never two the same, so files never need renaming.
  function stamp(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  function syncSuffix() {
    const suffix = layoutSlug();
    $('layoutSuffix').textContent = suffix ? `_${suffix}` : '';
  }

  /* ---------- Seed: random, keep, +1, -1 ---------- */

  // The chip in the bar shows the number, or the mode while the field is empty (random).
  function syncSeedChip() {
    const mode = $('seedMode').selectedOptions[0];
    $('seedValue').textContent = $('seed').value || (mode ? mode.textContent : '');
  }

  function setSeed(value) {
    $('seed').value = Math.max(0, Math.min(4294967295, Math.floor(value)));
    if (state.seedMode === 'random') setSeedMode('fixed');
    syncSeedChip();
  }

  // Kept between visits; back to random when the session is cleared.
  function setSeedMode(mode) {
    state.seedMode = mode;
    $('seedMode').value = mode;
    store('cd-seed-mode', mode);
    syncSeedChip();
  }

  // What the field shows next: the seed just used (random, keep) or the next one (+1, -1).
  function afterSeed(used) {
    if (state.seedMode === 'inc') $('seed').value = Math.min(4294967295, used + 1);
    else if (state.seedMode === 'dec') $('seed').value = Math.max(0, used - 1);
    else $('seed').value = used;
    syncSeedChip();
  }

  /* ---------- Price shown on the Generate button ---------- */

  function resolutionId(engine) {
    if (state.render.on && state.render.resolution && state.render.resolution !== 'auto') return state.render.resolution;
    return engine && engine.resolutions && engine.resolutions[0] ? engine.resolutions[0].id : '';
  }

  const money = (usd) => new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 3 }).format(usd);

  const costKey = (engine, provider = userProvider, model = state.model) => `cd-cost-${provider}-${model}-${resolutionId(engine)}`;

  // Price of one image of a model with a provider: known prices come from models.json,
  // KIE prices are measured on the balance after an image. '' when unknown.
  function priceText(m, provider) {
    const engine = m && m.engines ? m.engines[provider] : null;
    const price = engine && engine.price;
    if (price === 'free') return t('free');
    if (price && price.usd != null) return `≈ ${money(price.usd)}`;
    if (price && price.usdByRes && price.usdByRes[resolutionId(engine)] != null) return `≈ ${money(price.usdByRes[resolutionId(engine)])}`;
    if (price && price.usdPerMp != null && state.size) return `≈ ${money((price.usdPerMp * state.size[0] * state.size[1]) / 1e6)}`;
    if (price && price.usdPerMp != null) return `${money(price.usdPerMp)}/MP`;
    if (price && price[resolutionId(engine)] != null) return `≈ ${price[resolutionId(engine)]} ${t('credits')}`;
    if (provider === 'kie' && engine) {
      const seen = Number(read(costKey(engine, 'kie', m.id)));
      return seen > 0 ? `≈ ${seen} ${t('credits')}` : '';
    }
    return '';
  }

  function syncCost() {
    const cost = $('generate').querySelector('.gen-cost');
    // On your own machine the name says it all ("· free" no longer fits under the label; the tooltip says it is free).
    let text = userProvider === 'local' ? '' : priceText(modelById(state.model), userProvider);
    if (text && text !== t('free') && state.batch > 1) text = `${state.batch} × ${text.replace(/^≈ /, '')}`;
    // Under the label: who is paid for the next image, and its price.
    cost.textContent = '';
    if (userProvider) cost.append(logo(userProvider, shortName(userProvider).slice(0, 1), 'tiny'), shortName(userProvider));
    if (userProvider && text) cost.append(' · ');
    if (text) cost.append(text);
    cost.hidden = !userProvider && !text;
    cost.title = userProvider === 'local' ? t('payeeFree') : userProvider ? t('payeeTip').replace('{p}', STR[lang].providers[userProvider] ? STR[lang].providers[userProvider][0] : userProvider) : '';
    const note = state.cfg.models.priceNote || {};
    $('generate').title = `${t('generate')} (Ctrl+Enter)${note[userProvider] ? ` · ${note[userProvider]}` : ''}`;
  }

  // KIE: read the balance after the image and remember what it cost.
  async function measureCost(before, engine, provider, images = 1) {
    if (provider !== 'kie' || !Number.isFinite(before)) return;
    const after = await api('/api/status', { headers: providerHeaders(provider) }).then((st) => st.credits).catch(() => NaN);
    const spent = Math.round(((before - after) / images) * 100) / 100;
    if (spent > 0) store(costKey(engine, provider), String(spent));
    syncCost();
  }

  /* ---------- Model and advanced render ---------- */

  const models = () => state.cfg.models;
  const modelById = (id) => models().models.find((m) => m.id === id);
  const engineFor = (m) => (m && m.engines ? m.engines[m.id === state.model ? userProvider : pickProvider(m)] : null);

  /* ---------- Which provider runs which model ---------- */

  // KIE first: it is the cheapest almost every time. Then fal (prices known in advance), Comfy Router, Magnific, Comfy Cloud, this PC.
  const ORDER = ['kie', 'fal', 'router', 'magnific', 'cloud', 'local'];
  // How providers are listed on screen: the three Comfy ways first, then the other APIs.
  const SHOWN = ['local', 'router', 'kie', 'fal', 'magnific'];

  // Comfy Cloud is not offered (30/10, Greg: same key as Comfy Router, only Z-Image Turbo, a subscription, never tested):
  // its code stays in the server, it just does not appear.
  const HIDDEN = ['cloud'];
  function providersHere() {
    const info = state.cfg.settings || {};
    if (info.byok) return (info.providers || ['magnific']).filter((p) => !HIDDEN.includes(p));
    if (info.editable) return (info.providers || ORDER).filter((p) => !HIDDEN.includes(p));
    return [state.cfg.mode];
  }

  function hasKeyFor(p) {
    const info = state.cfg.settings || {};
    if (p === 'local') return !!info.editable;
    if (info.byok) return !!keys[p] || !!(info.hasServerKey && info.hasServerKey[p]);
    if (info.editable) return !!(info.hasKey && info.hasKey[p]);
    return p === state.cfg.mode;
  }

  const providersOf = (m) => (m && !m.soon && m.engines ? SHOWN.filter((p) => providersHere().includes(p) && m.engines[p]) : []);
  const readyProvidersOf = (m) => providersOf(m).filter(hasKeyFor);

  // The provider used for a model: the one last picked for it if it still has a key, else the first in ORDER with a key.
  function pickProvider(m) {
    const ready = ORDER.filter((p) => readyProvidersOf(m).includes(p));
    const saved = read(`cd-prov-${m && m.id}`);
    if (ready.includes(saved)) return saved;
    return ready[0] || ORDER.find((p) => providersOf(m).includes(p)) || state.cfg.mode;
  }

  function useModel(id) {
    state.model = id;
    store('cd-model', id);
    userProvider = pickProvider(modelById(id));
  }

  function useProvider(p) {
    store(`cd-prov-${state.model}`, p);
    userProvider = p;
    renderModels();
    renderAdvanced();
    renderRefs();
    syncCost();
    syncBalances();
    schedulePreview();
    refreshStatus();
  }
  const ratiosFor = (engine) => (!engine ? [] : engine.ratios === 'all' ? models().ratios : models().ratios.filter((r) => engine.ratios.includes(r.id)));

  function renderPayload() {
    return state.render.on ? { ratio: state.render.ratio, resolution: state.render.resolution } : null;
  }

  // Models as square tiles, like the menus: the list will grow. Hover or focus shows the details below the grid.
  // A model can carry an "img" (preview) in models.json; without it the tile shows its initials.
  // onPc: tile of the "on this PC" group, a click runs the model on this PC.
  // The models panel: a row of providers on top; the models the chosen one does not offer are greyed,
  // and the price under each model is the price with that provider.
  let modelProv = read('cd-model-prov') || '';

  function modelTile(m, provider) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tile model-tile';
    const here = !m.soon && !!(m.engines && m.engines[provider]);
    b.disabled = !here;
    b.setAttribute('aria-pressed', m.id === state.model && provider === userProvider ? 'true' : 'false');
    const thumb = document.createElement('span');
    thumb.className = 'thumb';
    if (m.img) {
      thumb.style.backgroundImage = `url("${m.img}")`;
    } else {
      const initial = document.createElement('span');
      initial.className = 'initial';
      initial.textContent = m.name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 3);
      thumb.appendChild(initial);
    }
    // Small house badge of the model family, bottom left (not the makers' logos, which are trademarks).
    if (m.family) {
      const fam = document.createElement('span');
      fam.className = 'family';
      fam.dataset.family = m.family;
      fam.appendChild(logo(m.family, m.family));
      thumb.appendChild(fam);
    }
    const corner = document.createElement('span');
    corner.className = 'corner';
    corner.textContent = t(m.open ? 'openBadge' : 'apiBadge');
    thumb.appendChild(corner);
    if (m.refs) {
      const refs = document.createElement('span');
      refs.className = 'refs-badge';
      refs.title = t('refsBadge');
      refs.append(icon('image'), `${((m.engines && m.engines[provider] && m.engines[provider].maxRefs) || m.maxRefs) || ''}`);
      thumb.appendChild(refs);
    }
    const name = document.createElement('span');
    name.textContent = m.name;
    b.append(thumb, name);
    const price = document.createElement('small');
    price.className = 'm-price';
    if (here) {
      price.textContent = (priceText(m, provider) || (provider === 'kie' ? t('priceLater') : '')).replace(/^≈ /, '');
      price.title = t('pricePerImage');
    } else {
      price.textContent = t('notWith').replace('{p}', inSentence(provider));
    }
    b.appendChild(price);
    const info = () => {
      const tags = [t(m.open ? 'openBadge' : 'apiBadge') + (m.license ? ` · ${m.license}` : '')];
      if (m.refs) tags.push(`${t('refsBadge')} (${((m.engines && m.engines[provider] && m.engines[provider].maxRefs) || m.maxRefs) || m.maxRefs || ''})`);
      if (m.needsRefs) tags.push(t('needsRefsBadge'));
      const others = providersOf(m).filter((p) => p !== provider);
      if (others.length) tags.push(`${t('via')} ${others.map(shortName).join(', ')}`);
      $('modelInfo').textContent = `${m.name}: ${label(m)} [${tags.join(' · ')}]`;
    };
    b.addEventListener('mouseenter', info);
    b.addEventListener('focus', info);
    b.addEventListener('click', () => {
      if (!here) return;
      state.model = m.id;
      store('cd-model', m.id);
      store(`cd-prov-${m.id}`, provider);
      userProvider = provider;
      refreshStatus();
      syncBalances();
      $('modelPop').open = false;
      renderModels();
      renderAdvanced();
      renderRefs();
      syncCost();
      schedulePreview();
    });
    return b;
  }

  // Size of the model tiles, kept on this device: medium by default (small was too small to see the pictures).
  const MODEL_SIZES = [['list', 'list'], ['small', 'grid'], ['medium', 'grid2'], ['big', 'square']];
  const modelTileSize = () => (MODEL_SIZES.some(([id]) => id === read('cd-model-tiles')) ? read('cd-model-tiles') : 'medium');
  function modelSizeButtons() {
    const row = document.createElement('span');
    row.className = 'tile-size model-size';
    row.setAttribute('role', 'group');
    for (const [id, ic] of MODEL_SIZES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.title = t(`modelTiles_${id}`);
      b.setAttribute('aria-pressed', id === modelTileSize() ? 'true' : 'false');
      b.appendChild(icon(ic));
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        store('cd-model-tiles', id);
        renderModels();
      });
      row.appendChild(b);
    }
    return row;
  }

  function renderModels() {
    const list = $('modelList');
    list.textContent = '';
    list.dataset.size = modelTileSize();
    const all = models().models;
    // Every provider of this version that offers at least one model.
    const provs = SHOWN.filter((p) => providersHere().includes(p) && all.some((m) => !m.soon && m.engines && m.engines[p]));
    if (!provs.includes(modelProv)) modelProv = provs.includes(userProvider) ? userProvider : provs.find(hasKeyFor) || provs[0] || '';
    const top = document.createElement('div');
    top.className = 'prov-switch';
    const lab = document.createElement('span');
    lab.className = 'mono';
    lab.textContent = `// ${t('provider')}`;
    // Title and size switch on the first line; the providers share the second one (none left alone on a line).
    const head = document.createElement('div');
    head.className = 'ps-head';
    head.appendChild(lab);
    const chips = document.createElement('div');
    chips.className = 'ps-chips';
    top.append(head, chips);
    for (const p of provs) {
      const ok = hasKeyFor(p);
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `ghost small${ok ? '' : ' nokey'}`;
      pill.setAttribute('aria-pressed', p === modelProv ? 'true' : 'false');
      pill.append(logo(p, shortName(p).slice(0, 2), 'small'), shortName(p));
      // Without a key: greyed, says so, and a click opens Keys for that provider.
      if (!ok) pill.title = p === 'local' ? t('localOff') : t('addKeyFor').replace('{p}', STR[lang].providers[p][0]);
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!ok) {
          if (p !== 'local') askKey(p, state.model);
          return;
        }
        modelProv = p;
        store('cd-model-prov', p);
        // The current model goes along when this provider has it.
        const cur = modelById(state.model);
        if (cur && cur.engines && cur.engines[p] && p !== userProvider) useProvider(p);
        else renderModels();
      });
      chips.appendChild(pill);
    }
    head.appendChild(modelSizeButtons());
    list.appendChild(top);
    // Open weights, then API only; in each, the models of the chosen provider first.
    const has = (m) => !m.soon && !!(m.engines && m.engines[modelProv]);
    const order = (items) => [...items.filter(has), ...items.filter((m) => !has(m))];
    const groups = [
      [t('openModels'), order(all.filter((m) => m.open)), 'open'],
      [t('apiModels'), order(all.filter((m) => !m.open)), 'api'],
    ];
    for (const [title, items, name] of groups) {
      if (!items.length) continue;
      const grid = document.createElement('div');
      grid.className = 'tiles models';
      for (const m of items) grid.appendChild(modelTile(m, modelProv));
      const box = document.createElement('details');
      box.className = 'model-fold';
      const key = `cd-fold-${name}`;
      const kept = read(key);
      box.open = kept === null || kept === '' ? true : kept === '1';
      const head = document.createElement('summary');
      head.className = 'mono';
      head.textContent = `// ${title} (${items.filter(has).length}/${items.length})`;
      box.addEventListener('toggle', () => store(key, box.open ? '1' : '0'));
      box.append(head, grid);
      list.appendChild(box);
    }
    const infoLine = document.createElement('p');
    infoLine.className = 'menu-note model-info';
    infoLine.id = 'modelInfo';
    list.appendChild(infoLine);
    const current = modelById(state.model);
    $('modelValue').textContent = current ? current.name : '';
    $('modelLabel').textContent = userProvider ? `${t('model')} · ${shortName(userProvider)}` : t('model');
    syncGuideDock();
    if (current) infoLine.textContent = `${current.name}: ${label(current)}`;
  }

  function textTile(text, on, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tile text';
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    const thumb = document.createElement('span');
    thumb.className = 'thumb';
    const word = document.createElement('span');
    word.className = 'initial';
    word.textContent = text;
    thumb.appendChild(word);
    b.appendChild(thumb);
    b.addEventListener('click', onClick);
    return b;
  }

  function renderAdvanced() {
    const engine = engineFor(modelById(state.model));
    const ratios = ratiosFor(engine);
    const resolutions = engine ? engine.resolutions : [];
    if (state.render.ratio !== 'auto' && !ratios.some((r) => r.id === state.render.ratio)) state.render.ratio = 'auto';
    // "auto" keeps the size of the sheet layout; a resolution is only applied when picked.
    if (state.render.resolution !== 'auto' && !resolutions.some((r) => r.id === state.render.resolution)) state.render.resolution = 'auto';
    store('cd-render', JSON.stringify(state.render));

    $('advancedBtn').setAttribute('aria-pressed', state.render.on ? 'true' : 'false');
    $('advancedGroups').hidden = !state.render.on;

    const pick = (changes) => {
      Object.assign(state.render, changes);
      renderAdvanced();
      syncCost();
      schedulePreview();
    };
    const rl = $('ratioList');
    rl.textContent = '';
    rl.appendChild(textTile('Auto', state.render.ratio === 'auto', () => {
      $('ratioPop').open = false;
      pick({ ratio: 'auto' });
    }));
    for (const r of ratios) {
      const tile = textTile(r.id, state.render.ratio === r.id, () => {
        $('ratioPop').open = false;
        pick({ ratio: r.id });
      });
      // The tile shows the shape of the ratio.
      const shape = document.createElement('span');
      shape.className = 'shape';
      const k = 54 / Math.max(r.w, r.h);
      shape.style.width = `${Math.round(r.w * k)}%`;
      shape.style.height = `${Math.round(r.h * k)}%`;
      tile.querySelector('.thumb').prepend(shape);
      rl.appendChild(tile);
    }
    const sl = $('resList');
    sl.textContent = '';
    for (const r of [{ id: 'auto', en: 'Auto', fr: 'Auto' }, ...resolutions]) {
      sl.appendChild(textTile(label(r), state.render.resolution === r.id, () => {
        $('resPop').open = false;
        pick({ resolution: r.id });
      }));
    }
    $('ratioValue').textContent = state.render.ratio === 'auto' ? t('auto') : state.render.ratio;
    const res = resolutions.find((r) => r.id === state.render.resolution);
    $('resValue').textContent = res ? label(res) : t('auto');
    $('resPop').hidden = resolutions.length < 2;
  }

  /* ---------- Gallery: every image at once, favourites, order ---------- */

  // The order chosen in the gallery is kept as a list of ids; new images go first.
  function sortByOrder(cards) {
    let order = [];
    try {
      order = JSON.parse(read('cd-order') || '[]');
    } catch (err) {
      order = [];
    }
    const rank = new Map(order.map((id, i) => [id, i]));
    return cards.sort((a, b) => {
      const ra = rank.has(a.id) ? rank.get(a.id) : -1;
      const rb = rank.has(b.id) ? rank.get(b.id) : -1;
      if (ra === -1 && rb === -1) return b.created - a.created;
      if (ra === -1) return -1;
      if (rb === -1) return 1;
      return ra - rb;
    });
  }

  function saveOrder() {
    store('cd-order', JSON.stringify(state.history.map((c) => c.id)));
  }

  async function toggleFav(item) {
    item.fav = !item.fav;
    if (item.blob) {
      try {
        const { url, ...card } = item;
        await window.CDSession.save(card);
      } catch (err) {
        /* still marked for this visit */
      }
    }
    syncFav();
    if (!$('gallery').hidden) renderGallery();
  }

  let galleryFilter = 'all';
  let dragged = null;

  let galleryGrouped = read('cd-group') === '1';

  function renderGallery() {
    const grid = $('galleryGrid');
    grid.textContent = '';
    const items = state.history.filter((c) => galleryFilter === 'all' || c.fav);
    $('galleryEmpty').hidden = items.length > 0;
    for (const b of $('galleryFilter').querySelectorAll('button')) b.setAttribute('aria-pressed', b.dataset.filter === galleryFilter ? 'true' : 'false');
    $('galleryGroup').setAttribute('aria-pressed', galleryGrouped ? 'true' : 'false');
    $('galleryHint').textContent = galleryGrouped ? t('groupHint') : t('galleryHint');
    grid.classList.toggle('grouped', galleryGrouped);
    if (!galleryGrouped) {
      for (const item of items) grid.appendChild(galleryCell(item, true));
      return;
    }
    // Grouped: the images of one batch sit together, at the place of the first one.
    const groups = [];
    const byBatch = new Map();
    for (const item of items) {
      if (item.batch && byBatch.has(item.batch)) byBatch.get(item.batch).push(item);
      else {
        const list = [item];
        if (item.batch) byBatch.set(item.batch, list);
        groups.push(list);
      }
    }
    for (const list of groups) {
      if (list.length < 2) {
        grid.appendChild(galleryCell(list[0], false));
        continue;
      }
      list.sort((a, b) => (a.batchIndex || 0) - (b.batchIndex || 0));
      const box = document.createElement('div');
      box.className = 'g-batch';
      const label = document.createElement('p');
      label.className = 'g-batch-label mono';
      label.textContent = `// ${t('batchOf')} ${list.length} · ${new Date(list[0].created).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}`;
      const inner = document.createElement('div');
      inner.className = 'g-batch-grid';
      for (const item of list) inner.appendChild(galleryCell(item, false));
      box.append(label, inner);
      grid.appendChild(box);
    }
  }

  function galleryCell(item, draggable) {
    const grid = $('galleryGrid');
    const cell = document.createElement('div');
    cell.className = 'g-item';
    cell.draggable = draggable;
    if (state.history[state.view] === item) cell.classList.add('current');
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'g-open';
    const img = document.createElement('img');
    img.src = item.url;
    img.alt = item.name;
    img.loading = 'lazy';
    open.appendChild(img);
    open.addEventListener('click', () => {
      showCard(state.history.indexOf(item), true);
      closeGallery();
    });
    const fav = document.createElement('button');
    fav.type = 'button';
    fav.className = 'g-fav';
    fav.title = t('fav');
    fav.setAttribute('aria-pressed', item.fav ? 'true' : 'false');
    fav.appendChild(icon('heart'));
    fav.addEventListener('click', () => toggleFav(item));
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'g-del';
    del.textContent = '×';
    del.title = t('deleteCard');
    del.addEventListener('click', async () => {
      if (window.confirm(t('confirmDelete'))) await removeItem(item);
    });
    const cap = document.createElement('p');
    cap.className = 'g-cap';
    cap.textContent = `${item.name.replace(/\.[a-z]+$/i, '')} · ${item.width} x ${item.height}`;
    cell.append(open, fav, del, cap);
    if (!draggable) return cell;
    // Drag and drop to reorder (mouse).
    cell.addEventListener('dragstart', (e) => {
      dragged = item;
      cell.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    cell.addEventListener('dragend', () => {
      dragged = null;
      cell.classList.remove('dragging');
      for (const c of grid.querySelectorAll('.over')) c.classList.remove('over');
    });
    cell.addEventListener('dragover', (e) => {
      if (!dragged || dragged === item) return;
      e.preventDefault();
      cell.classList.add('over');
    });
    cell.addEventListener('dragleave', () => cell.classList.remove('over'));
    cell.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!dragged || dragged === item) return;
      const current = state.history[state.view];
      state.history.splice(state.history.indexOf(dragged), 1);
      state.history.splice(state.history.indexOf(item), 0, dragged);
      state.view = Math.max(0, state.history.indexOf(current));
      saveOrder();
      syncDeck();
      renderGallery();
    });
    return cell;
  }

  function openGallery() {
    $('gallery').hidden = false;
    document.body.classList.add('gallery-open');
    renderGallery();
    $('galleryClose').focus();
  }

  function closeGallery() {
    $('gallery').hidden = true;
    document.body.classList.remove('gallery-open');
  }

  /* ---------- Image details: model, provider, format, seed, references, full prompt ---------- */

  // Small copies of the reference images sent with a generation, kept with the image (96 px JPEG).
  function tinyCopy(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const k = 96 / Math.max(img.naturalWidth, img.naturalHeight);
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * k));
        c.height = Math.max(1, Math.round(img.naturalHeight * k));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  // Same order and same cut as the server (packRefs): starting images, outfit, accessories, style.
  async function refThumbnails() {
    const max = maxRefs();
    if (!max) return [];
    const list = [];
    if (refsActive()) for (const r of state.refs) list.push({ kind: 'main', data: r.data });
    if (guideMode() === 'ref') list.push({ kind: 'guide', data: await guidePng('ref') });
    for (const kind of ['outfit', 'accessories', 'look']) for (const r of state.groupRefs[kind] || []) list.push({ kind, data: r.data });
    const out = [];
    for (const r of list.slice(0, max)) {
      const src = await tinyCopy(r.data);
      if (src) out.push({ kind: r.kind, src });
    }
    return out;
  }

  // Closest named ratio, for the format line.
  function ratioName(w, h) {
    let best = null;
    let bestD = Infinity;
    for (const r of state.cfg.models.ratios) {
      const d = Math.abs(Math.log(r.w / r.h) - Math.log(w / h));
      if (d < bestD) {
        bestD = d;
        best = r.id;
      }
    }
    return best;
  }

  function renderCardInfo(item) {
    const box = $('cardInfo');
    box.textContent = '';
    if (!item) return;
    const m = item.model ? modelById(item.model) : null;
    const nf = new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 1 });
    const rows = [
      [t('infoModel'), m ? m.name : item.model || '?'],
      [t('infoProvider'), item.provider && STR[lang].providers[item.provider] ? STR[lang].providers[item.provider][0] : '?'],
      [t('infoFormat'), `${ratioName(item.width, item.height)} · ${item.width} x ${item.height} · ${nf.format((item.width * item.height) / 1048576)} MP`],
      [t('infoSeed'), String(item.seed)],
      [t('infoMade'), new Date(item.created).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })],
    ];
    const dl = document.createElement('dl');
    for (const [k, v] of rows) {
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = v;
      dl.append(dt, dd);
    }
    const refsT = document.createElement('dt');
    refsT.textContent = t('infoRefs');
    const refsD = document.createElement('dd');
    const refs = Array.isArray(item.refThumbs) ? item.refThumbs : [];
    if (!Array.isArray(item.refThumbs)) refsD.textContent = t('infoRefsOld');
    else if (!refs.length) refsD.textContent = t('infoNoRefs');
    else {
      const strip = document.createElement('div');
      strip.className = 'info-refs';
      refs.forEach((r, i) => {
        const fig = document.createElement('figure');
        const img = document.createElement('img');
        img.src = r.src;
        img.alt = '';
        const cap = document.createElement('figcaption');
        cap.textContent = `${i + 1} · ${(t('refKinds') || {})[r.kind] || r.kind}`;
        fig.append(img, cap);
        strip.appendChild(fig);
      });
      refsD.appendChild(strip);
      if (item.refMode) {
        const note = document.createElement('small');
        note.textContent = (t('refModes') || {})[item.refMode] || '';
        refsD.appendChild(note);
      }
    }
    dl.append(refsT, refsD);
    const head = document.createElement('div');
    head.className = 'info-prompt-head';
    const label = document.createElement('span');
    label.className = 'mono';
    label.textContent = t('infoPrompt');
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'ghost small';
    copy.textContent = t('copy');
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(item.prompt || '');
        copy.textContent = t('copied');
      } catch (err) {
        copy.textContent = '!';
      }
      setTimeout(() => (copy.textContent = t('copy')), 1500);
    });
    head.append(label, copy);
    const pre = document.createElement('pre');
    pre.textContent = item.prompt || '';
    box.append(dl, head, pre);
  }

  // Shown while the pointer is on the button or the panel (mouse), or toggled by a click (touch, keyboard).
  function setupCardInfo() {
    const btn = $('infoCard');
    const box = $('cardInfo');
    let pinned = false;
    let timer = null;
    const show = () => {
      clearTimeout(timer);
      const item = state.history[state.view];
      if (!item) return;
      renderCardInfo(item);
      box.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
    };
    const hide = () => {
      box.hidden = true;
      pinned = false;
      btn.setAttribute('aria-expanded', 'false');
    };
    const later = () => {
      clearTimeout(timer);
      if (!pinned) timer = setTimeout(hide, 250);
    };
    const hover = window.matchMedia('(hover: hover)').matches;
    if (hover) {
      for (const el of [btn, box]) {
        el.addEventListener('mouseenter', show);
        el.addEventListener('mouseleave', later);
      }
    }
    btn.addEventListener('click', () => {
      if (pinned) return hide();
      pinned = true;
      show();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !box.hidden) hide();
    });
    document.addEventListener('click', (e) => {
      if (pinned && !box.contains(e.target) && !btn.contains(e.target)) hide();
    });
  }

  /* ---------- About ---------- */

  const REPO = 'https://github.com/DashDashDesign/Kara';
  const SITE = 'https://dashdash.design';

  function openAbout() {
    const body = $('aboutBody');
    body.textContent = '';
    const el = (tag, cls, text) => {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text) n.textContent = text;
      return n;
    };
    const link = (href, text, cls = 'ghost small') => {
      const a = el('a', cls, text);
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
      return a;
    };
    const by = el('p', 'about-by');
    const studio = link(SITE, '', 'about-studio');
    studio.setAttribute('aria-label', 'Dash Dash');
    const mark = document.createElement('img');
    mark.src = 'assets/logo-light.svg';
    mark.alt = 'Dash Dash';
    studio.appendChild(mark);
    by.append(`${t('aboutBy')} `, studio);
    const row = el('div', 'about-links');
    row.append(link(REPO, t('aboutRepo')), link(`${REPO}/issues/new`, t('aboutFeedback'), 'primary small'), link(SITE, `${t('aboutSite')} · dashdash.design`));
    const close = el('button', 'ghost small about-close', t('close'));
    close.type = 'button';
    close.addEventListener('click', () => $('about').close());
    body.append(el('p', 'mono', '// Kara'), el('p', 'about-text', t('aboutText')), by, el('p', 'menu-note', t('aboutLicense')), row, el('p', 'menu-note', t('aboutFeedbackNote')));
    // The app installed on a computer can update itself from GitHub; the online version is always up to date.
    if (state.cfg.settings && state.cfg.settings.editable) body.append(updateBox(el));
    body.append(close);
    $('about').showModal();
  }

  function updateBox(el) {
    const box = el('div', 'about-update');
    const note = el('p', 'menu-note', t('updChecking'));
    const btn = el('button', 'primary small', t('updBtn'));
    btn.type = 'button';
    btn.hidden = true;
    box.append(el('p', 'mono', `// ${t('updTitle')}`), note, btn);
    checkUpdate().then((u) => {
      if (u.error) {
        note.textContent = t('updError').replace('{e}', u.error);
        return;
      }
      const day = u.date ? new Date(u.date).toLocaleDateString(lang) : '';
      note.textContent = !u.available ? t('updUpToDate') : u.current ? t('updAvailable').replace(' ({d})', day ? ` (${day})` : '').replace('{d}', day) : t('updUnknown');
      btn.hidden = !u.available;
    });
    btn.addEventListener('click', async () => {
      if (btn.onclick) return;
      btn.disabled = true;
      btn.textContent = t('updBusy');
      try {
        await api('/api/update', { method: 'POST' });
        note.textContent = t('updDone');
        $('aboutBtn').classList.remove('has-update');
        // One click restarts the app; the page waits for the new server, then reloads.
        btn.disabled = false;
        btn.textContent = t('updRestart');
        btn.onclick = async (e) => {
          e.stopImmediatePropagation();
          btn.disabled = true;
          btn.textContent = t('updRestarting');
          await api('/api/restart', { method: 'POST' }).catch(() => {});
          await sleep(1200);
          for (let i = 0; i < 40; i++) {
            try {
              const r = await fetch('/api/config', { cache: 'no-store' });
              if (r.ok) break;
            } catch (err) {
              /* not up yet */
            }
            await sleep(500);
          }
          location.reload();
        };
      } catch (err) {
        note.textContent = t('updFailed').replace('{e}', err.message);
        btn.disabled = false;
        btn.textContent = t('updBtn');
      }
    });
    return box;
  }

  // Asked once at start (a dot on About when a new version exists), then each time About opens.
  async function checkUpdate() {
    try {
      const u = await api('/api/update');
      $('aboutBtn').classList.toggle('has-update', !!u.available && !u.error);
      return u;
    } catch (err) {
      return { error: err.message };
    }
  }

  /* ---------- The wheel scrolls the menus on the left, wherever the pointer is ---------- */

  function setupSideScroll() {
    document.addEventListener('wheel', (e) => {
      // Face editor open: only its own list of settings scrolls, never the page behind it.
      const fe = $('faceEditor');
      if (fe && !fe.hidden) {
        if (!e.target.closest('.fe-side')) e.preventDefault();
        return;
      }
      if (!document.body.classList.contains('layout-side') || e.ctrlKey) return;
      if (!$('viewer').hidden || !$('gallery').hidden || $('about').open) return;
      // Places that scroll on their own keep the wheel.
      if (e.target.closest('.side, .pop-panel, .drop-panel, .card-info, textarea, select, .dock')) return;
      const side = document.querySelector('.side');
      if (!side) return;
      e.preventDefault();
      side.scrollBy({ top: e.deltaY, behavior: 'auto' });
    }, { passive: false });
  }

  /* ---------- Zoom into the image: wheel or pinch to zoom, drag to move ---------- */

  const zoom = { scale: 1, x: 0, y: 0, fit: 1 };
  const touches = new Map();
  let pinchFrom = null;

  // Where the image sits on the page, so the viewer can grow out of it and shrink back into it.
  function placeOnPage() {
    const img = $('viewerImg');
    const r = (viewerOrigin || $('result')).getBoundingClientRect();
    if (!img.naturalWidth || !r.width) return false;
    const s = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
    zoom.scale = s;
    zoom.x = r.left + (r.width - img.naturalWidth * s) / 2;
    zoom.y = r.top + (r.height - img.naturalHeight * s) / 2;
    drawZoom();
    return true;
  }

  // A short move (.22s) between the page and the viewer; the CSS skips it when the system asks for less motion.
  function glide(then) {
    const viewer = $('viewer');
    viewer.classList.add('gliding');
    clearTimeout(glide.timer);
    glide.timer = setTimeout(() => {
      viewer.classList.remove('gliding');
      if (then) then();
    }, 230);
  }

  // The viewer grows out of the image on the page, or out of another element when one is given.
  let viewerOrigin = null;
  function openViewer(fromSrc, origin) {
    viewerOrigin = typeof fromSrc === 'string' ? origin : null;
    const src = viewerOrigin ? fromSrc : $('result').getAttribute('src');
    if (!src || (!viewerOrigin && $('result').hidden)) return;
    const img = $('viewerImg');
    const viewer = $('viewer');
    const start = () => {
      viewer.classList.remove('shown', 'gliding');
      viewer.hidden = false;
      document.body.classList.add('viewer-open');
      if (!placeOnPage()) {
        viewer.classList.add('shown');
        return fitViewer();
      }
      requestAnimationFrame(() => {
        glide();
        viewer.classList.add('shown');
        fitViewer();
      });
    };
    img.onload = start;
    img.src = src;
    $('viewerMapImg').src = src;
    if (img.complete && img.naturalWidth) {
      img.onload = null;
      start();
    }
    $('viewerClose').focus();
  }

  function closeViewer() {
    const viewer = $('viewer');
    touches.clear();
    pinchFrom = null;
    viewer.classList.remove('grabbing');
    $('viewerMap').hidden = true;
    const done = () => {
      viewer.hidden = true;
      viewer.classList.remove('shown');
      document.body.classList.remove('viewer-open');
    };
    viewer.classList.remove('shown');
    glide(done);
    if (!placeOnPage()) {
      clearTimeout(glide.timer);
      done();
    }
  }

  function drawZoom() {
    const img = $('viewerImg');
    img.style.transform = `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`;
    // Past twice the real size, show the pixels sharp instead of blurred.
    img.classList.toggle('pixels', zoom.scale >= 2);
    $('viewerZoom').textContent = `${Math.round(zoom.scale * 100)} %`;
    drawMap();
  }

  // The minimap: the whole image small, with a frame on the part shown. Only when zoomed past the edges.
  const MAP_W = 160;
  function viewArea() {
    const box = $('viewer').getBoundingClientRect();
    return [box.width, box.height - 64];
  }

  function drawMap() {
    const img = $('viewerImg');
    const map = $('viewerMap');
    if (!img.naturalWidth) return (map.hidden = true);
    const [vw, vh] = viewArea();
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const left = Math.max(0, -zoom.x / zoom.scale);
    const top = Math.max(0, -zoom.y / zoom.scale);
    const right = Math.min(nw, (vw - zoom.x) / zoom.scale);
    const bottom = Math.min(nh, (vh - zoom.y) / zoom.scale);
    map.hidden = left <= 1 && top <= 1 && right >= nw - 1 && bottom >= nh - 1;
    if (map.hidden) return;
    const k = MAP_W / nw;
    map.style.width = `${MAP_W}px`;
    map.style.height = `${Math.round(nh * k)}px`;
    const frame = $('viewerMapBox').style;
    frame.left = `${left * k}px`;
    frame.top = `${top * k}px`;
    frame.width = `${Math.max(4, (right - left) * k)}px`;
    frame.height = `${Math.max(4, (bottom - top) * k)}px`;
  }

  // A click or a drag on the minimap centres the view on that point.
  function centreFromMap(e) {
    const img = $('viewerImg');
    const r = $('viewerMap').getBoundingClientRect();
    const [vw, vh] = viewArea();
    const cx = ((e.clientX - r.left) / r.width) * img.naturalWidth;
    const cy = ((e.clientY - r.top) / r.height) * img.naturalHeight;
    zoom.x = vw / 2 - cx * zoom.scale;
    zoom.y = vh / 2 - cy * zoom.scale;
    drawZoom();
  }

  function fitViewer() {
    const img = $('viewerImg');
    const box = $('viewer').getBoundingClientRect();
    if (!img.naturalWidth) return;
    // A margin all around, so there is empty space to click to close.
    zoom.fit = Math.min((box.width - 96) / img.naturalWidth, (box.height - 160) / img.naturalHeight);
    zoom.scale = zoom.fit;
    zoom.x = (box.width - img.naturalWidth * zoom.scale) / 2;
    zoom.y = (box.height - 64 - img.naturalHeight * zoom.scale) / 2;
    drawZoom();
  }

  // Zooms around a point of the screen, so what is under the cursor stays under it.
  function zoomAt(factor, cx, cy) {
    const next = Math.max(Math.min(zoom.fit, 1) * 0.5, Math.min(Math.max(32, zoom.fit * 4), zoom.scale * factor));
    const f = next / zoom.scale;
    zoom.x = cx - (cx - zoom.x) * f;
    zoom.y = cy - (cy - zoom.y) * f;
    zoom.scale = next;
    drawZoom();
  }

  function viewerCentre() {
    const box = $('viewer').getBoundingClientRect();
    return [box.width / 2, (box.height - 64) / 2];
  }

  function setupViewer() {
    const viewer = $('viewer');
    const local = (e) => {
      const box = viewer.getBoundingClientRect();
      return [e.clientX - box.left, e.clientY - box.top];
    };
    $('result').addEventListener('click', openViewer);
    $('viewerClose').addEventListener('click', closeViewer);
    $('viewerFit').addEventListener('click', fitViewer);
    $('viewerOne').addEventListener('click', () => zoomAt(1 / zoom.scale, ...viewerCentre()));
    viewer.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoomAt(Math.exp(-e.deltaY * 0.0015), ...local(e));
    }, { passive: false });
    viewer.addEventListener('dblclick', (e) => {
      if (e.target.closest('.viewer-bar')) return;
      // Zoomed in or out: back to the starting view. At the starting view: actual size on the point.
      if (Math.abs(zoom.scale - zoom.fit) > 0.01) {
        glide();
        return fitViewer();
      }
      const [x, y] = local(e);
      const px = (x - zoom.x) / zoom.scale;
      const py = (y - zoom.y) / zoom.scale;
      const [vw, vh] = viewArea();
      zoom.scale = 1;
      zoom.x = vw / 2 - px;
      zoom.y = vh / 2 - py;
      glide();
      drawZoom();
    });
    // A click in the empty area around the image (not a drag) closes the viewer.
    let press = null;
    const map = $('viewerMap');
    map.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      map.setPointerCapture(e.pointerId);
      map.dragging = true;
      centreFromMap(e);
    });
    map.addEventListener('pointermove', (e) => {
      if (map.dragging) centreFromMap(e);
    });
    const stopMap = () => (map.dragging = false);
    map.addEventListener('pointerup', stopMap);
    map.addEventListener('pointercancel', stopMap);
    map.addEventListener('dblclick', (e) => e.stopPropagation());
    viewer.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.viewer-bar')) return;
      press = touches.size ? null : { x: e.clientX, y: e.clientY, empty: e.target === viewer };
      viewer.setPointerCapture(e.pointerId);
      touches.set(e.pointerId, local(e));
      viewer.classList.add('grabbing');
    });
    viewer.addEventListener('pointermove', (e) => {
      if (!touches.has(e.pointerId)) return;
      const [x, y] = local(e);
      const [px, py] = touches.get(e.pointerId);
      touches.set(e.pointerId, [x, y]);
      if (touches.size === 1) {
        zoom.x += x - px;
        zoom.y += y - py;
        drawZoom();
        return;
      }
      // Two fingers: zoom by the change of distance, around the middle of the fingers.
      const [a, b] = [...touches.values()];
      const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (pinchFrom) zoomAt(dist / pinchFrom, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      pinchFrom = dist;
    });
    const release = (e) => {
      const tap = press && e.type === 'pointerup' && touches.size === 1 && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 5;
      if (tap && press.empty) {
        press = null;
        closeViewer();
        return;
      }
      touches.delete(e.pointerId);
      pinchFrom = null;
      if (!touches.size) viewer.classList.remove('grabbing');
    };
    viewer.addEventListener('pointerup', release);
    viewer.addEventListener('pointercancel', release);
    window.addEventListener('resize', () => {
      if (!viewer.hidden) fitViewer();
    });
  }

  function viewerKeys(e) {
    if (e.key === 'Escape') closeViewer();
    else if (e.key === '+' || e.key === '=') zoomAt(1.25, ...viewerCentre());
    else if (e.key === '-') zoomAt(0.8, ...viewerCentre());
    else if (e.key === '0') fitViewer();
    else if (e.key === '1') zoomAt(1 / zoom.scale, ...viewerCentre());
    else return;
    e.preventDefault();
  }

  /* ---------- Starting images (references) ---------- */

  const currentModel = () => modelById(state.model);
  // The provider's engine may take fewer images than the model (a local workflow: text only).
  const maxRefs = () => {
    const m = currentModel();
    if (!m || !m.refs) return 0;
    const e = engineFor(m);
    return e && e.maxRefs !== undefined ? e.maxRefs : m.maxRefs || 4;
  };
  const refsActive = () => state.refs.length > 0 && maxRefs() > 0;
  // How many images of each kind the model will get, in the order the server keeps them
  // (starting images, face drawing, outfit, accessories, style): the last ones are left out past the maximum.
  function refBudget() {
    const max = maxRefs();
    const wanted = {
      main: state.refs.length,
      guide: guideMode() === 'ref' ? 1 : 0,
      outfit: (state.groupRefs.outfit || []).length,
      accessories: (state.groupRefs.accessories || []).length,
      look: (state.groupRefs.look || []).length,
    };
    const kept = {};
    let room = max;
    for (const k of Object.keys(wanted)) {
      kept[k] = Math.min(wanted[k], room);
      room -= kept[k];
    }
    const total = Object.values(wanted).reduce((a, b) => a + b, 0);
    return { max, total, kept, over: max > 0 && total > max };
  }
  function refOverNote(budget) {
    return t('refOver').replace('{max}', budget.max).replace('{total}', budget.total).replace('{n}', budget.total - budget.max);
  }

  /* ---------- The face drawing as a guide for the image ---------- */

  let guideOn = read('cd-guide') === '1';
  // How the drawing is used with the current model: 'control' (ControlNet workflow on this PC: the drawing steers the image),
  // 'ref' (sent as a reference image), or null (this model takes no image, or a starting image already gives the face).
  function guideMode() {
    if (!guideOn) return null;
    if (state.refMode === 'sheet' && refsActive()) return null;
    const engine = engineFor(currentModel());
    if (engine && engine.guideWorkflow) return 'control';
    return maxRefs() > 0 ? 'ref' : null;
  }
  // The drawing as a PNG: lines on white for ControlNet (portrait), flat colours on light grey as a reference (square).
  async function guideCopy(mode) {
    const full = await guidePng(mode === 'control' ? 'control' : 'ref');
    const img = new Image();
    img.src = full;
    await img.decode();
    const k = 512 / img.naturalWidth;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = Math.round(img.naturalHeight * k);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  }
  async function guidePng(mode) {
    const [w, h] = mode === 'control' ? [1024, 1280] : [1024, 1024];
    const svg = faceSvg(null, false, mode).replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="230" `);
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = mode === 'control' ? '#ffffff' : '#e9e9e6';
    ctx.fillRect(0, 0, w, h);
    const k = Math.min(w / 200, h / 230);
    // As a reference image, slightly blurred: the model takes the proportions, not the drawn lines.
    if (mode === 'ref') ctx.filter = 'blur(7px)';
    ctx.drawImage(img, (w - 200 * k) / 2, (h - 230 * k) / 2, 200 * k, 230 * k);
    ctx.filter = 'none';
    return canvas.toDataURL('image/png');
  }
  function guideHint() {
    const mode = guideMode();
    if (!guideOn) return t('guideOff');
    return mode === 'control' ? t('guideControl') : mode === 'ref' ? t('guideRef') : t('guideNone');
  }
  // The details chip: the start of what is written (green), or "Add…" when the field is empty.
  function syncExtraChip() {
    const pop = $('extraPop');
    if (!pop) return;
    const text = (state.extra || '').replace(/\s+/g, ' ').trim();
    pop.classList.toggle('on', !!text);
    $('extraName').textContent = t('extraShort');
    $('extraValue').textContent = text ? (text.length > 20 ? `${text.slice(0, 19).trimEnd()}…` : text) : t('extraEmpty');
  }

  // The face drawing chip in the bottom bar: only where ControlNet exists (Z-Image Turbo on your own machine).
  // Hover it to switch it on or off, set its strength, and read what it does.
  let guideStrength = (() => {
    const v = Number(read('cd-guide-strength'));
    return v >= 0.2 && v <= 0.9 ? v : 0.55;
  })();
  function buildGuidePop() {
    const body = $('guideBody');
    if (body.dataset.built) return;
    body.dataset.built = '1';
    const make = (tag, cls, id) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (id) e.id = id;
      return e;
    };
    const sw = make('label', 'guide-switch');
    const box = make('input', '', 'guideSwitch');
    box.type = 'checkbox';
    sw.append(box, make('span', '', 'guideSwitchText'));
    box.addEventListener('change', () => {
      guideOn = box.checked;
      store('cd-guide', guideOn ? '1' : '0');
      syncControls();
      renderRefs();
      schedulePreview();
    });
    const row = make('div', 'guide-strength');
    const head = make('div', 'gs-head');
    head.append(make('span', '', 'guideStrengthLabel'), make('b', '', 'guideStrengthValue'));
    const range = make('input', '', 'guideStrengthRange');
    range.type = 'range';
    range.min = '20';
    range.max = '90';
    range.step = '5';
    const ends = make('div', 'gs-ends');
    ends.append(make('span', '', 'guideLoose'), make('span', '', 'guideStrict'));
    row.append(head, range, ends);
    range.addEventListener('input', () => {
      guideStrength = Number(range.value) / 100;
      store('cd-guide-strength', String(guideStrength));
      $('guideStrengthValue').textContent = `${Math.round(guideStrength * 100)} %`;
    });
    const open = make('button', 'ghost small', 'guideEditorBtn');
    open.type = 'button';
    open.addEventListener('click', () => {
      $('guidePop').open = false;
      openFaceEditor('faceShape');
    });
    body.append(sw, row, make('p', 'guide-explain', 'guideExplain'), make('p', 'guide-explain lock', 'guideWhyLock'), open);
  }
  function syncGuideDock() {
    const pop = $('guidePop');
    if (!pop || !state.cfg) return;
    const engine = engineFor(currentModel());
    const can = !!(engine && engine.guideWorkflow);
    pop.hidden = !can;
    if (!can) {
      pop.open = false;
      return;
    }
    buildGuidePop();
    pop.classList.toggle('on', guideOn);
    $('guideLabel').textContent = t('guideShort');
    $('guideValue').textContent = guideOn ? t('guideStateOn') : t('guideStateOff');
    $('guideSwitch').checked = guideOn;
    $('guideSwitchText').textContent = t('guide');
    $('guideStrengthLabel').textContent = t('guideStrength');
    $('guideStrengthValue').textContent = `${Math.round(guideStrength * 100)} %`;
    if (document.activeElement !== $('guideStrengthRange')) $('guideStrengthRange').value = String(Math.round(guideStrength * 100));
    $('guideLoose').textContent = t('guideLoose');
    $('guideStrict').textContent = t('guideStrict');
    $('guideExplain').textContent = t('guideExplain');
    $('guideWhyLock').textContent = t('guideWhyLock');
    $('guideEditorBtn').textContent = t('faceEditor');
  }

  // A checkbox, wherever the face is drawn.
  function guideToggle() {
    const box = document.createElement('label');
    box.className = 'guide-toggle';
    const input = document.createElement('input');
    input.type = 'checkbox';
    const text = document.createElement('span');
    text.textContent = t('guide');
    const hint = document.createElement('small');
    box.append(input, text, hint);
    input.addEventListener('change', () => {
      guideOn = input.checked;
      store('cd-guide', guideOn ? '1' : '0');
      syncControls();
      renderRefs();
      schedulePreview();
    });
    box.syncGuide = () => {
      input.checked = guideOn;
      hint.textContent = guideHint();
      box.classList.toggle('on', !!guideMode());
    };
    box.syncGuide();
    return box;
  }

  // Images are shrunk in the browser (longest side 1536 px, JPEG) before they are sent.
  function shrink(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1536 / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * k);
        canvas.height = Math.round(img.naturalHeight * k);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(t('refBadFile')));
      };
      img.src = url;
    });
  }

  async function addRefs(files) {
    showError('');
    for (const file of files) {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
        showError(t('refBadFile'));
        continue;
      }
      if (state.refs.length >= 5) break;
      try {
        state.refs.push({ data: await shrink(file), name: file.name });
      } catch (err) {
        showError(err.message);
      }
    }
    renderRefs();
    schedulePreview();
  }

  function renderRefs() {
    const list = $('refList');
    list.textContent = '';
    state.refs.forEach((ref, i) => {
      const box = document.createElement('div');
      box.className = 'ref';
      const img = document.createElement('img');
      img.src = ref.data;
      img.alt = ref.name;
      const x = document.createElement('button');
      x.type = 'button';
      x.textContent = '×';
      x.setAttribute('aria-label', 'remove');
      x.addEventListener('click', () => {
        state.refs.splice(i, 1);
        renderRefs();
        schedulePreview();
      });
      if (maxRefs() && i >= refBudget().kept.main) box.classList.add('dropped');
      box.append(img, x);
      list.appendChild(box);
    });
    const has = state.refs.length > 0;
    let clearMain = $('refsClearMain');
    if (!clearMain) {
      clearMain = refsClearButton(() => {
        state.refs = [];
      });
      clearMain.id = 'refsClearMain';
      list.after(clearMain);
    }
    clearMain.hidden = state.refs.length < 2;
    $('refModeRow').hidden = !has || !maxRefs();
    for (const b of $('refModeRow').querySelectorAll('button')) b.setAttribute('aria-pressed', b.dataset.mode === state.refMode ? 'true' : 'false');
    let note = '';
    if (has && !maxRefs()) note = t('refNoModel');
    else if (has && refBudget().over) note = refOverNote(refBudget());
    else if (refsActive() && state.refMode === 'sheet') note = t('refSheetNote');
    else if (refsActive() && state.refMode === 'inspire') note = t('refInspireNote');
    $('refNote').textContent = note;
    syncGroupRefs();
    // Sheet mode leaves the menus about the person out of the prompt: show it.
    const dim = refsActive() && state.refMode === 'sheet';
    for (const sec of $('controls').querySelectorAll('.section')) {
      sec.classList.toggle('dimmed', dim);
      // Greyed menus cannot be opened or clicked: they would change nothing.
      sec.inert = dim;
      if (dim) for (const d of sec.querySelectorAll('details[open]')) d.open = false;
    }
  }

  /* ---------- Settings: provider and API key ---------- */

  let pendingProvider = null;

  // A model whose providers have no key yet: open Keys on the first of them.
  function askKey(provider, modelId) {
    $('modelPop').open = false;
    pendingProvider = provider;
    store('cd-model', modelId);
    renderSettings();
    $('settingsMenu').open = true;
    loadBalances();
    $('settingsResult').textContent = t('needKeyFor').replace('{p}', STR[lang].providers[provider][0]);
    $('apiKey').focus();
  }

  // After a key is saved or forgotten: models available, provider of the current model, status.
  function afterKeysChanged() {
    const wanted = read('cd-model');
    const m = modelById(wanted);
    if (m && readyProvidersOf(m).length) useModel(wanted);
    else userProvider = pickProvider(modelById(state.model));
    renderModels();
    renderAdvanced();
    renderRefs();
    syncCost();
    schedulePreview();
    refreshStatus();
    loadBalances();
  }

  function renderSettings() {
    const info = state.cfg.settings || { editable: false, byok: false, provider: state.cfg.mode };
    const provider = pendingProvider || userProvider || info.provider;
    const list = $('providerList');
    list.textContent = '';
    for (const id of SHOWN.filter((p) => providersHere().includes(p))) {
      const [name, desc] = STR[lang].providers[id];
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'provider';
      b.disabled = !(info.editable || info.byok);
      b.setAttribute('aria-pressed', id === provider ? 'true' : 'false');
      const strong = document.createElement('strong');
      strong.textContent = name;
      const span = document.createElement('span');
      span.textContent = desc;
      const bal = document.createElement('em');
      bal.className = 'balance';
      b.dataset.provider = id;
      b.append(logo(id, name.slice(0, 2), 'big'), strong, span, bal);
      b.addEventListener('click', () => {
        pendingProvider = id;
        renderSettings();
      });
      list.appendChild(b);
    }
    $('providerDesc').textContent = STR[lang].providers[provider] ? STR[lang].providers[provider][1] : '';
    $('comfyUrlRow').hidden = !(info.editable && provider === 'local');
    $('localBox').hidden = !(info.editable && provider === 'local');
    if (!$('localBox').hidden) renderLocal();
    if (!$('comfyUrl').value) $('comfyUrl').value = info.comfyUrl || '';
    $('keyRow').hidden = provider === 'local' || !(info.editable || info.byok);
    $('keyLabel').textContent = info.byok ? t('keyOwn').replace('{p}', STR[lang].providers[provider][0]) : t('keyLabel');
    const saved = info.byok ? !!keys[provider] : info.hasKey && info.hasKey[provider];
    $('apiKey').placeholder = saved ? t('keySaved') : t('keyNone');
    // Where a newcomer creates a key, for each provider (pages named in the providers' own docs).
    const KEY_PAGES = {
      magnific: 'https://www.magnific.com/user/organization/api-keys',
      kie: 'https://kie.ai/api-key',
      cloud: 'https://platform.comfy.org',
      router: 'https://platform.comfy.org/profile/api-keys',
      fal: 'https://fal.ai/dashboard/keys',
    };
    $('keyLink').hidden = $('keyRow').hidden || !KEY_PAGES[provider];
    $('keyLink').href = KEY_PAGES[provider] || '#';
    $('keyLink').textContent = `${t('getKey')} ↗`;
    $('rememberRow').hidden = !info.byok;
    $('forgetKey').hidden = $('keyRow').hidden || !saved;
    $('settingsNote').textContent = info.byok ? t('byokNote') : provider !== 'local' && info.editable ? t('localNote') : '';
    $('saveSettings').hidden = !(info.editable || info.byok);
    syncBalances();
  }

  async function saveSettings() {
    const info = state.cfg.settings || {};
    const key = $('apiKey').value.trim();
    $('settingsResult').textContent = '';
    const provider = pendingProvider || userProvider || info.provider;
    if (info.byok) {
      if (key) storeKey(provider, key, $('rememberKey').checked);
    } else {
      try {
        const local = provider === 'local' ? { comfyDir: $('comfyDir').value.trim() } : {};
        state.cfg.settings = await postJson('/api/settings', { provider, comfyUrl: $('comfyUrl').value.trim(), key, ...local });
      } catch (err) {
        $('settingsResult').textContent = err.message;
        return;
      }
    }
    $('apiKey').value = '';
    renderSettings();
    $('settingsResult').textContent = t('savedOk');
    afterKeysChanged();
  }

  async function forgetKey() {
    const info = state.cfg.settings || {};
    const provider = pendingProvider || userProvider || info.provider;
    $('settingsResult').textContent = '';
    if (info.byok) storeKey(provider, '', false);
    else {
      // On your own machine, the key line of .env is emptied.
      try {
        state.cfg.settings = await postJson('/api/settings', { provider, forget: true });
      } catch (err) {
        $('settingsResult').textContent = err.message;
        return;
      }
    }
    renderSettings();
    $('settingsResult').textContent = t('forgotOk');
    afterKeysChanged();
  }

  /* ---------- ComfyUI on this computer: short how-to, model files, one-click install ---------- */

  let localTimer = null;
  const gb = (bytes) => (bytes / 1e9).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 1 });

  async function renderLocal() {
    clearTimeout(localTimer);
    let st;
    try {
      st = await api('/api/local/models?model=z-image-turbo');
    } catch (err) {
      $('localBox').hidden = true;
      return;
    }
    const missingGb = (st.files || []).filter((f) => !f.present).reduce((n, f) => n + f.gb, 0);
    const total = missingGb || (st.files || []).reduce((n, f) => n + f.gb, 0);
    const size = total.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 0 });
    const steps = $('localSteps');
    steps.textContent = '';
    t('localSteps').forEach((text, i) => {
      const li = document.createElement('li');
      const [before, after] = text.replace('{gb}', size || '20').split('{link}');
      li.append(before);
      if (after !== undefined) {
        const a = document.createElement('a');
        a.href = 'https://www.comfy.org/download';
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = 'comfy.org/download';
        li.append(a, after);
      }
      li.classList.toggle('done', st.comfy && (i < 2 || !missingGb));
      steps.appendChild(li);
    });
    const missing = (st.files || []).filter((f) => !f.present);
    $('localState').textContent = !st.comfy ? t('localNoComfy') : missing.length ? t('localMissing') : t('localReady');
    const files = $('localFiles');
    files.textContent = '';
    if (st.comfy) {
      for (const f of st.files || []) {
        const li = document.createElement('li');
        li.className = f.present ? 'ok' : '';
        li.textContent = `${f.present ? '✓' : '·'} ${f.folder}/${f.file} (${f.gb.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')} ${lang === 'fr' ? 'Go' : 'GB'})`;
        files.appendChild(li);
      }
    }
    const p = st.progress || {};
    const running = p.state === 'running';
    $('comfyDirRow').hidden = !(st.comfy && !st.canInstall);
    if (!$('comfyDir').value) $('comfyDir').value = (state.cfg.settings && state.cfg.settings.comfyDir) || '';
    $('comfyDir').placeholder = 'D:\\AI\\ComfyUI';
    if (st.comfy && !st.canInstall) $('localState').textContent = t('comfyDirAsk');
    $('installModel').hidden = !(st.comfy && st.canInstall && missing.length) || running;
    $('installModel').textContent = t('installModel').replace('{gb}', size);
    $('localProgress').hidden = !running && p.state !== 'error' && !(p.state === 'done' && p.model);
    const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
    $('localProgress').querySelector('i').style.width = `${p.state === 'done' ? 100 : pct}%`;
    $('localProgressText').textContent =
      p.state === 'error' ? `${t('installError')}${p.error}` : p.state === 'done' ? t('installDone') : running ? `${t('installing')} ${p.file || ''} · ${gb(p.done || 0)} / ${gb(p.total || 0)} ${lang === 'fr' ? 'Go' : 'GB'} (${pct} %)` : '';
    if (running && $('settingsMenu').open) localTimer = setTimeout(renderLocal, 1000);
  }

  async function installModel() {
    $('installModel').disabled = true;
    try {
      await postJson('/api/local/install', { model: 'z-image-turbo' });
    } catch (err) {
      $('localProgress').hidden = false;
      $('localProgressText').textContent = `${t('installError')}${err.message}`;
    }
    $('installModel').disabled = false;
    renderLocal();
  }

  /* ---------- Remaining balance, per provider ---------- */

  const balances = {};

  function formatBalance(b) {
    if (!b) return '';
    if (b.free) return t('free');
    if (Number.isFinite(b.amount)) {
      if (b.unit === 'credits') return `${b.amount.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')} ${t('credits')}`;
      return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: b.unit || 'USD' }).format(b.amount);
    }
    return t({ unsupported: 'balanceNone', noright: 'balanceNoRight', nokey: 'balanceNoKey' }[b.error] || 'balanceError');
  }

  // Asks each provider for its balance with its own key (saved on the PC, or in this browser online).
  async function loadBalances() {
    const info = state.cfg.settings || {};
    const ids = providersHere();
    await Promise.all(
      ids.map(async (id) => {
        try {
          balances[id] = info.byok
            ? await api('/api/balance', { headers: { 'x-user-provider': id, 'x-user-key': keys[id] || '' } })
            : await api(`/api/balance?provider=${id}`);
        } catch (err) {
          balances[id] = { error: 'http' };
        }
      })
    );
    syncBalances();
  }

  function syncBalances() {
    for (const card of document.querySelectorAll('.provider[data-provider]')) {
      const line = card.querySelector('.balance');
      const b = balances[card.dataset.provider];
      const text = formatBalance(b);
      line.classList.toggle('none', !(b && (b.free || Number.isFinite(b.amount))));
      line.textContent = text ? `${t('balance')} : ${text}`.replace(' : ', lang === 'fr' ? ' : ' : ': ') : '';
    }
    $('settingsLabel').textContent = t('settings');
    syncProvMenu();
  }

  // Top right: the provider that runs the current model, with its balance. A click lists every provider
  // with its balance; picking one runs the model there, or opens the models it has.
  function syncProvMenu() {
    const b = balances[userProvider];
    const money = b && (b.free || Number.isFinite(b.amount)) ? formatBalance(b) : '';
    $('statusText').textContent = userProvider ? [shortName(userProvider), money].filter(Boolean).join(' · ') : '';
    const list = $('provList');
    list.textContent = '';
    for (const p of SHOWN.filter((x) => providersHere().includes(x))) {
      const ok = hasKeyFor(p);
      const row = document.createElement('button');
      row.type = 'button';
      row.className = `prov-row${ok ? '' : ' nokey'}`;
      row.setAttribute('aria-pressed', p === userProvider ? 'true' : 'false');
      const name = document.createElement('span');
      name.className = 'prov-name';
      name.append(logo(p, shortName(p).slice(0, 2), 'small'), shortName(p));
      const value = document.createElement('span');
      value.className = 'prov-balance';
      const bb = balances[p];
      value.textContent = !ok ? (p === 'local' ? t('localOff') : t('keyMissing')) : bb && (bb.free || Number.isFinite(bb.amount)) ? formatBalance(bb) : bb ? t('balanceShort') : '';
      if (!ok && p !== 'local') row.title = t('addKeyFor').replace('{p}', STR[lang].providers[p][0]);
      row.append(name, value);
      row.addEventListener('click', () => {
        $('provMenu').open = false;
        if (!ok) {
          if (p !== 'local') askKey(p, state.model);
          return;
        }
        modelProv = p;
        store('cd-model-prov', p);
        const cur = modelById(state.model);
        if (cur && cur.engines && cur.engines[p]) {
          if (p !== userProvider) useProvider(p);
          else renderModels();
        } else {
          // The current model is not there: show the models this provider has.
          renderModels();
          $('modelPop').open = true;
        }
      });
      list.appendChild(row);
    }
  }

  /* ---------- Bottom bar: menus open on hover (mouse), one at a time ---------- */

  function setupDock() {
    // Only the bar's own menus: a folded group inside the models panel is not one of them.
    const pops = () => [...$('dock').querySelectorAll('details.pop')];
    for (const d of pops()) d.name = 'dock-pop';
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let closer = null;
    const openOnly = (d) => {
      clearTimeout(closer);
      for (const other of pops()) if (other !== d && !other.contains(d) && !d.contains(other)) other.open = false;
      d.open = true;
    };
    // Inside the Settings panel the small menus open in place (a click), the panel itself follows the pointer.
    const outer = (el) => {
      const d = el.closest('details.pop');
      return d && d.parentElement.closest('.more-pop') ? $('morePop') : d;
    };
    $('dock').addEventListener('mouseover', (e) => {
      const d = outer(e.target);
      if (d && $('dock').contains(d)) openOnly(d);
    });
    $('dock').addEventListener('mouseout', (e) => {
      const d = outer(e.target);
      if (!d || (e.relatedTarget && d.contains(e.relatedTarget))) return;
      clearTimeout(closer);
      closer = setTimeout(() => {
        if (!d.matches(':hover') && !d.contains(document.activeElement)) d.open = false;
      }, 260);
    });
    // With hover, a click on the title keeps the menu open instead of closing it.
    $('dock').addEventListener('click', (e) => {
      const sum = e.target.closest('details.pop > summary');
      if (sum && sum.parentElement.parentElement.closest('.more-pop')) return;
      if (sum && $('dock').contains(sum)) {
        e.preventDefault();
        openOnly(sum.parentElement);
      }
    });
  }

  // The bar stays on one line: when the settings chips do not fit beside the model, they fold into a "Settings" menu.
  function setupDockFit() {
    const more = $('morePop');
    const body = $('moreBody');
    const block = $('dockMore');
    const home = more.parentElement;
    const wide = window.matchMedia('(min-width: 901px)');
    let busy = false;
    const setCompact = (on) => {
      if (on === !more.hidden) return;
      more.hidden = !on;
      $('dock').classList.toggle('compact', on);
      // Back in the bar it goes right after the Settings chip, so Advanced always stays last.
      if (on) body.append(block);
      else more.after(block);
      for (const d of block.querySelectorAll('details.pop')) d.name = on ? 'dock-more' : 'dock-pop';
    };
    const setIcons = (on) => {
      $('dock').classList.toggle('icons', on);
      for (const sum of block.querySelectorAll(':scope details.pop > summary.chipbtn')) {
        const text = [...sum.querySelectorAll('.g-name, .g-value')].map((e) => e.textContent.trim()).filter(Boolean).join(': ');
        if (on && text) sum.title = text;
        else {
          sum.removeAttribute('title');
          delete sum.dataset.tip;
        }
      }
    };
    let mo;
    const fit = () => {
      // Only a field being typed in is left alone (moving it would drop the cursor); a button just clicked can move.
      if (busy || more.open || document.activeElement?.matches?.('#dockMore input, #dockMore textarea, #dockMore select')) return;
      busy = true;
      setCompact(false);
      // First the chips shrink to their icon (name and value in a tooltip); only when even that is too wide do they fold.
      const over = () => home.scrollWidth > home.clientWidth + 1;
      setIcons(false);
      if (wide.matches && over()) {
        setIcons(true);
        if (over()) {
          setIcons(false);
          setCompact(true);
        }
      }
      if (mo) mo.takeRecords();
      busy = false;
    };
    let queued = 0;
    const later = () => { cancelAnimationFrame(queued); queued = requestAnimationFrame(fit); };
    new ResizeObserver(later).observe($('dock'));
    mo = new MutationObserver(later);
    mo.observe(home, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'class'] });
    more.addEventListener('toggle', () => { if (!more.open) later(); });
    wide.addEventListener('change', later);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
    later();
  }

  /* ---------- Status, language, texts ---------- */

  async function refreshStatus() {
    try {
      const s = await api('/api/status');
      state.comfyOk = s.ok;
      state.comfyUrl = s.url;
      $('dot').className = `dot ${s.ok ? 'on' : 'off'}`;
      const remote = ['cloud', 'router', 'magnific', 'kie', 'fal'].includes(s.mode);
      const prefix = remote ? s.mode : 'comfy';
      // KIE, fal and Comfy Router messages come from the server as they are; the others have translated texts.
      const help = s.mode === 'kie' || s.mode === 'fal' || s.mode === 'router' ? s.error : remote ? t(`${prefix}Help_${s.code || 'http'}`) : `${t('comfyHelp')} ${s.url}`;
      if (Number.isFinite(s.credits)) state.credits = s.credits;
      const extra = s.mode === 'kie' && Number.isFinite(s.credits) ? ` · ${s.credits} ${t('credits')}` : !remote && s.device ? ` · ${s.device}` : '';
      const line = s.ok ? `${t(`${prefix}On`)}${extra}` : t(`${prefix}Off`);
      $('status').title = line;
      syncProvMenu();
      if (!s.ok && !state.busy) showError(help);
      if (s.ok) {
        const shown = $('error').textContent;
        if (shown.startsWith(t('comfyHelp')) || shown.startsWith(t('cloudHelp_nokey').slice(0, 20)) || shown.startsWith(t('magnificHelp_nokey').slice(0, 20))) showError('');
      }
    } catch (err) {
      $('dot').className = 'dot off';
      $('status').title = t('comfyOff');
    }
  }

  function applyTexts() {
    document.documentElement.lang = lang;
    $('lede').textContent = t('lede');
    $('presetsLabel').textContent = t('startFrom');
    $('extraLabel').textContent = t('extraLabel');
    $('extra').placeholder = t('extraPlaceholder');
    syncExtraChip();
    $('seedLabel').textContent = t('seedLabel');
    $('seedName').textContent = t('seedName');
    $('seedDown').title = t('seedDown');
    $('seedUp').title = t('seedUp');
    $('seedDice').title = t('seedDice');
    $('seedMode').title = t('seedModeTitle');
    $('seedMode').textContent = '';
    for (const [id, text] of Object.entries(STR[lang].seedModes)) $('seedMode').add(new Option(text, id));
    $('seedMode').value = state.seedMode;
    syncSeedChip();
    $('modelLabel').textContent = t('model');
    $('ratioLabel').textContent = t('ratio');
    $('resLabel').textContent = t('resolution');
    $('advancedBtn').textContent = '';
    const advLabel = document.createElement('span');
    advLabel.className = 'lbl';
    advLabel.textContent = t('advanced');
    $('advancedBtn').append(icon('sliders'), advLabel);
    $('advancedBtn').title = t('advanced');
    $('moreLabel').textContent = '';
    $('moreLabel').append(icon('sliders'), t('moreSettings'));
    $('charName').placeholder = t('namePlaceholder');
    sizeName();
    $('charName').title = t('nameTitle');
    $('cancel').textContent = t('cancel');
    $('promptSummary').textContent = t('promptBtn');
    $('promptTitle').textContent = t('prompt');
    $('galleryBtn').textContent = '';
    $('galleryBtn').append(icon('grid'), t('gallery'));
    $('randomBtn').textContent = '';
    const randomText = document.createElement('span');
    randomText.className = 'btn-text';
    randomText.textContent = t('random');
    $('randomBtn').append(icon('dice'), randomText);
    $('randomBtn').title = t('randomTitle');
    $('galleryTitle').textContent = `// ${t('gallery')}`;
    $('galleryFilter').querySelector('[data-filter="all"]').textContent = t('galleryAll');
    $('galleryFilter').querySelector('[data-filter="fav"]').textContent = t('galleryFav');
    $('galleryHint').textContent = galleryGrouped ? t('groupHint') : t('galleryHint');
    $('galleryGroup').textContent = t('groupBatches');
    $('result').title = t('zoomHint');
    $('viewerHint').textContent = t('viewerHint');
    $('viewerFit').textContent = t('fit');
    $('viewerClose').textContent = t('close');
    $('comfyDirLabel').textContent = t('comfyDirLabel');
    $('aboutBtn').textContent = t('about');
    $('batch').title = t('batch');
    $('batch').setAttribute('aria-label', t('batch'));
    $('galleryEmpty').textContent = t('galleryEmpty');
    $('galleryClose').textContent = `× ${t('close')}`;
    $('favCard').textContent = '';
    $('favCard').appendChild(icon('heart'));
    $('compareGuide').textContent = '';
    $('compareGuide').appendChild(icon('face'));
    $('compareGuide').title = t('compareGuide');
    $('compareGuide').setAttribute('aria-label', t('compareGuide'));
    $('infoCard').textContent = '';
    $('infoCard').appendChild(icon('info'));
    $('infoCard').title = t('info');
    $('infoCard').setAttribute('aria-label', t('info'));
    $('refsTitle').textContent = t('refsTitle');
    $('dropText').textContent = t('dropText');
    $('refModeRow').querySelector('[data-mode="sheet"]').textContent = t('refSheet');
    $('refModeRow').querySelector('[data-mode="inspire"]').textContent = t('refInspire');
    $('refModeRow').querySelector('[data-mode="sheet"]').title = t('refSheetNote');
    $('refModeRow').querySelector('[data-mode="inspire"]').title = t('refInspireNote');
    $('settingsLabel').textContent = t('settings');
    $('dockTitle').textContent = t('dockTitle');
    $('providerTitle').textContent = t('providerTitle');
    $('comfyUrlLabel').textContent = t('comfyUrlLabel');
    $('rememberLabel').textContent = t('remember');
    $('saveSettings').textContent = t('save');
    $('forgetKey').textContent = t('forget');
    $('copyPrompt').textContent = t('copy');
    $('waiting').textContent = t('waiting');
    $('waitingHint').textContent = t('waitingHint');
    $('undo').title = `${t('undo')} (Ctrl+Z)`;
    $('undo').setAttribute('aria-label', t('undo'));
    $('redo').title = `${t('redo')} (Ctrl+Shift+Z)`;
    $('redo').setAttribute('aria-label', t('redo'));
    $('historyLabel').textContent = t('steps');
    // Under the image: icons, with their name on hover and for screen readers.
    for (const [id, ico, key] of [['reuse', 'reuse', 'reuse'], ['deleteCard', 'trash', 'deleteCard'], ['download', 'download', 'download']]) {
      $(id).textContent = '';
      $(id).appendChild(icon(ico));
      $(id).title = t(key);
      $(id).setAttribute('aria-label', t(key));
    }
    $('sessionLabel').textContent = t('session');
    $('exportBtn').textContent = t('exportSession');
    $('importBtn').textContent = t('importSession');
    $('clearBtn').textContent = t('clearSession');
    $('sessionNote').textContent = t('sessionNote');
    $('langBtn').textContent = lang === 'fr' ? 'EN' : 'FR';
    $('generate').title = `${t('generate')} (Ctrl+Enter)`;
    setBusy(state.busy);
  }

  function toggleLang() {
    lang = lang === 'fr' ? 'en' : 'fr';
    try {
      localStorage.setItem('cd-lang', lang);
    } catch (err) {
      /* storage can be blocked, the page still works */
    }
    applyTexts();
    renderControls();
    renderPresets();
    renderModels();
    renderAdvanced();
    renderRefs();
    renderSettings();
    syncSuffix();
    syncCost();
    refreshStatus();
  }

  /* ---------- Start ---------- */

  // Thumbnails made by tools/previews.js: "menu/option" -> image, used where options.json gives none.
  async function loadPreviews() {
    let list = {};
    try {
      const res = await fetch('previews/previews.json', { cache: 'no-cache' });
      if (res.ok) list = await res.json();
    } catch (err) {
      return;
    }
    for (const [key, file] of Object.entries(list || {})) {
      if (typeof file !== 'string' || !/^previews\/[\w.-]+\.(png|webp|jpg)$/.test(file)) continue;
      const [groupId, optionId] = key.split('/');
      // "model/<id>": the base character made with that model, for the models panel.
      if (groupId === 'model') {
        const m = state.cfg.models.models.find((x) => x.id === optionId);
        if (m && !m.img) m.img = file;
        continue;
      }
      // "preset/<id>": the picture of that inspiration.
      if (groupId === 'preset') {
        const preset = state.cfg.presets.find((x) => x.id === optionId);
        if (preset && !preset.img) preset.img = file;
        continue;
      }
      const group = state.cfg.options.groups.find((g) => g.id === groupId);
      const option = group && group.options.find((o) => o.id === optionId);
      if (option && !option.img) option.img = file;
    }
  }

  /* ---------- Guide: a short tour for newcomers (first visit, then the ? button) ---------- */

  const TOUR = {
    en: {
      title: 'Guide',
      skip: 'Skip',
      prev: 'Back',
      next: 'Next',
      done: "Let's go",
      step: 'Step {n} of {total}',
      paused: 'The guide is paused. Click ? at the top right to pick it up again.',
      steps: [
        { h: 'Welcome to Kara', p: 'Kara makes a character sheet from simple menus, without writing a prompt. Four quick steps to your first image.' },
        {
          h: 'Where your images are made',
          p: 'Two ways. For free on your own machine, with ComfyUI (it needs a recent graphics card). Or online with an API key: no graphics card needed, each image is paid to the provider.',
          local: 'Free, on my machine',
          key: 'With an API key',
          ready: 'Ready: you can already generate with {p}.',
          none: 'Nothing is set up yet: choose one of the two buttons below.',
        },
        { h: 'Build the character', p: 'Each menu on the left shows pictures: click one to choose it. Short on ideas? Start from Inspirations or from Random, at the top.' },
        { h: 'Layout, look, background', p: 'Here you choose the model, the sheet layout (front, back and face, turnaround...), the look (photo, illustration, anime...) and the background.' },
        { h: 'Generate', p: 'Click here. Your image appears in the middle within seconds. Every image is kept in History and in the Gallery.' },
      ],
    },
    fr: {
      title: 'Guide',
      skip: 'Passer',
      prev: 'Précédent',
      next: 'Suivant',
      done: "C'est parti",
      step: 'Étape {n} sur {total}',
      paused: 'Le guide est en pause. Cliquez sur ? en haut à droite pour le reprendre.',
      steps: [
        { h: 'Bienvenue dans Kara', p: 'Kara fabrique une planche de personnage à partir de menus simples, sans écrire de prompt. Quatre étapes rapides jusqu’à votre première image.' },
        {
          h: 'Où vos images sont fabriquées',
          p: 'Deux possibilités. Gratuitement sur votre machine, avec ComfyUI (il faut une carte graphique récente). Ou en ligne avec une clé API : pas besoin de carte graphique, chaque image est payée au fournisseur.',
          local: 'Gratuit, sur ma machine',
          key: 'Avec une clé API',
          ready: 'Prêt : vous pouvez déjà générer avec {p}.',
          none: 'Rien n’est encore réglé : choisissez l’un des deux boutons ci-dessous.',
        },
        { h: 'Composez le personnage', p: 'Chaque menu à gauche montre des images : cliquez sur l’une d’elles pour la choisir. Pas d’idée ? Partez d’une Inspiration ou du bouton Au hasard, en haut.' },
        { h: 'Mise en page, look, fond', p: 'Ici, vous choisissez le modèle, la mise en page de la planche (face, dos et visage, turnaround...), le look (photo, illustration, anime...) et le fond.' },
        { h: 'Générez', p: 'Cliquez ici. Votre image apparaît au centre en quelques secondes. Chaque image est gardée dans l’Historique et la Galerie.' },
      ],
    },
  };
  // What each step points at (null: the middle of the screen).
  const TOUR_TARGETS = [null, '#provMenu', '#controls', '#dock .dock-block', '#generate'];
  let tourStep = 0;

  function tourText() {
    return TOUR[lang] || TOUR.en;
  }

  // Providers that can make an image right now, by name.
  function readyProviders() {
    const out = [];
    if (state.comfyOk && hasKeyFor('local')) out.push(inSentence('local'));
    for (const p of ['router', 'kie', 'fal', 'magnific']) if (hasKeyFor(p) && (state.cfg.settings || {}).providers && state.cfg.settings.providers.includes(p)) out.push(shortName(p));
    return out;
  }

  function buildTour() {
    if ($('tour')) return;
    const box = document.createElement('div');
    box.id = 'tour';
    box.className = 'tour';
    box.hidden = true;
    box.innerHTML = '<div class="tour-hole" id="tourHole"></div><div class="tour-card" id="tourCard" role="dialog" aria-modal="true" aria-labelledby="tourTitle"><p class="mono" id="tourStep"></p><h3 id="tourTitle"></h3><p class="tour-text" id="tourText"></p><p class="tour-status" id="tourStatus" hidden></p><div class="tour-choices" id="tourChoices" hidden><button type="button" class="ghost small" id="tourLocal"></button><button type="button" class="ghost small" id="tourKey"></button></div><div class="tour-actions"><button type="button" class="ghost small" id="tourSkip"></button><span class="tour-dots" id="tourDots"></span><button type="button" class="ghost small" id="tourPrev"></button><button type="button" class="primary small" id="tourNext"></button></div></div>';
    document.body.appendChild(box);
    $('tourSkip').addEventListener('click', () => endTour(true));
    $('tourPrev').addEventListener('click', () => showTourStep(tourStep - 1));
    $('tourNext').addEventListener('click', () => (tourStep >= TOUR_TARGETS.length - 1 ? endTour(true) : showTourStep(tourStep + 1)));
    // The two ways to make images open Keys on the right card; the guide waits behind the ? button.
    const openKeysOn = (p) => {
      endTour(false);
      store('cd-tour-step', String(Math.min(tourStep + 1, TOUR_TARGETS.length - 1)));
      pendingProvider = p;
      renderSettings();
      $('settingsMenu').open = true;
      loadBalances();
      $('settingsResult').textContent = tourText().paused;
    };
    $('tourLocal').addEventListener('click', () => openKeysOn('local'));
    // Clicking Generate on the last step is the end of the guide.
    $('generate').addEventListener('click', () => {
      if (!$('tour').hidden) endTour(true);
    });
    $('tourKey').addEventListener('click', () => openKeysOn('router'));
    document.addEventListener('keydown', (e) => {
      if ($('tour').hidden) return;
      if (e.key === 'Escape') endTour(true);
      if (e.key === 'ArrowRight') $('tourNext').click();
      if (e.key === 'ArrowLeft' && tourStep > 0) $('tourPrev').click();
    });
    window.addEventListener('resize', () => {
      if (!$('tour').hidden) placeTour();
    });
  }

  function placeTour() {
    const sel = TOUR_TARGETS[tourStep];
    const el = sel ? document.querySelector(sel) : null;
    const hole = $('tourHole');
    const card = $('tourCard');
    const W = window.innerWidth;
    const H = window.innerHeight;
    const cw = Math.min(420, W - 32);
    card.style.width = `${cw}px`;
    if (!el) {
      hole.hidden = true;
      $('tour').classList.add('dim');
      card.style.left = `${(W - cw) / 2}px`;
      card.style.top = `${Math.max(16, (H - card.offsetHeight) / 2)}px`;
      return;
    }
    $('tour').classList.remove('dim');
    hole.hidden = false;
    const r = el.getBoundingClientRect().toJSON();
    // The menus column runs under the bottom bar: light up only what is above it.
    if (sel === '#controls') r.bottom = Math.min(r.bottom, $('dock').getBoundingClientRect().top - 10);
    r.height = r.bottom - r.top;
    const pad = 8;
    const top = Math.max(6, r.top - pad);
    const left = Math.max(6, r.left - pad);
    const bottom = Math.min(H - 6, r.bottom + pad);
    const right = Math.min(W - 6, r.right + pad);
    Object.assign(hole.style, { left: `${left}px`, top: `${top}px`, width: `${right - left}px`, height: `${bottom - top}px` });
    // The card goes where there is room: right of a tall column, else below, else above.
    const ch = card.offsetHeight;
    let x;
    let y;
    if (r.height > H * 0.5 && W - right > cw + 24) {
      x = right + 16;
      y = Math.min(Math.max(16, r.top), H - ch - 16);
    } else if (H - bottom > ch + 24) {
      y = bottom + 14;
      x = r.left + r.width / 2 - cw / 2;
    } else {
      y = top - ch - 14;
      x = r.left + r.width / 2 - cw / 2;
    }
    card.style.left = `${Math.min(Math.max(16, x), W - cw - 16)}px`;
    card.style.top = `${Math.min(Math.max(16, y), H - ch - 16)}px`;
  }

  function showTourStep(n) {
    buildTour();
    const T = tourText();
    tourStep = Math.max(0, Math.min(n, TOUR_TARGETS.length - 1));
    const s = T.steps[tourStep];
    for (const d of document.querySelectorAll('details[open]')) d.open = false;
    $('tourStep').textContent = `// ${T.step.replace('{n}', tourStep + 1).replace('{total}', TOUR_TARGETS.length)}`;
    $('tourTitle').textContent = s.h;
    $('tourText').textContent = s.p;
    const where = tourStep === 1;
    $('tourChoices').hidden = !where;
    $('tourStatus').hidden = !where;
    if (where) {
      const ready = readyProviders();
      $('tourStatus').textContent = ready.length ? s.ready.replace('{p}', ready.join(', ')) : s.none;
      $('tourStatus').classList.toggle('ok', ready.length > 0);
      $('tourLocal').textContent = s.local;
      $('tourKey').textContent = s.key;
      // Online there is no ComfyUI of your own to reach.
      $('tourLocal').hidden = !(state.cfg.settings || {}).editable;
    }
    $('tourSkip').textContent = T.skip;
    $('tourPrev').textContent = T.prev;
    $('tourPrev').hidden = tourStep === 0;
    $('tourNext').textContent = tourStep === TOUR_TARGETS.length - 1 ? T.done : T.next;
    $('tourDots').textContent = '';
    for (let i = 0; i < TOUR_TARGETS.length; i++) {
      const dot = document.createElement('i');
      if (i === tourStep) dot.className = 'on';
      $('tourDots').appendChild(dot);
    }
    $('tour').hidden = false;
    placeTour();
    $('tourNext').focus();
  }

  function endTour(finished) {
    if ($('tour')) $('tour').hidden = true;
    store('cd-tour-done', '1');
    if (finished) store('cd-tour-step', '0');
  }

  function startTour() {
    showTourStep(Number(read('cd-tour-step')) || 0);
  }

  /* ---------- Tooltips: at once on hover, in the app's own style (instead of the browser's, slow and grey) ---------- */

  function setupTips() {
    const tip = document.createElement('div');
    tip.className = 'tip';
    tip.setAttribute('role', 'tooltip');
    tip.hidden = true;
    document.body.appendChild(tip);
    // Every title becomes data-tip, now and whenever the page sets one later, so the browser never shows its own.
    const take = (el) => {
      const text = el.getAttribute('title');
      if (text === null) return;
      el.removeAttribute('title');
      if (text) el.dataset.tip = text;
      else delete el.dataset.tip;
      if (text && !el.getAttribute('aria-label') && !el.textContent.trim()) el.setAttribute('aria-label', text);
      if (el === current) show(el);
    };
    let current = null;
    const show = (el) => {
      current = el;
      const text = el.dataset.tip;
      if (!text) {
        tip.hidden = true;
        return;
      }
      tip.textContent = text;
      tip.hidden = false;
      const r = el.getBoundingClientRect();
      const w = tip.offsetWidth;
      const h = tip.offsetHeight;
      let top = r.bottom + 8;
      if (top + h > window.innerHeight - 8) top = r.top - h - 8;
      const left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
      tip.style.left = `${left}px`;
      tip.style.top = `${Math.max(8, top)}px`;
    };
    document.addEventListener('toggle', (e) => { if (e.target.open) { current = null; tip.hidden = true; } }, true);
    const hide = () => {
      current = null;
      tip.hidden = true;
    };
    for (const el of document.querySelectorAll('[title]')) take(el);
    new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === 'attributes' && m.target.nodeType === 1) take(m.target);
        else for (const n of m.addedNodes) if (n.nodeType === 1) {
          if (n.hasAttribute('title')) take(n);
          for (const el of n.querySelectorAll('[title]')) take(el);
        }
      }
    }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['title'] });
    document.addEventListener('pointerover', (e) => {
      const el = e.target.closest && e.target.closest('[data-tip]');
      if (el && el !== current && e.pointerType !== 'touch') show(el);
      else if (!el && current) hide();
    });
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('keydown', hide, true);
    window.addEventListener('scroll', hide, true);
  }

  /* ---------- Usage counter shared by the Dash Dash tools (api.dashdash.design) ---------- */

  // Online version only: one visit per tab and one line per image, with its provider.
  // No cookie, no identifier, no key, no prompt, no image. Copies on your own machine never count.
  const STATS_URL = 'https://api.dashdash.design/e';

  function trackUsage(kind, extra = {}) {
    try {
      if (location.hostname !== 'kara.dashdash.design') return;
      const body = JSON.stringify({ ...extra, kind, lang, tool: 'kara' });
      if (navigator.sendBeacon) navigator.sendBeacon(STATS_URL, new Blob([body], { type: 'text/plain' }));
      else fetch(STATS_URL, { method: 'POST', body, keepalive: true, headers: { 'content-type': 'text/plain' } }).catch(() => {});
    } catch (err) {
      // Counting must never break the app.
    }
  }

  function trackVisit() {
    try {
      if (sessionStorage.getItem('cd-visit-counted')) return;
      sessionStorage.setItem('cd-visit-counted', '1');
    } catch (err) {
      // Private mode without storage: still count the visit.
    }
    trackUsage('visit');
  }

  async function init() {
    trackVisit();
    setupTips();
    applyTexts();
    try {
      state.cfg = await api('/api/config');
    } catch (err) {
      showError(err.message);
      return;
    }
    await loadPreviews();
    state.selection = { ...state.cfg.options.defaults };
    const savedModel = modelById(read('cd-model'));
    useModel(savedModel && readyProvidersOf(savedModel).length ? savedModel.id : state.cfg.models.default);
    try {
      const r = JSON.parse(read('cd-render') || 'null');
      if (r && typeof r === 'object') state.render = { ...state.render, ...r };
    } catch (err) {
      /* default render */
    }
    const savedMode = read('cd-seed-mode');
    if (['random', 'fixed', 'inc', 'dec'].includes(savedMode)) state.seedMode = savedMode;
    $('seedMode').value = state.seedMode;
    for (const [id, name] of [['modelPop', 'chip'], ['ratioPop', 'ratio'], ['resPop', 'grid'], ['guidePop', 'face'], ['extraPop', 'pencil'], ['seedPop', 'dice']]) {
      const sum = $(id).querySelector('summary');
      const words = document.createElement('span');
      words.className = 'words';
      words.append(...sum.childNodes);
      sum.append(icon(name), words);
    }
    $('seedDice').textContent = '';
    $('seedDice').appendChild(icon('dice'));
    state.name = read('cd-name') || '';
    $('charName').value = state.name;
    renderModels();
    renderAdvanced();
    renderRefs();
    renderSettings();
    setupDock();
    setupDockFit();
    syncTileSize();
    if (state.cfg.settings && state.cfg.settings.editable) checkUpdate();
    syncCost();
    loadBalances();
    $('settingsMenu').addEventListener('toggle', () => {
      if ($('settingsMenu').open) loadBalances();
    });
    // One open menu at a time on the left (also for browsers that ignore the shared name).
    let openMenu = null;
    $('controls').addEventListener('toggle', (e) => {
      if (!e.target.open) return;
      for (const d of $('controls').querySelectorAll('details[open]')) if (d !== e.target) d.open = false;
      if (!e.target.matches('details.group')) return;
      // The menu that closes above may still be shrinking (animated in Chrome, instant in Safari):
      // what is left to shrink is its height now minus its closed height, measured now, so the
      // column moves once, to the right place, in every browser.
      const prev = openMenu && openMenu !== e.target && !openMenu.open ? openMenu : null;
      const above = prev && prev.compareDocumentPosition(e.target) & Node.DOCUMENT_POSITION_FOLLOWING;
      const head = prev ? prev.querySelector(':scope > summary') : null;
      const shrink = above && head ? Math.max(0, prev.getBoundingClientRect().height - head.getBoundingClientRect().height) : 0;
      openMenu = e.target;
      revealMenu(e.target, shrink);
    }, true);
    setupViewer();
    setupCardInfo();
    $('galleryBtn').addEventListener('click', openGallery);
    $('randomBtn').addEventListener('click', randomCharacter);
    $('galleryClose').addEventListener('click', closeGallery);
    $('favCard').addEventListener('click', () => {
      const item = state.history[state.view];
      if (item) toggleFav(item);
    });
    $('galleryGroup').addEventListener('click', () => {
      galleryGrouped = !galleryGrouped;
      store('cd-group', galleryGrouped ? '1' : '0');
      renderGallery();
    });
    state.batch = Math.max(1, Math.min(4, Number(read('cd-batch')) || 1));
    $('batch').value = String(state.batch);
    $('batch').addEventListener('change', () => {
      state.batch = Math.max(1, Math.min(4, Number($('batch').value) || 1));
      store('cd-batch', String(state.batch));
      syncCost();
    });
    for (const b of $('galleryFilter').querySelectorAll('button')) {
      b.addEventListener('click', () => {
        galleryFilter = b.dataset.filter;
        renderGallery();
      });
    }
    $('saveSettings').addEventListener('click', saveSettings);
    $('forgetKey').addEventListener('click', forgetKey);
    $('installModel').addEventListener('click', installModel);
    $('refFile').addEventListener('change', (e) => {
      addRefs([...e.target.files]);
      e.target.value = '';
    });
    const zone = $('dropzone');
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('over');
      addRefs([...e.dataTransfer.files]);
    });
    for (const b of $('refModeRow').querySelectorAll('button')) {
      b.addEventListener('click', () => {
        state.refMode = b.dataset.mode;
        renderRefs();
        schedulePreview();
      });
    }
    const saved = read('cd-settings');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        state.selection = { ...state.cfg.options.defaults, ...s.selection };
        state.custom = s.custom || {};
        state.extra = s.extra || '';
        state.activePreset = s.activePreset || null;
        $('extra').value = state.extra;
      } catch (err) {
        /* broken saved settings: start from the defaults */
      }
    }
    renderPresets();
    renderControls();
    state.steps = [{ snap: snapshot(), text: t(saved ? 'resumed' : 'start'), time: Date.now() }];
    state.pos = 0;
    syncSteps();
    loadSession();
    window.addEventListener('resize', applyLayout);
    applyLayout();
    sizeName();
    $('charName').addEventListener('input', () => {
      sizeName();
      state.name = $('charName').value;
      store('cd-name', state.name);
    });
    $('charName').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') $('charName').blur();
    });
    $('advancedBtn').addEventListener('click', () => {
      state.render.on = !state.render.on;
      renderAdvanced();
      syncCost();
      schedulePreview();
    });
    $('seedDown').addEventListener('click', () => setSeed(Number($('seed').value || 0) - 1));
    $('seedUp').addEventListener('click', () => setSeed(Number($('seed').value || 0) + 1));
    $('seedDice').addEventListener('click', () => setSeed(Math.floor(Math.random() * 4294967296)));
    $('seed').addEventListener('input', () => {
      if (state.seedMode === 'random' && $('seed').value !== '') setSeedMode('fixed');
      syncSeedChip();
    });
    $('seedMode').addEventListener('change', () => setSeedMode($('seedMode').value));
    $('deleteCard').addEventListener('click', deleteCard);
    $('exportBtn').addEventListener('click', exportSession);
    $('importBtn').addEventListener('click', () => {
      $('sessionMenu').open = false;
      $('importFile').click();
    });
    $('importFile').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) importSession(file);
      e.target.value = '';
    });
    $('clearBtn').addEventListener('click', clearSession);
    $('undo').addEventListener('click', undo);
    $('redo').addEventListener('click', redo);
    $('prev').addEventListener('click', previous);
    $('next').addEventListener('click', next);
    $('reuse').addEventListener('click', reuseCard);
    $('compareGuide').addEventListener('click', () => syncCompare(state.history[state.view], $('compareGuide').getAttribute('aria-pressed') !== 'true'));
    document.addEventListener('keydown', (e) => {
      const typing = e.target.closest && e.target.closest('input, textarea, select, [contenteditable]');
      if (!$('viewer').hidden) return viewerKeys(e);
      if ($('faceEditor') && !$('faceEditor').hidden) {
        if (e.key === 'Escape') closeFaceEditor();
        // V switches front and profile, S the drawing style.
        else if (!typing && !e.ctrlKey && !e.metaKey && !e.altKey && /^[vs]$/i.test(e.key)) {
          e.preventDefault();
          if (e.key.toLowerCase() === 'v') {
            faceView = faceView === 'profile' ? 'front' : 'profile';
            store('cd-face-view', faceView);
          } else {
            faceStyle = faceStyle === 'plate' ? 'avatar' : 'plate';
            store('cd-face-style', faceStyle);
          }
          syncControls();
        }
        return;
      }
      if (e.key === 'Escape' && !$('gallery').hidden) {
        closeGallery();
        return;
      }
      if (!$('gallery').hidden) return;
      if (e.key === 'Escape') {
        $('inspirations').open = $('sessionMenu').open = $('historyMenu').open = $('settingsMenu').open = false;
        for (const d of document.querySelectorAll('#dock details[open]')) d.open = false;
      }
      // Ctrl (or Cmd) + Enter generates, even while typing, like most AI tools.
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (typingTimer) commit(t('edit'));
        generate();
        return;
      }
      // Ctrl+K or "/" goes to the search.
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (!typing && e.key === '/')) {
        e.preventDefault();
        if ($('menuSearch')) $('menuSearch').focus();
        return;
      }
      if (typing) return;
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && key === 'z') || key === 'y')) {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.key === 'ArrowLeft' && !e.altKey) {
        previous();
      } else if (e.key === 'ArrowRight' && !e.altKey) {
        next();
      }
    });
    document.addEventListener('click', (e) => {
      // A button that re-drew its own menu is no longer in the page: that click was inside, keep menus open.
      if (!e.target.isConnected) return;
      // Only the bar's own menus: a folded group inside the models panel keeps its state.
      if (!e.target.closest('#dock details.pop')) for (const d of document.querySelectorAll('#dock details.pop[open]')) d.open = false;
      if (!e.target.closest('#inspirations')) $('inspirations').open = false;
      if (!e.target.closest('#historyMenu')) $('historyMenu').open = false;
      if (!e.target.closest('#sessionMenu')) $('sessionMenu').open = false;
      if (!e.target.closest('#settingsMenu')) $('settingsMenu').open = false;
    });
    $('extra').after(clearButton(() => {
      $('extra').value = '';
      $('extra').dispatchEvent(new Event('input'));
    }));
    const growExtra = () => {
      // Chrome grows it by itself (field-sizing); other browsers get the same from here.
      if (CSS.supports('field-sizing', 'content')) return;
      $('extra').style.height = 'auto';
      $('extra').style.height = `${Math.min(140, Math.max(48, $('extra').scrollHeight + 2))}px`;
    };
    $('extra').addEventListener('input', (e) => {
      growExtra();
      state.extra = e.target.value;
      syncExtraChip();
      schedulePreview();
      commitSoon(() => `${t('extraLabel').replace(/^\/\/\s*/, '')}${colon()}${state.extra.trim() ? quote(state.extra) : t('cleared')}`);
    });
    $('generate').addEventListener('click', generate);
    $('copyPrompt').addEventListener('click', copyPrompt);
    $('cancel').addEventListener('click', cancel);
    $('langBtn').addEventListener('click', toggleLang);
    $('aboutBtn').addEventListener('click', openAbout);
    $('about').addEventListener('click', (e) => {
      if (e.target === $('about')) $('about').close();
    });
    setupSideScroll();
    refreshPreview();
    refreshStatus();
    setInterval(refreshStatus, 6000);
    // The guide: on the first visit (once the status is known), then from the ? button.
    $('guideBtn').addEventListener('click', startTour);
    $('guideBtn').title = tourText().title;
    if (!read('cd-tour-done')) setTimeout(startTour, 1200);
  }

  init();
})();
