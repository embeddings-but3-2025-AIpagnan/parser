
const fs = require('fs');
const path = require('path');
const Parser = require('tree-sitter');


const Java = require('tree-sitter-java');
const PHP = require('tree-sitter-php');
const JavaScript = require('tree-sitter-javascript');
const TypeScript = require('tree-sitter-typescript').typescript;
const Python = require('tree-sitter-python');
const CSharp = require('tree-sitter-c-sharp');

let Kotlin;
let kotlinAvailable = false;
try {
  Kotlin = require('tree-sitter-kotlin');
  kotlinAvailable = true;
} catch (e) {
  console.warn('  tree-sitter-kotlin non disponible, les tests Kotlin seront ignorés\n');
}

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
    '.kt': kotlinAvailable ? { lang: 'kotlin', parser: Kotlin } : null,
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


function analyzeFileForTest(filepath) {
  const langInfo = detectLanguage(filepath);
  if (!langInfo) {
    throw new Error(`Extension non supportée: ${filepath}`);
  }

  const sourceCode = fs.readFileSync(filepath, 'utf8');
  const parser = new Parser();
  parser.setLanguage(langInfo.parser);
  const tree = parser.parse(sourceCode);

  const names = {};
  traverse(tree.rootNode, langInfo.lang, names);

  return {
    lang: langInfo.lang,
    names: names,
    sorted: Object.entries(names).sort((a, b) => b[1] - a[1])
  };
}


const examplesDir = './examples';
if (!fs.existsSync(examplesDir)) {
  fs.mkdirSync(examplesDir);
}

//JAVA
const javaExample = `package com.example.demo;

public class UserService {
    private DatabaseConnection connection;
    private String serviceName;
    
    public UserService(DatabaseConnection connection) {
        this.connection = connection;
        this.serviceName = "UserService";
    }
    
    public User findUserById(int userId) {
        String query = "SELECT * FROM users WHERE id = ?";
        return connection.executeQuery(query, userId);
    }
    
    public void createUser(String username, String email) {
        User newUser = new User(username, email);
        connection.save(newUser);
    }
}

class User {
    private String username;
    private String email;
    
    public User(String username, String email) {
        this.username = username;
        this.email = email;
    }
}`;

//PHP
const phpExample = `<?php

class ProductController {
    private $database;
    private $cache;
    
    public function __construct($database, $cache) {
        $this->database = $database;
        $this->cache = $cache;
    }
    
    public function getProduct($productId) {
        $cacheKey = "product_" . $productId;
        $product = $this->cache->get($cacheKey);
        return $product;
    }
}

?>`;

//JAVASCRIPT
const jsExample = `class ShoppingCart {
  constructor(userId) {
    this.userId = userId;
    this.items = [];
  }
  
  addItem(product, quantity) {
    const item = {
      product: product,
      quantity: quantity
    };
    this.items.push(item);
  }
}

function processPayment(cart, paymentMethod) {
  const amount = cart.totalPrice;
  return amount;
}

const validatePayment = (transaction) => {
  return transaction.amount > 0;
};`;

//TYPESCRIPT
const tsExample = `interface Task {
  id: number;
  title: string;
}

type Priority = 'low' | 'medium' | 'high';

class TaskManager {
  private tasks: Task[];
  
  constructor() {
    this.tasks = [];
  }
  
  addTask(title: string): Task {
    const newTask: Task = {
      id: 1,
      title: title
    };
    return newTask;
  }
}`;

//EXEMPLE KOTLIN
const kotlinExample = `package com.example

class GameController(private val player: Player) {
    private var score: Int = 0
    private var level: Int = 1
    
    fun startGame() {
        score = 0
        level = 1
    }
    
    fun increaseScore(points: Int) {
        score += points
        checkLevelUp()
    }
    
    private fun checkLevelUp() {
        if (score >= level * 100) {
            level++
        }
    }
}

data class Player(val name: String, val id: Int)

fun createPlayer(name: String, id: Int): Player {
    return Player(name, id)
}`;

//PYTHON 
const pythonExample = `class Library:
    def __init__(self, name):
        self.name = name
        self.books = []
    
    def add_book(self, book):
        self.books.append(book)
    
    def find_book(self, isbn):
        for book in self.books:
            if book.isbn == isbn:
                return book
        return None

def search_books(library, author):
    results = []
    for book in library.books:
        if book.author == author:
            results.append(book)
    return results`;

//C# 
const csharpExample = `using System;

namespace BankingSystem
{
    public class BankAccount
    {
        private decimal balance;
        private string accountNumber;
        
        public BankAccount(string accountNumber, decimal initialBalance)
        {
            this.accountNumber = accountNumber;
            this.balance = initialBalance;
        }
        
        public bool Deposit(decimal amount)
        {
            if (amount > 0)
            {
                balance += amount;
                return true;
            }
            return false;
        }
    }
}`;

s
const expectedResults = {
  'UserService.java': {
    mustInclude: ['UserService', 'connection', 'serviceName', 'findUserById', 'createUser', 'User', 'username', 'email'],
    minCount: 8
  },
  'ProductController.php': {
    mustInclude: ['ProductController', 'database', 'cache', 'getProduct', 'productId', 'cacheKey', 'product'],
    minCount: 7
  },
  'shopping-cart.js': {
    mustInclude: ['ShoppingCart', 'userId', 'items', 'addItem', 'product', 'quantity', 'processPayment', 'cart', 'amount', 'validatePayment', 'transaction', 'item'],
    minCount: 10
  },
  'task-manager.ts': {
    mustInclude: ['Task', 'Priority', 'TaskManager', 'tasks', 'addTask', 'title', 'newTask'],
    minCount: 7
  },
  'game-controller.kt': {
    mustInclude: ['GameController', 'player', 'score', 'level', 'startGame', 'increaseScore', 'points', 'checkLevelUp', 'Player', 'name', 'id', 'createPlayer'],
    minCount: 10
  },
  'library.py': {
    mustInclude: ['Library', 'name', 'books', 'add_book', 'book', 'find_book', 'isbn', 'search_books', 'library', 'author', 'results'],
    minCount: 10
  },
  'BankAccount.cs': {
    mustInclude: ['BankAccount', 'balance', 'accountNumber', 'initialBalance', 'Deposit', 'amount'],
    minCount: 6
  }
};


const examples = [
  { filename: 'UserService.java', content: javaExample },
  { filename: 'ProductController.php', content: phpExample },
  { filename: 'shopping-cart.js', content: jsExample },
  { filename: 'task-manager.ts', content: tsExample },
  { filename: 'library.py', content: pythonExample },
  { filename: 'BankAccount.cs', content: csharpExample }
];

if (kotlinAvailable) {
  examples.push({ filename: 'game-controller.kt', content: kotlinExample });
}

console.log(' Création des fichiers d\'exemple...\n');

examples.forEach(({ filename, content }) => {
  const filepath = path.join(examplesDir, filename);
  fs.writeFileSync(filepath, content, 'utf8');
  console.log(` Créé: ${filepath}`);
});

console.log('\n🧪 Lancement des tests de validation...\n');
console.log('='.repeat(80));

let passedTests = 0;
let failedTests = 0;
const testResults = [];


examples.forEach(({ filename }) => {
  const filepath = path.join(examplesDir, filename);
  const expected = expectedResults[filename];
  
  console.log(`\n Test: ${filename}`);
  
  try {
    const result = analyzeFileForTest(filepath);
    const foundNames = Object.keys(result.names);
    
 
    const errors = [];
    

    if (foundNames.length < expected.minCount) {
      errors.push(` Nombre de noms insuffisant: trouvé ${foundNames.length}, attendu >= ${expected.minCount}`);
    }
    

    const missingNames = expected.mustInclude.filter(name => !foundNames.includes(name));
    if (missingNames.length > 0) {
      errors.push(` Noms manquants: ${missingNames.join(', ')}`);
    }
    
   
    console.log(` Langage: ${result.lang.toUpperCase()}`);
    console.log(` Noms trouvés: ${foundNames.length}`);
    console.log(` Noms uniques: ${result.sorted.map(([name, count]) => `${name}(${count})`).join(', ')}`);
    
    if (errors.length === 0) {
      console.log(' TEST RÉUSSI');
      passedTests++;
      testResults.push({ filename, status: 'PASS', errors: [] });
    } else {
      console.log(' TEST ÉCHOUÉ');
      errors.forEach(err => console.log(`   ${err}`));
      failedTests++;
      testResults.push({ filename, status: 'FAIL', errors });
    }
    
  } catch (error) {
    console.log(' ERREUR D\'ANALYSE');
    console.log(`   ${error.message}`);
    failedTests++;
    testResults.push({ filename, status: 'ERROR', errors: [error.message] });
  }
  
  console.log('='.repeat(80));
});


console.log('\n RÉSUMÉ DES TESTS\n');
console.log(` Tests réussis: ${passedTests}`);
console.log(` Tests échoués: ${failedTests}`);
console.log(` Total: ${passedTests + failedTests}`);
console.log(` Taux de réussite: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

if (failedTests > 0) {
  console.log('\n Détails des échecs:\n');
  testResults.filter(r => r.status !== 'PASS').forEach(result => {
    console.log(`  ${result.filename}: ${result.status}`);
    result.errors.forEach(err => console.log(`    - ${err}`));
  });
  process.exit(1);
} else {
  console.log('\n Tous les tests sont passés avec succès!\n');
  process.exit(0);
}