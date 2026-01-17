export function testFaveroCase(): {
    actual: string;
    expected: string;
    success: boolean;
};
export function testFaveroStringCase(): {
    actual: string;
    expected: string;
    success: boolean;
};
/**
 * Test the new formatting with sample data
 */
export function testNewFormatting(): (
    | {
          name: string;
          sensor: {
              manufacturer: number;
              product: number;
              garminProduct?: never;
          };
      }
    | {
          name: string;
          sensor: {
              manufacturer: string;
              product: string;
              garminProduct?: never;
          };
      }
    | {
          name: string;
          sensor: {
              garminProduct: string;
              manufacturer?: never;
              product?: never;
          };
      }
)[];
