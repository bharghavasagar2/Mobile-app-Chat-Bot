const Order = require("./Order");

const OrderState = Object.freeze({
  WELCOMING: Symbol("welcoming"),
  MAINTENANCE_ESSENTIALS: Symbol("maintenance_essentials"),
  UPSELL_ITEMS: Symbol("upsell_items"),
  CHECKOUT: Symbol("checkout")
});



const getMaintenanceEssentialItem = (code) => {

  const maintenanceEssentials = [
    { code: 1, name: "Brooms and Dustbins", price: 5.00 },
    { code: 2, name: "Snow shovels", price: 8.00 },
    { code: 3, name: "Garbage and recycling containers", price: 5.00 },
    { code: 4, name: "Light-bulbs", price: 3.00 },
    { code: 5, name: "Household cleaners", price: 12.50 },
    { code: 6, name: "Furnace filters", price: 12.00 },
    { code: 7, name: "Screen for screen doors", price: 10.00 }
  ];
  return maintenanceEssentials.find(item => item.code === code);
}

const getUpSellItem = (code) => {

  const upSellItems = [
    { code: 1, name: "Simonize car cloths", price: 10.99 },
    { code: 2, name: "Geeky headlamps", price: 19.99 },
    { code: 3, name: "Ear buds", price: 29.99 },
    { code: 4, name: "De-scaler for a kettle", price: 5.99 }
  ];
  return upSellItems.find(item => item.code === code);
}

const calculateTotal = (items) => {
  const maintenanceEssentialsPrice = items.maintenanceEssentials.reduce((total, item) => total + item.totalPrice, 0);
  const upSellItemsPrice = items.upSellItems.reduce((total, item) => total + item.totalPrice, 0);
  let subtotal = maintenanceEssentialsPrice + upSellItemsPrice;
  let tax = subtotal * 0.13;
  let total = subtotal + tax;
  return {
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2)
  };
};


const renderAllOrders = (items, aReturn, isCheckItems = false) => {
  const allItems = [...items.maintenanceEssentials, ...items.upSellItems];
  if (!isCheckItems) {
    if (allItems.length > 0) {
      allItems.map(({ item, quantity, totalPrice }) => {
        aReturn.push(`${item} | Q-${quantity} | $${totalPrice}`);
      })
    }
  } else {
    return allItems.length > 0;
  }
}

module.exports = class LockDownEssentials extends Order {
  constructor(sNumber, sUrl) {
    super(sNumber, sUrl);
    this.stateCur = OrderState.WELCOMING;
    this.categoryCode = null;
    this.items = {
      maintenanceEssentials: [],
      upSellItems: []
    };
    this.total = 0;
  }



  handleInput(sInput) {
    let aReturn = [];
    switch (this.stateCur) {
      case OrderState.WELCOMING:
        this.categoryCode = null;
        this.stateCur = OrderState.MAINTENANCE_ESSENTIALS;
        aReturn.push("Welcome to Home Hardware Curbside Ordering.");
        aReturn.push(`For a list of what we sell tap:`);
        aReturn.push(`${this.sUrl}/help/${this.sNumber}/`);
        aReturn.push("Please choose from the following categories:");
        aReturn.push("1. Maintenance Essentials");
        aReturn.push("2. Up-sell Items");
        aReturn.push("Reply with the corresponding number to select a category.");
        break;

      case OrderState.MAINTENANCE_ESSENTIALS:
        if (sInput === "1") {
          aReturn.push("You have selected Maintenance Essentials.");
          aReturn.push("Please reply with the item code and quantity");
          this.items.maintenanceEssentials = [];
          aReturn.push("Maintenance Essentials");
          aReturn.push("1. Brooms and Dustbins - Price: $5.00 each");
          aReturn.push("2. Snow shovels - Price: $8.00 each");
          aReturn.push("3. Garbage and recycling containers - Price: $5.00 each");
          aReturn.push("4. Light-bulbs - Price: $3.00 each");
          aReturn.push("5. Household cleaners - Price: $12.50 each");
          aReturn.push("6. Furnace filters - Price: $12.00 each");
          aReturn.push("7. Screen for screen doors - Price: $10.00 each");

          aReturn.push(`Please provide the item code and quantity, in the
          following format: 'Item Code, Quantity'. For example: '2,2' for snow shovels - 2 quantity.`);
          aReturn.push("When you are done, reply with 'done'.");
          this.categoryCode = sInput;
          this.stateCur = OrderState.CHECKOUT;
        } else if (sInput === "2") {
          aReturn.push("You have selected Up-sell Items.");
          aReturn.push("Please reply with the item code and quantity.");
          this.items.upSellItems = [];
          aReturn.push("Up-sell Items");
          aReturn.push("1. Simonize car cloths - Price: $10.99 each");
          aReturn.push("2. Geeky headlamps - Price: $19.99 each");
          aReturn.push("3. Ear buds - Price: $29.99 each");
          aReturn.push("4. De-scaler for a kettle - Price: $5.99 each");
          aReturn.push(`Please provide the item code and quantity, in the
          following format: 'Item Code, Quantity'. For example: '3,2' for ear buds - 2 quantity.`);
          aReturn.push("When you are done, reply with 'done'.");
          this.categoryCode = sInput;
          this.stateCur = OrderState.CHECKOUT;
        } else {
          this.categoryCode = null;
          this.stateCur = OrderState.MAINTENANCE_ESSENTIALS;
          aReturn.push(`Invalid input. Please select a category by replying with the corresponding number.`);
        }
        break;

      case OrderState.CHECKOUT:
        if (sInput.toLowerCase() === "done" && renderAllOrders(this.items, aReturn, true)) {
          this.stateCur = OrderState.WELCOMING;
          let { tax, total, subtotal } = calculateTotal(this.items);

          aReturn.push(`Item | Quantity | Cost`);
          renderAllOrders(this.items, aReturn);
          aReturn.push("Tax@13%: $" + tax);
          aReturn.push("Sub-Total: $" + subtotal);
          aReturn.push("Total: $" + total);
          aReturn.push("Thank you for your order!");
          aReturn.push("We will text you when your order is ready for pickup at curbside.");
          this.isDone(true);
        } else if (sInput.toLowerCase() === "done" && !renderAllOrders(this.items, aReturn, false)) {
          aReturn.push(`No items in the cart. Please add some items`);
        } else {
          const itemInfo = sInput.split(",");
          if (itemInfo.length !== 2 || !/^\d+$/.test(itemInfo[0]) || !/^\d+$/.test(itemInfo[1])) {
            aReturn.push(`Invalid item code. Please select a valid item. Note - Please reply with the item code and quantity.
            For example: '1,2', and please avoid spaces in between. `);
          } else {
            const itemCode = parseInt(itemInfo[0]);
            const quantity = parseInt(itemInfo[1]);
            if (this.categoryCode === '1') {
              const item = getMaintenanceEssentialItem(itemCode);
              if (item) {
                const totalPrice = item.price * quantity;
                this.items.maintenanceEssentials.push({ item: item.name, quantity, totalPrice });
                aReturn.push(`Item added to your order: ${item.name} - Price: $${item.price.toFixed(2)} each, Quantity: ${quantity}. 
                Note- When you are done, reply with 'done'.
                `);
              } else {
                aReturn.push(`Invalid item code. Please select a valid item. Note - Please reply with the item code and quantity.
                For example: '2,2' for snow shovels - 2 quantity. Please avoid spaces in between.`);
              }
            } else if (this.categoryCode === '2') {
              const item = getUpSellItem(itemCode);
              if (item) {
                const totalPrice = item.price * quantity;
                this.items.upSellItems.push({ item: item.name, quantity, totalPrice });
                aReturn.push(`Item added to your order: ${item.name} - Price: $${item.price.toFixed(2)} each, Quantity: ${quantity}. 
                Note- When you are done, reply with 'done'.
                `);
              } else {
                aReturn.push(`Invalid item code. Please select a valid item. Note - Please reply with the item code and quantity.
                For example: '3,2' for ear buds - 2 quantity. Please avoid spaces in between.`);
              }
            }
          }
        }
        break;
    }
    return aReturn;
  }




  renderForm() {

    return (`

        <!DOCTYPE html>
        <html>
          <head>
            <title>Home Hardware Curbside Ordering</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f5f5f5;
                text-align: center;
                padding: 20px;
              }
        
              .container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 50px;
                border: 2px solid #143d4b;
                border-radius: 10px;
                padding: 20px;
              }
        
              .header {
                margin-bottom: 20px;
              }
        
              .header h1 {
                color: #333333;
                margin-bottom: 10px;
              }
              .contact {
                font-size: 14px;
                color: #666666;
                margin-top: 20px;
              }
              .content {
                display: flex;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 1em;
              }
        
              .product {
                background-color: #ffffff;
                margin: 2em;
                border-radius: 10px;
                box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
                padding: 20px;
                margin-bottom: 20px;
                text-align: left;
              }
        
              .product h2 {
                color: #333333;
                margin-bottom: 10px;
              }
        
              .product p {
                color: #666666;
                font-weight: bold;
              }
              .price {
                font-weight: bold;
                color: #008cba;
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Home Hardware Curbside Ordering</h1>
                <h2 class="contact">
                  For curbside pickup: Text Item name to
                  <strong>519-111-1111</strong>
                </h2>
              </div>
        
              <div class="content">
                <div class="product">
                  <h2>Maintenance Essentials</h2>
        
                  <p>
                    Brooms and Dustbins <strong class="price">Price: $5.00 each</strong>
                  </p>
                  <p>Snow shovels <strong class="price">Price: $8.00 each</strong></p>
                  <p>
                    Garbage and recycling containers
                    <strong class="price">Price: $5.00 each</strong>
                  </p>
                  <p>Light-bulbs <strong class="price">Price: $3.00 each</strong></p>
                  <p>
                    Household cleaners <strong class="price">Price: $12.50 each</strong>
                  </p>
                  <p>
                    Furnace filters <strong class="price">Price: $12.00 each</strong>
                  </p>
                  <p>
                    Screen for screen doors
                    <strong class="price">Price: $10.00 each</strong>
                  </p>
                </div>
        
                <div class="product">
                  <h2>Up-sell Items</h2>
                  <p>
                    Simonize car cloths
                    <strong class="price">Price: $10.99 each</strong>
                  </p>
                  <p>
                    Geeky headlamps <strong class="price">Price: $19.99 each</strong>
                  </p>
                  <p>Ear buds <strong class="price">Price: $29.99 each</strong></p>
                  <p>
                    De-scaler for a kettle
                    <strong class="price">Price: $5.99 each</strong>
                  </p>
                </div>
              </div>
        
              <p>We will text you when your order is ready for pickup at curbside.</p>
            </div>
          </body>
        </html>
        
          `);

  }
}
