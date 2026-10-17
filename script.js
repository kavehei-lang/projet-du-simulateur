"use strict";
// "use strict" : active un mode plus sévère de JavaScript.
// Il signale des erreurs (ex : variable non déclarée) au lieu de les ignorer.

/* ============================================================
   1. LES DONNÉES : le tableau des épreuves
   ============================================================
   Source : Journal officiel du 10 juillet 2024, BTS SIO option B (SLAM).
   - "matieres" est un TABLEAU [ ... ] qui contient des OBJETS { ... }.
   - Chaque objet décrit une épreuve avec 4 propriétés :
       nom   : le nom affiché (texte)
       coef  : le coefficient (nombre)
       type  : "ccf" (contrôle en cours de formation) ou "ponctuelle" (examen final)
       note  : la note de l'étudiant. null = "pas encore de note".
   - On utilise const car le tableau lui-même ne sera jamais remplacé
     (mais on pourra modifier le contenu des objets à l'intérieur). */
const matieres = [
  { nom: "E1 - Culture générale et expression",                 coef: 2, type: "ponctuelle", note: null },
  { nom: "E2 - Expression et communication en langue anglaise", coef: 2, type: "ponctuelle", note: null },
  { nom: "E3 - Mathématiques pour l'informatique",              coef: 3, type: "ccf",        note: null },
  { nom: "E4 - Culture économique, juridique et managériale",   coef: 3, type: "ponctuelle", note: null },
  { nom: "E5 - Support et mise à disposition de services",      coef: 4, type: "ccf",        note: null },
  { nom: "E6 - Conception et développement d'applications",     coef: 4, type: "ccf",        note: null },
  { nom: "E7 - Cybersécurité des services informatiques",       coef: 4, type: "ponctuelle", note: null }
];

/* Données du RATTRAPAGE (voir la section 5 en bas du fichier).
   - notesRattrapage est un objet qui associe le NOM d'une épreuve à sa note de rattrapage.
     Exemple : { "E1 - Culture générale et expression": 12 }
     Il est vide au départ : aucun rattrapage n'a encore été saisi.
   - SEUIL_RATTRAPAGE : moyenne en dessous de laquelle le rattrapage est autorisé.
   HYPOTHÈSE : le sujet ne fixe pas ces règles, elles sont regroupées ici
   pour pouvoir être modifiées facilement. */
const notesRattrapage = {};
const SEUIL_RATTRAPAGE = 10;

/* ============================================================
   2. LE DÉMARRAGE : tout ce qui se passe au chargement de la page
   ============================================================
   "DOMContentLoaded" est un événement qui se déclenche quand le HTML
   est entièrement chargé. On attend ce moment pour être sûr que les
   éléments (boutons, tableau...) existent avant de les utiliser. */
document.addEventListener("DOMContentLoaded", () => {

  // --- Étape A : récupérer les éléments HTML grâce à leur id ---
  // getElementById("x") cherche dans la page la balise qui a id="x".
  const selectMatiere = document.getElementById("selectMatiere"); // la liste déroulante
  const inputNote     = document.getElementById("inputNote");     // le champ de saisie de la note
  const tbodyMatieres = document.getElementById("tbodyMatieres"); // le corps du tableau
  const spanMoyenne   = document.getElementById("spanMoyenne");   // où afficher la moyenne
  const spanMention   = document.getElementById("spanMention");   // où afficher la mention
  const btnAjouter    = document.getElementById("btnAjouter");    // bouton "Ajouter / Modifier"
  const btnCalculer   = document.getElementById("btnCalculer");   // bouton "Calculer"
  const btnReset      = document.getElementById("btnReset");      // bouton "Réinitialiser"

  // --- Étape B : préparer la page ---
  initialiserSelectMatieres(selectMatiere); // Q1 : remplit la liste déroulante
  afficherTableau(tbodyMatieres);           // Q2 : affiche le tableau (notes vides au départ)

  // --- Étape C : réagir aux clics sur les boutons ---
  // addEventListener("click", fonction) = "quand on clique, exécute cette fonction".

  // Q3 : clic sur "Ajouter / Modifier la note"
  btnAjouter.addEventListener("click", () => {
    // inputNote.value est TOUJOURS du texte, même pour un champ "number".
    // parseFloat le transforme en nombre (ex : "12.5" devient 12.5).
    const noteValeur = parseFloat(inputNote.value);

    // selectMatiere.value = le nom de la matière choisie dans la liste.
    // ajouterNote renvoie true si tout va bien, false si la note est invalide.
    const noteEstValide = ajouterNote(selectMatiere.value, noteValeur);

    if (noteEstValide) {
      afficherTableau(tbodyMatieres); // on redessine le tableau avec la nouvelle note
      inputNote.value = "";           // on vide le champ pour la prochaine saisie
    } else {
      alert("Note invalide : saisissez un nombre entre 0 et 20.");
    }
  });

  // Q4 : clic sur "Calculer la moyenne"
  btnCalculer.addEventListener("click", () => {
    const resultat = calculerMoyenneGenerale();

    // La fonction renvoie null s'il manque des notes : on prévient l'utilisateur.
    if (resultat === null) {
      alert("Toutes les épreuves doivent avoir une note pour calculer la moyenne.");
      return; // return arrête la fonction ici : le code en dessous n'est pas exécuté
    }

    // toFixed(2) arrondit à 2 décimales (et renvoie du texte, ex : "12.35").
    // textContent change le texte affiché dans la balise <span>.
    spanMoyenne.textContent = resultat.moyenne.toFixed(2);
    spanMention.textContent = resultat.mention;
  });

  // Q5 : clic sur "Réinitialiser"
  btnReset.addEventListener("click", () => {
    resetNotes();                    // remet toutes les notes à null (dans les données)
    afficherTableau(tbodyMatieres);  // redessine le tableau (donc affiche des "—")
    spanMoyenne.textContent = "—";   // efface la moyenne affichée
    spanMention.textContent = "—";   // efface la mention affichée
    inputNote.value = "";            // vide le champ de saisie
  });
});

/* ============================================================
   3. LES FONCTIONS
   ============================================================ */

/**
 * Q1 - Remplit la liste déroulante avec les matières.
 * @param {HTMLSelectElement} selectElement - la liste <select> à remplir
 */
function initialiserSelectMatieres(selectElement) {
  // "for...of" parcourt le tableau : à chaque tour, "matiere" est l'épreuve suivante.
  for (const matiere of matieres) {
    // Étape 1 : créer une balise <option> (elle existe en mémoire, pas encore dans la page)
    const option = document.createElement("option");

    // Étape 2 : lui donner une valeur (utilisée par le code) et un texte (vu par l'utilisateur)
    option.value = matiere.nom;
    option.textContent = matiere.nom;

    // Étape 3 : l'ajouter dans le <select> pour qu'elle apparaisse dans la page
    selectElement.appendChild(option);
  }
}

/**
 * Q2 - Affiche le tableau récapitulatif de toutes les matières.
 * @param {HTMLTableSectionElement} tbodyElement - le <tbody> à remplir
 */
function afficherTableau(tbodyElement) {
  // On vide le tableau avant de le reconstruire.
  // Sinon, à chaque appel, les lignes s'additionneraient (doublons).
  tbodyElement.innerHTML = "";

  for (const matiere of matieres) {
    // Créer une ligne <tr>
    const ligne = document.createElement("tr");

    // Est-ce qu'une note a été saisie ? (null signifie "non")
    const aUneNote = matiere.note !== null;

    // Y a-t-il une note de rattrapage pour cette épreuve ? (undefined = non)
    const noteRattr = notesRattrapage[matiere.nom];
    const aUnRattrapage = noteRattr !== undefined;

    // Les 6 valeurs à afficher, dans l'ordre des colonnes.
    // L'opérateur ternaire "condition ? siVrai : siFaux" est un "if" en version courte.
    const valeurs = [
      matiere.nom,                                          // colonne 1 : Matière
      matiere.type === "ccf" ? "CCF" : "Ponctuelle",        // colonne 2 : Type
      matiere.coef,                                         // colonne 3 : Coef
      aUneNote ? matiere.note : "—",                        // colonne 4 : Note (ou "—")
      aUnRattrapage ? noteRattr : "—",                      // colonne 5 : Note de rattrapage (ou "—")
      // colonne 6 : Points, calculés avec la note RETENUE (la meilleure des deux)
      aUneNote ? (noteRetenue(matiere) * matiere.coef).toFixed(2) : "—"
    ];

    // Pour chaque valeur, créer une cellule <td> et la mettre dans la ligne
    for (const valeur of valeurs) {
      const cellule = document.createElement("td");
      cellule.textContent = valeur;
      ligne.appendChild(cellule);
    }

    // Une fois la ligne complète, l'ajouter au tableau
    tbodyElement.appendChild(ligne);
  }
}

/**
 * Q3 - Enregistre la note d'une matière.
 * @param {string} nomMatiere - nom de la matière choisie
 * @param {number} noteValeur - note saisie
 * @returns {boolean} true si la note est enregistrée, false sinon
 */
function ajouterNote(nomMatiere, noteValeur) {
  // VALIDATION : on refuse si ce n'est pas un nombre (NaN = "Not a Number"),
  // ou si la note est en dessous de 0, ou au-dessus de 20.
  // "||" signifie "OU" : une seule condition vraie suffit pour refuser.
  if (Number.isNaN(noteValeur) || noteValeur < 0 || noteValeur > 20) {
    return false;
  }

  // find() parcourt le tableau et renvoie le PREMIER objet qui respecte la condition.
  // Ici : l'épreuve dont le nom est égal à nomMatiere.
  const matiere = matieres.find((m) => m.nom === nomMatiere);

  // Si rien n'a été trouvé, find renvoie undefined : on s'arrête.
  if (matiere === undefined) {
    return false;
  }

  // On modifie la propriété "note" de l'objet trouvé.
  // Comme l'objet est dans le tableau "matieres", le tableau est aussi mis à jour.
  matiere.note = noteValeur;
  return true;
}

/**
 * Détermine la mention à partir d'une moyenne.
 * CORRECTION : ce code était dans calculerMoyenneGenerale. Je l'ai isolé dans une
 * fonction pour pouvoir le réutiliser aussi dans mettreAJourMoyenne (options),
 * sans le recopier deux fois.
 * @param {number} moyenne - la moyenne sur 20
 * @returns {string} la mention
 */
function determinerMention(moyenne) {
  // On teste du plus bas au plus haut :
  // dès qu'une condition est vraie, les suivantes sont ignorées.
  if (moyenne < 10) {
    return "Non admis";
  } else if (moyenne < 12) {
    return "Aucune";
  } else if (moyenne < 14) {
    return "Assez bien";
  } else if (moyenne < 16) {
    return "Bien";
  } else {
    return "Très bien";
  }
}

/**
 * Q4 - Calcule la moyenne pondérée et la mention.
 * CHOIX : si une note manque, on bloque le calcul (on renvoie null),
 * car le diplôme se calcule sur toutes les épreuves obligatoires.
 * @returns {{ moyenne: number, mention: string } | null}
 */
function calculerMoyenneGenerale() {
  // Le calcul détaillé est dans calculerMoyenne (plus bas dans le fichier).
  // true = on tient compte des notes de rattrapage (et des options facultatives).
  const moyenne = calculerMoyenne(true);

  // null = il manque au moins une note : on bloque le calcul.
  if (moyenne === null) {
    return null;
  }

  // La mention est déterminée par la fonction déterminerMention ci-dessus.
  const mention = determinerMention(moyenne);

  // On renvoie un objet avec les deux résultats.
  return { moyenne, mention }; // raccourci pour { moyenne: moyenne, mention: mention }
}

/**
 * Q5 - Remet toutes les notes à null.
 */
function resetNotes() {
  for (const matiere of matieres) {
    matiere.note = null;
  }
  effacerRattrapage(); // les notes de rattrapage n'ont plus de sens sans les notes de départ
}

/* ============================================================
   4. LES OPTIONS FACULTATIVES
   ============================================================
   Règle : on peut choisir UNE option parmi LV2, Maths approfondies et
   Certification (liste déroulante), en plus de l'Engagement étudiant
   (case à cocher). Chaque option a sa propre note et son coefficient.
   IMPORTANT (note (**) du tableau officiel) : pour les épreuves facultatives,
   SEULS LES POINTS AU-DESSUS DE 10 SONT PRIS EN COMPTE. Ce sont donc des
   points BONUS (voir calculerPointsBonus) : ils s'ajoutent au total,
   mais ne changent pas le diviseur et ne peuvent jamais faire baisser la moyenne. */

/* Tableau des options, sous forme d'OBJET : chaque clé (lv2, maths...)
   correspond à la "value" des éléments du HTML.
   On utilise const car l'objet lui-même ne sera jamais remplacé. */
const optionsFacultatives = {
  lv2:           { nom: "Langue vivante 2",                       coef: 1 },
  maths:         { nom: "Mathématiques approfondies",             coef: 1 },
  certification: { nom: "Parcours de certification complémentaire", coef: 1 },
  engagement:    { nom: "Engagement étudiant",                    coef: 1 }
};

/* Récupération des éléments HTML liés aux options.
   CORRECTION : le code d'origine cherchait des cases ".option-unique" qui
   n'existent pas dans le HTML (on y a une liste déroulante #selectOption).
   Comme une liste déroulante ne permet qu'un seul choix, plus besoin de
   décocher les autres cases à la main. */
const selectOption     = document.getElementById("selectOption"); // liste : LV2 / Maths / Certification
const caseEngagement   = document.getElementById("engagement");   // case à cocher : Engagement étudiant
const zoneNotesOptions = document.getElementById("notesOptions"); // zone où l'on affiche les champs note/coef

// Quand on change l'option dans la liste, ou qu'on coche/décoche l'engagement,
// on reconstruit les champs de saisie.
selectOption.addEventListener("change", afficherChampsOptions);
caseEngagement.addEventListener("change", afficherChampsOptions);

/**
 * Affiche, pour chaque option choisie, un champ "note" et un champ "coefficient".
 */
function afficherChampsOptions() {
  // Tableau des identifiants d'options choisies (ex : ["lv2", "engagement"]).
  const optionsChoisies = [];

  // Si l'utilisateur a choisi autre chose que "Aucune" (valeur vide), on l'ajoute.
  if (selectOption.value !== "") {
    optionsChoisies.push(selectOption.value);
  }

  // Si la case Engagement est cochée, on l'ajoute aussi.
  if (caseEngagement.checked) {
    optionsChoisies.push("engagement");
  }

  // On vide la zone avant de la reconstruire (sinon les champs s'accumulent).
  zoneNotesOptions.innerHTML = "";

  // Pour chaque option choisie, on crée un bloc avec deux champs.
  optionsChoisies.forEach((id) => {
    const option = optionsFacultatives[id]; // on retrouve l'objet { nom, coef } grâce à l'identifiant

    const ligne = document.createElement("div");

    // Les `backticks` permettent d'écrire du HTML sur plusieurs lignes
    // et d'y insérer des variables avec ${...}.
    // data-note-option / data-coef-option : attributs personnalisés qui
    // mémorisent à quelle option appartient chaque champ.
    ligne.innerHTML = `
      <label>
        Note de ${option.nom} sur 20 :
        <input type="number" min="0" max="20" step="0.25"
               data-note-option="${id}">
      </label>

      <label>
        Coefficient :
        <input type="number" min="0.5" step="0.5"
               value="${option.coef}" data-coef-option="${id}">
      </label>
    `;

    // On retrouve les deux champs qu'on vient de créer grâce à leur attribut data-...
    const champNote = ligne.querySelector(`[data-note-option="${id}"]`);
    const champCoef = ligne.querySelector(`[data-coef-option="${id}"]`);

    // "input" se déclenche à chaque frappe : la moyenne se met à jour en direct.
    champNote.addEventListener("input", mettreAJourMoyenne);
    champCoef.addEventListener("input", mettreAJourMoyenne);

    // On ajoute le bloc terminé dans la page.
    zoneNotesOptions.appendChild(ligne);
  });

  // Si on retire une option, la moyenne doit être recalculée sans elle.
  mettreAJourMoyenne();
}

/**
 * Calcule les POINTS BONUS des options facultatives.
 * Règle officielle (note (**) du tableau) : seuls les points au-dessus de 10 comptent.
 * Exemples (coef 1) : 14/20 donne (14 - 10) x 1 = 4 points bonus ; 8/20 donne 0 point (pas de malus).
 * @returns {number} le total de points bonus
 */
function calculerPointsBonus() {
  let bonus = 0; // compteur qui grossit à chaque option saisie

  // On parcourt tous les champs "note" présents dans la zone des options.
  zoneNotesOptions.querySelectorAll("[data-note-option]").forEach((champNote) => {
    const id = champNote.dataset.noteOption; // identifiant de l'option (lv2, maths...)
    const champCoef = zoneNotesOptions.querySelector(
      `[data-coef-option="${id}"]`
    );

    // Un champ vide ("") signifie "pas de note" : on ignore cette option.
    if (champNote.value !== "") {
      const note = Number(champNote.value); // Number() convertit le texte en nombre
      const coef = Number(champCoef.value);

      // Math.max(0, x) renvoie x s'il est positif, sinon 0 : c'est ce qui
      // empêche une mauvaise note d'option de faire baisser la moyenne.
      bonus += Math.max(0, note - 10) * coef;
    }
  });

  return bonus;
}

/**
 * Renvoie la note RETENUE d'une épreuve.
 * HYPOTHÈSE : si l'étudiant passe le rattrapage, on garde la MEILLEURE des deux notes.
 * (Pour retenir toujours la note de rattrapage, remplacer Math.max par "return rattrapage;")
 * @param {{nom: string, note: number}} matiere
 * @returns {number}
 */
function noteRetenue(matiere) {
  const rattrapage = notesRattrapage[matiere.nom]; // undefined si pas de rattrapage

  if (rattrapage === undefined) {
    return matiere.note; // pas de rattrapage : on garde la note d'origine
  }
  return Math.max(matiere.note, rattrapage);
}

/**
 * Calcule la moyenne générale (sans la mention).
 * Moyenne = (somme des note x coef + points bonus des options) / somme des coef des 7 épreuves.
 * Le diviseur ne contient PAS les options : ce sont de simples bonus.
 * @param {boolean} avecRattrapage - true : on utilise les notes retenues ; false : les notes d'origine
 * @returns {number|null} la moyenne, ou null s'il manque une note
 */
function calculerMoyenne(avecRattrapage) {
  // some() renvoie true si AU MOINS UNE matière a une note nulle.
  if (matieres.some((m) => m.note === null)) {
    return null;
  }

  // Deux "compteurs" qui vont grossir à chaque tour de boucle.
  let sommePoints = 0; // somme des (note x coef)
  let sommeCoef = 0;   // somme des coef

  for (const matiere of matieres) {
    const note = avecRattrapage ? noteRetenue(matiere) : matiere.note;
    sommePoints += note * matiere.coef; // += veut dire "ajoute à la valeur actuelle"
    sommeCoef += matiere.coef;
  }

  // On ajoute les points bonus des options (0 si aucune option saisie).
  sommePoints += calculerPointsBonus();

  // Moyenne pondérée = total des points / total des coefficients
  return sommePoints / sommeCoef;
}

/**
 * Met à jour l'affichage de la moyenne et de la mention.
 * Appelée à chaque modification d'une option ou d'un rattrapage.
 */
function mettreAJourMoyenne() {
  const resultat = calculerMoyenneGenerale(); // même calcul que le bouton "Calculer"

  // null = il manque des notes : on laisse l'affichage tel quel.
  if (resultat === null) {
    return;
  }

  document.getElementById("spanMoyenne").textContent = resultat.moyenne.toFixed(2);
  document.getElementById("spanMention").textContent = resultat.mention;
}

/* ============================================================
   5. LE RATTRAPAGE
   ============================================================
   HYPOTHÈSES (le sujet ne donne pas de règle précise, à faire valider par la prof) :
   1. Le rattrapage n'est possible que si la moyenne SANS rattrapage est < SEUIL_RATTRAPAGE (10).
   2. Seules les épreuves PONCTUELLES peuvent être repassées (un CCF se déroule
      en cours de formation, on ne peut pas le repasser).
   3. La note retenue est la meilleure des deux (voir noteRetenue). */

// Récupération des éléments HTML de la section Rattrapage.
const selectRattrapage     = document.getElementById("selectRattrapage");
const inputRattrapage      = document.getElementById("inputRattrapage");
const btnRattrapage        = document.getElementById("btnRattrapage");
const btnAnnulerRattrapage = document.getElementById("btnAnnulerRattrapage");

// Remplissage de la liste : uniquement les épreuves ponctuelles (hypothèse 2).
for (const matiere of matieres) {
  if (matiere.type === "ponctuelle") {
    const option = document.createElement("option");
    option.value = matiere.nom;
    option.textContent = matiere.nom;
    selectRattrapage.appendChild(option);
  }
}

// Clic sur "Enregistrer le rattrapage"
btnRattrapage.addEventListener("click", () => {
  // Moyenne AVANT rattrapage (false) pour savoir si l'étudiant y a droit.
  const moyenneInitiale = calculerMoyenne(false);

  if (moyenneInitiale === null) {
    alert("Saisissez d'abord les notes de toutes les épreuves.");
    return;
  }

  if (moyenneInitiale >= SEUIL_RATTRAPAGE) {
    alert(
      `Rattrapage non nécessaire : votre moyenne (${moyenneInitiale.toFixed(2)}) ` +
      `est déjà supérieure ou égale à ${SEUIL_RATTRAPAGE}.`
    );
    return;
  }

  // Même validation que pour une note normale (voir ajouterNote).
  const note = parseFloat(inputRattrapage.value);
  if (Number.isNaN(note) || note < 0 || note > 20) {
    alert("Note invalide : saisissez un nombre entre 0 et 20.");
    return;
  }

  notesRattrapage[selectRattrapage.value] = note; // on mémorise la note pour cette épreuve
  inputRattrapage.value = "";
  rafraichirApresRattrapage();
});

// Clic sur "Annuler les rattrapages"
btnAnnulerRattrapage.addEventListener("click", () => {
  effacerRattrapage();
  rafraichirApresRattrapage();
});

/**
 * Supprime toutes les notes de rattrapage.
 * "for...in" parcourt les CLÉS d'un objet ; delete retire la clé.
 */
function effacerRattrapage() {
  for (const nom in notesRattrapage) {
    delete notesRattrapage[nom];
  }
}

/**
 * Redessine le tableau et recalcule la moyenne après un changement de rattrapage.
 */
function rafraichirApresRattrapage() {
  afficherTableau(document.getElementById("tbodyMatieres"));
  mettreAJourMoyenne();
}
