export interface ArticlePublic {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  content: string;
  role: string;
  created_at: string;
  modified_at: string;
}
