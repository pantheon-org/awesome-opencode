export interface Category {
  slug: string;
  title: string;
  description: string;
}

export interface CategoriesConfig {
  categories: Category[];
}
