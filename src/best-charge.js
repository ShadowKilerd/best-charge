const loadAllItems = require('./items');
const loadPromotions = require('./promotions');

const loadAllFormatedItems = () => loadAllItems().reduce((items, item) => {
  items[item.id] = item;
  return items;
}, {});


const ALL_ITEMS = loadAllFormatedItems();
const ALL_PROMOTIONS = loadPromotions();

const itemsInputFormater = (input) => {
  const [itemId, quantity] = input.split(' x ');
  return [itemId, parseInt(quantity, 10)];
};

const itemInputTransformer = selectItems => selectItems.reduce((selectItemsDict, item) => {
  const [itemId, quantity] = item;
  selectItemsDict[itemId] = { item: ALL_ITEMS[itemId], quantity };
  return selectItemsDict;
}, {});

const calculateTotalPrice = (items) => {
  items.total = Object.values(items.items).reduce((sum, item) => {
    sum += item.item.price * item.quantity;
    return sum;
  }, 0.0);
  return items;
};
const getPromotionalInformation = (items) => {
  items.promotions = {};
  ALL_PROMOTIONS.map((promotion) => {
    switch (promotion.type) {
      case '满30减6元':
        if (items.total >= 30) {
          items.promotions[promotion.type] = {
            discount: 6,
            text: '满30减6元，省6元',
          };
        } else {
          items.promotions[promotion.type] = {
            discount: 0,
            text: '',
          };
        }

        break;
      case '指定菜品半价':
        items.promotions[promotion.type] = {
          discount: 0,
          text: '',
        };
        const itemsName = [];
        Object.values(items.items).map((item) => {
          if (promotion.items.includes(item.item.id)) {
            items.promotions[promotion.type].discount += (item.item.price / 2) * item.quantity;
            itemsName.push(item.item.name);
          }
        });
        if (itemsName.length > 0) {
          items.promotions[promotion.type].text = `指定菜品半价(${itemsName.join('，')})，省${items.promotions[promotion.type].discount}元`;
        }
        break;
    }
  });
  return items;
};
const filterEmptyPromotionalInformation = (items) => {
  items.promotions = Object.keys(items.promotions).reduce((d, promotion) => {
    if (items.promotions[promotion].discount > 0) {
      d[promotion] = items.promotions[promotion];
    }
    return d;
  }, {});
  return items;
};

const promotionPrinter = (promotionalInformation) => {
  if (Object.values(promotionalInformation).length === 0) {
    return {
      bestPromotion: {
        discount: 0,
      },
      text: [],
    };
  }
  const bestPromotion = Object.values(promotionalInformation).reduce((promotionA, promotionB) => (promotionA.discount > promotionB.discount ? promotionA : promotionB));
  const stringBuilder = [];
  stringBuilder.push('-----------------------------------');
  stringBuilder.push('使用优惠:');
  stringBuilder.push(bestPromotion.text);

  return {
    bestPromotion,
    text: stringBuilder,
  };
};
const render = (items) => {
  const stringBuilder = [];

  const itemInformation = Object.values(items.items).map(item => `${item.item.name} x ${item.quantity} = ${item.item.price * item.quantity}元`);
  const bestPromotionSolution = promotionPrinter(items.promotions);
  stringBuilder.push('============= 订餐明细 =============');
  stringBuilder.push(...itemInformation);
  stringBuilder.push(...(bestPromotionSolution.text));
  stringBuilder.push('-----------------------------------');
  stringBuilder.push(`总计：${items.total - bestPromotionSolution.bestPromotion.discount}元`);
  stringBuilder.push('===================================');

  return stringBuilder.join('\n');
};

module.exports = bestCharge = (selectedItems) => {
  let items = selectedItems.map(itemsInputFormater);
  items = { items: itemInputTransformer(items) };
  items = calculateTotalPrice(items);
  items = getPromotionalInformation(items);
  items = filterEmptyPromotionalInformation(items);
  return render(items);
  // const
};
