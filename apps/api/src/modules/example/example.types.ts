export type ExampleRecord = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type CreateExampleInput = {
  name: string;
  price: number;
  quantity: number;
};

export type ExampleValidationResult = {
  name: string;
  price: number;
  quantity: number;
  currency?: string;
  itemCode?: string;
};
