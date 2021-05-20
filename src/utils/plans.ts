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

const plans: { [id: string]: planAttr } = {
  standard: {
    id: 'standard',
    name: 'standard',
    storage: 20 * 1024 * 1024 * 1024,
    people: 1000,
    price: 10000, // price in paisa
  },
};

export { oneMonthDiff, plans };

export type { planAttr };
