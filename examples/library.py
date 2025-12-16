class Library:
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
    return results