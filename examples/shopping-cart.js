class ShoppingCart {
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
};