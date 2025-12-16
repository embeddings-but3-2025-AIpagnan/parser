const Parser = require('tree-sitter');
const fs = require('fs');
const path = require('path');

const loadParser = (moduleName, subpath = null) => {
  try {
    const actualModule = subpath ? require(`${moduleName}/${subpath}`) : require(moduleName);
    if (moduleName === 'tree-sitter-typescript') {
      return actualModule.typescript;
    }
    return actualModule;
  } catch (e) {
    return null;
  }
};

const parsers = {
  java: loadParser('tree-sitter-java'),
  php: loadParser('tree-sitter-php', 'php'),
  javascript: loadParser('tree-sitter-javascript'),
  typescript: loadParser('tree-sitter-typescript'),
  kotlin: loadParser('tree-sitter-kotlin'),
  python: loadParser('tree-sitter-python'),
  csharp: loadParser('tree-sitter-c-sharp')
};

const NODE_TYPES = {
  java: ['class_declaration', 'method_declaration', 'variable_declarator', 'formal_parameter', 'interface_declaration', 'enum_declaration', 'field_declaration'],
  php: ['class_declaration', 'function_definition', 'method_declaration', 'property_declaration', 'simple_parameter', 'property_element'],
  javascript: ['class_declaration', 'function_declaration', 'variable_declarator', 'arrow_function', 'method_definition', 'formal_parameter', 'lexical_declaration', 'identifier', 'pair'],
  typescript: ['class_declaration', 'function_declaration', 'variable_declarator', 'arrow_function', 'method_definition', 'interface_declaration', 'type_alias_declaration', 'property_signature', 'required_parameter', 'public_field_definition', 'lexical_declaration'],
  kotlin: [
    'class_declaration',
    'function_declaration',
    'property_declaration',
    'variable_declaration',
    'class_parameter',
    'object_declaration',
    'type_identifier',
    'identifier'
  ],
  python: ['class_definition', 'function_definition', 'assignment', 'parameter', 'identifier', 'attribute'],
  csharp: ['class_declaration', 'method_declaration', 'variable_declarator', 'parameter', 'interface_declaration', 'property_declaration', 'field_declaration']
};

function detectLanguage(filepath) {
  const ext = path.extname(filepath).toLowerCase();
  const langMap = {
    '.java': { lang: 'java', parser: parsers.java },
    '.php': { lang: 'php', parser: parsers.php },
    '.js': { lang: 'javascript', parser: parsers.javascript },
    '.jsx': { lang: 'javascript', parser: parsers.javascript },
    '.ts': { lang: 'typescript', parser: parsers.typescript },
    '.tsx': { lang: 'typescript', parser: parsers.typescript },
    '.kt': { lang: 'kotlin', parser: parsers.kotlin },
    '.py': { lang: 'python', parser: parsers.python },
    '.cs': { lang: 'csharp', parser: parsers.csharp }
  };
  
  const langInfo = langMap[ext];
  if (!langInfo || !langInfo.parser) {
    return null;
  }
  return langInfo;
}

function extractName(node, lang) {
  switch(lang) {
    case 'java':
    case 'csharp':
      if (node.type.includes('declaration')) {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      if (node.type === 'variable_declarator') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      if (node.type === 'formal_parameter' || node.type === 'parameter') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      break;
    
    case 'kotlin':
      if (node.type === 'class_declaration' || node.type === 'object_declaration') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      if (node.type === 'function_declaration') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      if (node.type === 'property_declaration' || node.type === 'variable_declaration') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      if (node.type === 'class_parameter') {
        for (let child of node.children) {
          if (child.type === 'simple_identifier') {
            return child.text;
          }
        }
        return null;
      }
      if (node.type === 'identifier' || node.type === 'type_identifier') {
        // Éviter de capturer tous les identifiants aléatoires
        const parent = node.parent;
        if (
          parent &&
          (parent.type === 'class_declaration' ||
           parent.type === 'function_declaration' ||
           parent.type === 'property_declaration' ||
           parent.type === 'object_declaration' ||
           parent.type === 'type_alias' ||
           parent.type === 'variable_declaration')
        ) {
          return node.text;
        }
      }
      break;
    
    case 'php':
      if (node.type === 'class_declaration') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      if (node.type === 'function_definition' || node.type === 'method_declaration') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      if (node.type === 'property_declaration') {
        for (let child of node.children) {
          if (child.type === 'property_element') {
            const varName = child.childForFieldName('name');
            if (varName) {
              return varName.text.replace('$', '');
            }
          }
        }
      }
      if (node.type === 'property_element') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text.replace('$', '') : null;
      }
      if (node.type === 'simple_parameter') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text.replace('$', '') : null;
      }
      break;
    
    case 'javascript':
      if (node.type === 'class_declaration') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      if (node.type === 'function_declaration') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      if (node.type === 'variable_declarator') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          return nameNode.text;
        }
      }
      if (node.type === 'arrow_function') {
        const parent = node.parent;
        if (parent && parent.type === 'variable_declarator') {
          const nameNode = parent.childForFieldName('name');
          return nameNode ? nameNode.text : null;
        }
      }
      if (node.type === 'method_definition') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      if (node.type === 'formal_parameter') {
        const nameNode = node.childForFieldName('name') || node.childForFieldName('pattern');
        if (nameNode) {
          if (nameNode.type === 'identifier') {
            return nameNode.text;
          }
          return nameNode.text;
        }
      }
      if (node.type === 'identifier') {
        return node.text;
      }
      break;
    
    case 'typescript':
      if (node.type === 'class_declaration' || node.type === 'function_declaration' ||
          node.type === 'interface_declaration' || node.type === 'type_alias_declaration') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      if (node.type === 'variable_declarator') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      if (node.type === 'arrow_function') {
        const parent = node.parent;
        if (parent && parent.type === 'variable_declarator') {
          const nameNode = parent.childForFieldName('name');
          return nameNode ? nameNode.text : null;
        }
      }
      if (node.type === 'method_definition') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      if (node.type === 'property_signature' || node.type === 'public_field_definition') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      if (node.type === 'required_parameter') {
        const pattern = node.childForFieldName('pattern');
        if (pattern && pattern.type === 'identifier') {
          return pattern.text;
        }
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          return nameNode.text;
        }
      }
      break;
    
    case 'python':
      if (node.type === 'class_definition' || node.type === 'function_definition') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      if (node.type === 'assignment') {
        const leftNode = node.childForFieldName('left');
        if (leftNode) {
          if (leftNode.type === 'attribute') {
            const attr = leftNode.childForFieldName('attribute');
            return attr ? attr.text : null;
          }
          if (leftNode.type === 'identifier') {
            return leftNode.text;
          }
        }
      }
      if (node.type === 'parameter') {
        const nameNode = node.childForFieldName('name');
        if (nameNode && nameNode.text !== 'self' && nameNode.text !== 'cls') {
          return nameNode.text;
        }
      }
      if (node.type === 'identifier') {
        return node.text;
      }
      break;
  }
  return null;
}

function traverse(node, lang, names) {
  const targetTypes = NODE_TYPES[lang] || [];
  
  if (targetTypes.includes(node.type)) {
    const name = extractName(node, lang);
    if (name && name.length > 0) {
      names[name] = (names[name] || 0) + 1;
    }
  }
  
  for (let child of node.children) {
    traverse(child, lang, names);
  }
}

function parseFile(filepath) {
  if (!fs.existsSync(filepath)) {
    throw new Error(`Le fichier "${filepath}" n'existe pas.`);
  }

  const langInfo = detectLanguage(filepath);
  if (!langInfo) {
    throw new Error(`Extension de fichier non supportée pour "${filepath}"`);
  }

  if (!langInfo.parser) {
    throw new Error(`Parser pour le langage ${langInfo.lang} non disponible. Vérifiez l'installation du module tree-sitter.`);
  }

  const sourceCode = fs.readFileSync(filepath, 'utf8');
  const parser = new Parser();
  
  try {
    parser.setLanguage(langInfo.parser);
  } catch (error) {
    throw new Error(`Erreur lors de l'initialisation du parser pour ${langInfo.lang}: ${error.message}`);
  }

  const tree = parser.parse(sourceCode);
  
  return {
    tree,
    lang: langInfo.lang,
    rootNode: tree.rootNode
  };
}

function analyzeFile(filepath) {
  try {
    const { tree, lang } = parseFile(filepath);
    const names = {};
    traverse(tree.rootNode, lang, names);

    const sorted = Object.entries(names)
      .sort((a, b) => b[1] - a[1]);

    console.log(`\nAnalyse de: ${filepath}`);
    console.log(`Langage détecté: ${lang.toUpperCase()}`);
    console.log(`\nNoms déclarés (${sorted.length} uniques):\n`);
    
    sorted.forEach(([name, count]) => {
      console.log(`  ${name.padEnd(30)} → ${count} occurrence${count > 1 ? 's' : ''}`);
    });

    console.log(`\nTotal: ${sorted.reduce((sum, [, count]) => sum + count, 0)} déclarations\n`);
  } catch (error) {
    console.error(`Erreur: ${error.message}`);
    process.exit(1);
  }
}

function analyzeFileForTest(filepath) {
  const { tree, lang } = parseFile(filepath);
  const names = {};
  traverse(tree.rootNode, lang, names);

  return {
    lang,
    names,
    sorted: Object.entries(names).sort((a, b) => b[1] - a[1])
  };
}

if (require.main === module) {
  const filepath = process.argv[2];
  
  if (!filepath) {
    console.log('Usage: node parser.js <fichier>');
    console.log('\nLangages supportés:');
    console.log('  - Java (.java)');
    console.log('  - PHP (.php)');
    console.log('  - JavaScript (.js, .jsx)');
    console.log('  - TypeScript (.ts, .tsx)');
    console.log('  - Kotlin (.kt)');
    console.log('  - Python (.py)');
    console.log('  - C# (.cs)');
    process.exit(1);
  }

  analyzeFile(filepath);
}

module.exports = {
  analyzeFile,
  analyzeFileForTest,
  detectLanguage,
  extractName,
  traverse,
  NODE_TYPES,
  parsers,
  parseFile
};