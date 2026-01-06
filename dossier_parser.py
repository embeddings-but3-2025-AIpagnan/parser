#!/usr/bin/env python3

import sys
import os
from pathlib import Path
from collections import defaultdict, Counter

# importation du parser existant
try:
    sys.path.insert(0, str(Path(__file__).parent))
    import parser
except ImportError:
    print("pas de module")
    sys.exit(1)


def trouver_fichiers_java(dossier):  # Trouve récursivement tous les fichiers Java dans un dossier.
    dossier_path = Path(dossier)
    if not dossier_path.exists():
        print(f"le dossier '{dossier}' n'existe pas.")
        sys.exit(1)
    
    if not dossier_path.is_dir():
        print(f" '{dossier}' n'est pas un dossier.")

        sys.exit(1)
    
    fichiers_java = []
    for fichier in dossier_path.rglob("*.java"):
        if not any(part.startswith('.') for part in fichier.parts):

            fichiers_java.append(str(fichier))
    
    return fichiers_java


def analyser_dossier(dossier, return_data=False):  # analyse tous les fichiers Java d'un dossier.
    if not return_data:
        print(f"analyse du dossier: {dossier}")
    
    fichiers = trouver_fichiers_java(dossier)
    
    if not fichiers:
        if return_data:
            return None
        else:
            print("aucun fichier trouvé.")
            return
    
    if not return_data:
        print(f"{len(fichiers)} fichiers trouvés.\n")
    
    # liste globale pour stocker tous les noms
    noms_globaux_liste = []
    resultats_fichiers = []
    
    for fichier in sorted(fichiers):
        try:
            if not return_data:
                print(f"Analyse: {os.path.basename(fichier)}")
            
            resultat = parser.analyze_file_for_test(fichier)
            resultats_fichiers.append({
                'fichier': fichier,
                'data': resultat
            })
            
            # ajouter tous les noms de ce fichier à la liste globale

            noms_globaux_liste.extend(resultat['names_list'])
            
            if not return_data:
                declarations = resultat['total']
                uniques = resultat['unique']
                print(f"  -> {declarations} declarations ({uniques} uniques)")
            
        except Exception as e:
            if return_data:
                raise e
            else:
                print(f"  -> Erreur: {e}")
    
    # Compter les occurrences globales à partir de la liste
    compteur_global = Counter(noms_globaux_liste)


    noms_tries = sorted(compteur_global.items(), key=lambda x: x[1], reverse=True)
    
    if return_data:
        return {
            'dossier': dossier,
            'fichiers': fichiers,
            'resultats_fichiers': resultats_fichiers,
            'noms_liste': noms_globaux_liste,
            'compteur_global': dict(compteur_global),
            'noms_tries': noms_tries,
            'total': len(noms_globaux_liste),
            'uniques': len(compteur_global)
        }
    else:
        # Affichage normal
        print("\nOCCURRENCES GLOBALES (tous fichiers):")
        
        for nom, compte in noms_tries:
            print(f"{nom:<30} -> {compte}")
        
        print(f"\nTotal: {len(noms_globaux_liste)} declarations")

        print(f"Termes uniques: {len(compteur_global)}")


def main():
    if len(sys.argv) < 2:
        print("manque un dossier")
        sys.exit(1)
    
    dossier = sys.argv[1]
    
    #mettre en silencieux
    if len(sys.argv) > 2 and sys.argv[2] == '--silent':
        resultat = analyser_dossier(dossier, return_data=True)

        if resultat:

            print(f"{resultat['total']} déclarations dans {len(resultat['fichiers'])} fichiers")
    else:
        analyser_dossier(dossier)


if __name__ == '__main__':
    main()