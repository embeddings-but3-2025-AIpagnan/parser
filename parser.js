const Parser = require('tree-sitter');
const fs = require('fs');
const path = require('path');

const Java = require('tree-sitter-java');
const PHP = require('tree-sitter-php');
const JavaScript = require('tree-sitter-javascript');
const TypeScript = require('tree-sitter-typescript').typescript;
const Kotlin = require('tree-sitter-kotlin');
const Python = require('tree-sitter-python');
const CSharp = require('tree-sitter-c-sharp');


const NODE_TYPES = {
  java: ['class_declaration', 'method_declaration', 'variable_declarator', 'formal_parameter', 'interface_declaration', 'enum_declaration'],
  php: ['class_declaration', 'function_definition', 'method_declaration', 'property_declaration', 'simple_parameter'],
  javascript: ['class_declaration', 'function_declaration', 'variable_declarator', 'arrow_function', 'method_definition'],
  typescript: ['class_declaration', 'function_declaration', 'variable_declarator', 'arrow_function', 'method_definition', 'interface_declaration', 'type_alias_declaration'],
  kotlin: ['class_declaration', 'function_declaration', 'variable_declaration', 'property_declaration'],
  python: ['class_definition', 'function_definition', 'assignment', 'parameter'],
  csharp: ['class_declaration', 'method_declaration', 'variable_declarator', 'parameter', 'interface_declaration', 'property_declaration']
};


function detectLanguage(filepath) {
  const ext = path.extname(filepath).toLowerCase();
  const langMap = {
    '.java': { lang: 'java', parser: Java },
    '.php': { lang: 'php', parser: PHP },
    '.js': { lang: 'javascript', parser: JavaScript },
    '.jsx': { lang: 'javascript', parser: JavaScript },
    '.ts': { lang: 'typescript', parser: TypeScript },
    '.tsx': { lang: 'typescript', parser: TypeScript },
    '.kt': { lang: 'kotlin', parser: Kotlin },
    '.py': { lang: 'python', parser: Python },
    '.cs': { lang: 'csharp', parser: CSharp }
  };
  return langMap[ext];
}


function extractName(node, lang) {
  switch(lang) {
    case 'java':
    case 'kotlin':
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
    
    case 'php':
      if (node.type.includes('declaration') || node.type === 'function_definition') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      if (node.type === 'simple_parameter') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text.replace('$', '') : null;
      }
      break;
    
    case 'javascript':
    case 'typescript':
      if (node.type.includes('declaration')) {
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
      break;
    
    case 'python':
      if (node.type.includes('definition')) {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      if (node.type === 'assignment') {
        const leftNode = node.childForFieldName('left');
        return leftNode && leftNode.type === 'identifier' ? leftNode.text : null;
      }
      if (node.type === 'parameter') {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      break;
  }
  return null;
}


function traverse(node, lang, names) {
  const targetTypes = NODE_TYPES[lang];
  
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


function analyzeFile(filepath) {

  if (!fs.existsSync(filepath)) {
    console.error(`Erreur: Le fichier "${filepath}" n'existe pas.`);
    process.exit(1);
  }

  const langInfo = detectLanguage(filepath);
  if (!langInfo) {
    console.error(`Erreur: Extension de fichier non supportée pour "${filepath}"`);
    console.log('Extensions supportées: .java, .php, .js, .jsx, .ts, .tsx, .kt, .py, .cs');
    process.exit(1);
  }

 
  const sourceCode = fs.readFileSync(filepath, 'utf8');


  const parser = new Parser();
  parser.setLanguage(langInfo.parser);

  const tree = parser.parse(sourceCode);


  const names = {};
  traverse(tree.rootNode, langInfo.lang, names);


  const sorted = Object.entries(names)
    .sort((a, b) => b[1] - a[1]);


  console.log(`\n Analyse de: ${filepath}`);
  console.log(` Langage détecté: ${langInfo.lang.toUpperCase()}`);
  console.log(`\n Noms déclarés (${sorted.length} uniques):\n`);
  
  sorted.forEach(([name, count]) => {
    console.log(`  ${name.padEnd(30)} → ${count} occurrence${count > 1 ? 's' : ''}`);
  });

  console.log(`\n Total: ${sorted.reduce((sum, [, count]) => sum + count, 0)} déclarations\n`);
}


if (require.main === module) {
  const filepath = process.argv[2];
  
  if (!filepath) {
    console.log('Usage: node script.js <fichier>');
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

module.exports = { analyzeFile };