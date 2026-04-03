/** Nested string dictionaries for locale files (values are always translatable strings). */
export type MessageTree = {
  readonly [key: string]: string | MessageTree;
};
