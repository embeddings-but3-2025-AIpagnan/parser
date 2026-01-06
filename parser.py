import sys
from pathlib import Path
from collections import defaultdict

try:
    from tree_sitter import Language, Parser
    import tree_sitter_java as tsjava
except ImportError:
    print("tree sitter introuvable")
    sys.exit(1)


#déclaration des termes
NODE_TYPES = [
    'class_declaration',
    'method_declaration',
    'variable_declarator',
    'formal_parameter',
    'interface_declaration',
    'enum_declaration',
    'field_declaration'
]


def extract_name(node): #extrait le nom d'un nœud Java selon son type.
    if 'declaration' in node.type:
        name_node = node.child_by_field_name('name')
        return name_node.text.decode('utf8') if name_node else None
    
    if node.type == 'variable_declarator':
        name_node = node.child_by_field_name('name')
        return name_node.text.decode('utf8') if name_node else None
    
    if node.type == 'formal_parameter':
        name_node = node.child_by_field_name('name')
        return name_node.text.decode('utf8') if name_node else None

    return None


def traverse(node, names): #Parcourt récursivement l'arbre syntaxique et collecte les noms déclarés.
    if node.type in NODE_TYPES:
        name = extract_name(node)
        if name and len(name) > 0:
            names[name] += 1
    
    for child in node.children:
        traverse(child, names)


def parse_file(filepath): #Parse un fichier Java et retourne l'arbre syntaxique.
    
    file_path = Path(filepath)
    
    if not file_path.exists():
        raise FileNotFoundError(f'Le fichier "{filepath}" n\'existe pas.')
    if file_path.suffix.lower() != '.java':
        raise ValueError(f'Extension de fichier non supportée pour "{filepath}". '
                        f'Seuls les fichiers .java sont acceptés.')
    
    # Lire fichier
    source_code = file_path.read_bytes()
    
    parser = Parser()
    
   
    java_language = Language(tsjava.language())
    #gestion des versions de tree sitter
    if hasattr(parser, 'set_language'):

        parser.set_language(java_language)
    elif hasattr(parser, 'language'):  
        parser.language = java_language
    else:
        parser = Parser(java_language)
    
    tree = parser.parse(source_code)
    
    return tree, tree.root_node


def analyze_file(filepath): #Analyse un fichier Java et affiche les noms déclarés avec leurs occurrences.
    try:
        tree, root_node = parse_file(filepath)
        
        names = defaultdict(int)
        traverse(root_node, names)
        
        
        sorted_names = sorted(names.items(), key=lambda x: x[1], reverse=True)
        
        
        print(f"\n{filepath}")
        print(f"Langage détecté: JAVA")
        print(f"\nNoms déclarés ({len(sorted_names)} uniques):\n")
        
        for name, count in sorted_names:
            plural = 's' if count > 1 else ''
            print(f"{name:<30} → {count} occurrence{plural}")
        
        total = sum(count for _, count in sorted_names)
        print(f"\nTotal: {total} déclarations\n")
        
    except Exception as e:
        print(f"Erreur: {e}", file=sys.stderr)
        sys.exit(1)


def analyze_file_for_test(filepath): #analyze_file mais qui retourne les données au lieu de les afficher.
   
    tree, root_node = parse_file(filepath)
    names = defaultdict(int)
    traverse(root_node, names)
    
    sorted_names = sorted(names.items(), key=lambda x: x[1], reverse=True)
    
    return {
        'lang': 'java',
        'names': dict(names),
        'sorted': sorted_names
    }


def main():
    
    if len(sys.argv) < 2:
        print('Usage: python parser.py <fichier.java>')
        print('\nAnalyse un fichier Java et extrait tous les noms déclarés')
        print('(classes, méthodes, variables, paramètres, interfaces, enums, champs)')
        sys.exit(1)
    
    filepath = sys.argv[1]
    analyze_file(filepath)


if __name__ == '__main__':
    main()