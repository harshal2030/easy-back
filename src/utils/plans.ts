const oneMonthFromNow = new Date();
oneMonthFromNow.setDate(oneMonthFromNow.getDate() + 30);

const oneMonthDiff = oneMonthFromNow.getTime() - new Date().getTime();

interface planAttr {
  id: string;
  name: string;
  storage: number;
  people: number;
  price: number;
}

interface offerAttr {
  id: string;
  amountOff: number;
}

const plans: { [id: string]: planAttr } = {
  standard: {
    id: 'standard',
    name: 'standard',
    storage: 20 * 1024 * 1024 * 1024,
    people: 1000,
    price: 10000, // price in paisa
  },
};

const offers: { [id: string]: offerAttr } = {
  HAROFF_100: {
    id: 'HAROFF_100',
    amountOff: 10000,
  },
  HAROFF_60: {
    id: 'HAROFF_60',
    amountOff: 6000,
  },
};

export { oneMonthDiff, plans, offers };

export type { planAttr };
