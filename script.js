"use strict";

/**
 * Épreuves du BTS SIO option B (SLAM) - Journal officiel du 10 juillet 2024.
 * Voie scolaire : E3, E5 et E6 en CCF ; E1, E2, E4 et E7 en ponctuel.
 * Total des coefficients : 22.
 */
const matieres = [
  { nom: "E1 - Culture générale et expression",              coef: 2, type: "ponctuelle", note: null },
  { nom: "E2 - Expression et communication en langue anglaise", coef: 2, type: "ponctuelle", note: null },
  { nom: "E3 - Mathématiques pour l'informatique",           coef: 3, type: "ccf",        note: null },
  { nom: "E4 - Culture économique, juridique et managériale", coef: 3, type: "ponctuelle", note: null },
  { nom: "E5 - Support et mise à disposition de services",   coef: 4, type: "ccf",        note: null },
  { nom: "E6 - Conception et développement d'applications",  coef: 4, type: "ccf",        note: null },
  { nom: "E7 - Cybersécurité des services informatiques",    coef: 4, type: "ponctuelle", note: null }
];

document.addEventListener("DOMContentLoaded", () => {
  // Récupération des éléments du DOM
  const selectMatiere = document.getElementById("selectMatiere");
  const inputNote     = document.getElementById("inputNote");
  const tbodyMatieres = document.getElementById("tbodyMatieres");
  const spanMoyenne   = document.getElementById("spanMoyenne");
  const spanMention   = document.getElementById("spanMention");
  const btnAjouter    = document.getElementById("btnAjouter");
  const btnCalculer   = document.getElementById("btnCalculer");
  const btnReset      = document.getElementById("btnReset");

  // Q1 : remplir la liste déroulante
  initialiserSelectMatieres(selectMatiere);

  // Q2 : première affichage du tableau
  afficherTableau(tbodyMatieres);

  // Q3 : ajout / modification d'une note
  btnAjouter.addEventListener("click", () => {
    const noteValeur = parseFloat(inputNote.value);
    const succes = ajouterNote(selectMatiere.value, noteValeur);
    if (succes) {
      afficherTableau(tbodyMatieres);
      inputNote.value = "";
    } else {
      alert("Note invalide : saisissez un nombre entre 0 et 20.");
    }
  });

  // Q4 : calcul de la moyenne
  btnCalculer.addEventListener("click", () => {
    const resultat = calculerMoyenneGenerale();
    if (resultat === null) {
      alert("Toutes les épreuves doivent avoir une note pour calculer la moyenne.");
      return;
    }
    spanMoyenne.textContent = resultat.moyenne.toFixed(2);
    spanMention.textContent = resultat.mention;
  });

  // Q5 : réinitialisation
  btnReset.addEventListener("click", () => {
    resetNotes();
    afficherTableau(tbodyMatieres);
    spanMoyenne.textContent = "—";
    spanMention.textContent = "—";
    inputNote.value = "";
  });
});

/**
 * Remplit la liste déroulante des matières.
 * @param {HTMLSelectElement} selectElement - Liste déroulante à remplir
 */
function initialiserSelectMatieres(selectElement) {
  for (const matiere of matieres) {
    const option = document.createElement("option");
    option.value = matiere.nom;
    option.textContent = matiere.nom;
    selectElement.appendChild(option);
  }
}

/**
 * Affiche le tableau récapitulatif des matières.
 * @param {HTMLTableSectionElement} tbodyElement - Corps de tableau à remplir
 */
function afficherTableau(tbodyElement) {
  tbodyElement.innerHTML = ""; // on vide d'abord le tableau

  for (const matiere of matieres) {
    const ligne = document.createElement("tr");
    const aUneNote = matiere.note !== null;

    const valeurs = [
      matiere.nom,
      matiere.type === "ccf" ? "CCF" : "Ponctuelle",
      matiere.coef,
      aUneNote ? matiere.note : "—",
      aUneNote ? (matiere.note * matiere.coef).toFixed(2) : "—"
    ];

    for (const valeur of valeurs) {
      const cellule = document.createElement("td");
      cellule.textContent = valeur;
      ligne.appendChild(cellule);
    }
    tbodyElement.appendChild(ligne);
  }
}

/**
 * Met à jour la note d'une matière.
 * @param {string} nomMatiere - Nom de la matière sélectionnée
 * @param {number} noteValeur - Note sur 20
 * @returns {boolean} true si la note a été enregistrée, false sinon
 */
function ajouterNote(nomMatiere, noteValeur) {
  // Validation : nombre valide compris entre 0 et 20
  if (Number.isNaN(noteValeur) || noteValeur < 0 || noteValeur > 20) {
    return false;
  }
  const matiere = matieres.find((m) => m.nom === nomMatiere);
  if (matiere === undefined) {
    return false;
  }
  matiere.note = noteValeur;
  return true;
}

/**
 * Calcule la moyenne générale pondérée et la mention.
 * Choix explicite : le calcul est BLOQUÉ si une note manque
 * (le diplôme se calcule sur toutes les épreuves obligatoires).
 * @returns {{ moyenne: number, mention: string } | null}
 */
function calculerMoyenneGenerale() {
  if (matieres.some((m) => m.note === null)) {
    return null;
  }

  let sommePoints = 0;
  let sommeCoef = 0;
  for (const matiere of matieres) {
    sommePoints += matiere.note * matiere.coef;
    sommeCoef += matiere.coef;
  }
  const moyenne = sommePoints / sommeCoef;

  // Mentions du BTS : 12 assez bien, 14 bien, 16 très bien
  let mention;
  if (moyenne < 10)       mention = "Non admis";
  else if (moyenne < 12)  mention = "Aucune";
  else if (moyenne < 14)  mention = "Assez bien";
  else if (moyenne < 16)  mention = "Bien";
  else                    mention = "Très bien";

  return { moyenne, mention };
}

/**
 * Réinitialise toutes les notes à null.
 */
function resetNotes() {
  for (const matiere of matieres) {
    matiere.note = null;
  }
}
