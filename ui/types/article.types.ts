export interface ArticlePublic {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  content: string;
  is_publicly_accessible: boolean;
  role: string;
  created_at: string;
  modified_at: string;
}
